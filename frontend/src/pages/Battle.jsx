import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../hooks/api";

const C = {
  bg: "#0B0E15",
  surface: "#1D2433",
  surfaceAlt: "#252E40",
  paper: "#ECE4D3",
  paperDim: "#9B9485",
  brass: "#C3A35F",
  accent: "#9B3A2C",
  accentBright: "#E14430",
  line: "rgba(236,228,211,0.10)",
};

const ZONES = [
  { key: "head", label: "머리", kanji: "面", icon: "⬆" },
  { key: "wrist", label: "손목", kanji: "小手", icon: "➡" },
  { key: "waist", label: "허리", kanji: "胴", icon: "⬇" },
  { key: "thrust", label: "찌르기", kanji: "突", icon: "⬛" },
];

const TIME_LIMIT = 60;

/* ── SVG Kendo Fighter ── */
function KendoSVG({ facing = "right", pose = "ready", hit = false, attackZone = null }) {
  const flip = facing === "left" ? -1 : 1;

  const getShinaiAngle = () => {
    if (pose === "attack") {
      switch (attackZone) {
        case "head": return -75;
        case "wrist": return -35;
        case "waist": return 30;
        case "thrust": return -10;
        default: return -45;
      }
    }
    if (pose === "hit") return -20;
    return -45;
  };

  const getBodyShift = () => {
    if (pose === "attack") return { x: flip * 12, y: attackZone === "head" ? -6 : 0 };
    if (pose === "hit") return { x: flip * -8, y: 2 };
    return { x: 0, y: 0 };
  };

  const shift = getBodyShift();
  const shinaiAngle = getShinaiAngle();

  return (
    <svg viewBox="0 0 120 200" width="120" height="200" style={{
      transform: `scaleX(${flip})`,
      filter: hit ? "brightness(2.5) drop-shadow(0 0 20px rgba(255,200,50,0.8))" : "drop-shadow(2px 4px 8px rgba(0,0,0,0.5))",
      transition: "filter 0.15s ease",
    }}>
      <g transform={`translate(${shift.x}, ${shift.y})`} style={{ transition: "transform 0.15s ease-out" }}>
        {/* Feet */}
        <ellipse cx="48" cy="192" rx="10" ry="4" fill="#1a1a2e" />
        <ellipse cx="68" cy="194" rx="10" ry="4" fill="#1a1a2e" />

        {/* Hakama (pleated skirt) */}
        <path d="M38,120 L30,190 Q50,195 60,190 Q70,195 90,190 L78,120 Z"
          fill="url(#hakama)" stroke="#0a1628" strokeWidth="0.5" />
        {/* Hakama pleats */}
        <line x1="45" y1="122" x2="40" y2="188" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
        <line x1="52" y1="122" x2="50" y2="188" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
        <line x1="58" y1="120" x2="58" y2="188" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
        <line x1="64" y1="122" x2="66" y2="188" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
        <line x1="71" y1="122" x2="76" y2="188" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />

        {/* Tare (waist protector) */}
        <rect x="36" y="112" width="44" height="14" rx="2" fill="#1a1535" stroke="#3a2a5a" strokeWidth="0.8" />
        {[0,1,2,3,4].map(i => (
          <rect key={i} x={38 + i * 8} y="118" width={i === 2 ? 9 : 7} height="10" rx="1"
            fill="#1a1535" stroke="#3a2a5a" strokeWidth="0.5" />
        ))}

        {/* Do (chest armor) */}
        <path d="M36,70 Q35,75 36,112 L80,112 Q81,75 80,70 Q70,65 58,65 Q46,65 36,70 Z"
          fill="url(#doArmor)" stroke="#4a3a6a" strokeWidth="1" />
        <path d="M40,74 Q39,78 40,108 L76,108 Q77,78 76,74 Q68,70 58,70 Q48,70 40,74 Z"
          fill="url(#doLacquer)" opacity="0.85" />
        {/* Do decorative lines */}
        <path d="M42,80 Q58,76 74,80" fill="none" stroke="rgba(195,163,95,0.3)" strokeWidth="0.5" />
        <path d="M42,90 Q58,86 74,90" fill="none" stroke="rgba(195,163,95,0.3)" strokeWidth="0.5" />

        {/* Mune-ate (chest plate strings) */}
        <line x1="48" y1="68" x2="42" y2="58" stroke="#4a3a6a" strokeWidth="1.5" />
        <line x1="68" y1="68" x2="74" y2="58" stroke="#4a3a6a" strokeWidth="1.5" />

        {/* Kote (left glove) */}
        <g transform={pose === "attack" && attackZone === "wrist" ? "translate(-3,-4)" : ""} style={{ transition: "transform 0.15s" }}>
          <ellipse cx="32" cy="88" rx="8" ry="10" fill="#1a1535" stroke="#3a2a5a" strokeWidth="0.8" />
          <ellipse cx="32" cy="92" rx="6" ry="4" fill="#2a2040" />
        </g>

        {/* Kote (right glove - gripping shinai) */}
        <g transform={pose === "attack" ? "translate(2,-2)" : ""} style={{ transition: "transform 0.15s" }}>
          <ellipse cx="82" cy="85" rx="8" ry="10" fill="#1a1535" stroke="#3a2a5a" strokeWidth="0.8" />
          <ellipse cx="82" cy="89" rx="6" ry="4" fill="#2a2040" />
        </g>

        {/* Men (helmet) */}
        <g>
          {/* Men-buchi (top) */}
          <ellipse cx="58" cy="32" rx="20" ry="6" fill="#2a2040" stroke="#4a3a6a" strokeWidth="0.8" />
          {/* Men body */}
          <path d="M38,32 Q36,42 38,58 Q48,62 58,62 Q68,62 78,58 Q80,42 78,32 Z"
            fill="url(#menArmor)" stroke="#4a3a6a" strokeWidth="1" />
          {/* Mengane (face grille) */}
          <g>
            {[0,1,2,3,4,5,6].map(i => (
              <line key={i} x1="42" y1={38 + i * 3} x2="74" y2={38 + i * 3}
                stroke="#5a4a7a" strokeWidth="1.2" strokeLinecap="round" />
            ))}
          </g>
          {/* Tsuki-dare (throat protector) */}
          <rect x="44" y="58" width="28" height="8" rx="2" fill="#1a1535" stroke="#3a2a5a" strokeWidth="0.5" />
          {/* Men-himo (ties) */}
          <path d="M38,40 Q28,45 22,55" fill="none" stroke="#4a3a6a" strokeWidth="1.5" />
          <path d="M78,40 Q88,45 94,55" fill="none" stroke="#4a3a6a" strokeWidth="1.5" />
        </g>

        {/* Shinai (bamboo sword) */}
        <g transform={`rotate(${shinaiAngle}, 82, 85)`} style={{ transition: "transform 0.13s ease-out" }}>
          <line x1="82" y1="85" x2="82" y2="5" stroke="url(#shinaiGrad)" strokeWidth="3.5" strokeLinecap="round" />
          {/* Tsuba (guard) */}
          <circle cx="82" cy="72" r="4" fill="#6b4e1b" stroke="#8b6914" strokeWidth="0.5" />
          {/* Nakayui (leather wrap) */}
          <rect x="80" y="35" width="4" height="6" rx="1" fill="#8b4513" />
          {/* Sakigawa (tip leather) */}
          <rect x="80.5" y="5" width="3" height="8" rx="1.5" fill="#f5f0e0" />
          {/* Tsuka (handle wrap) */}
          <rect x="80" y="75" width="4" height="12" rx="1" fill="#2a1a0a" />
        </g>
      </g>

      {/* Gradients */}
      <defs>
        <linearGradient id="hakama" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1b3a" />
          <stop offset="50%" stopColor="#162d5a" />
          <stop offset="100%" stopColor="#0d1b3a" />
        </linearGradient>
        <linearGradient id="doArmor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1535" />
          <stop offset="100%" stopColor="#2a2050" />
        </linearGradient>
        <linearGradient id="doLacquer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8b2500" />
          <stop offset="50%" stopColor="#a03000" />
          <stop offset="100%" stopColor="#6b1a00" />
        </linearGradient>
        <linearGradient id="menArmor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2a2040" />
          <stop offset="100%" stopColor="#1a1030" />
        </linearGradient>
        <linearGradient id="shinaiGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#a08050" />
          <stop offset="50%" stopColor="#d4b876" />
          <stop offset="100%" stopColor="#f0e0c0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Slash Effect ── */
function SlashEffect({ zone, visible, isPlayer }) {
  if (!visible) return null;
  const paths = {
    head: "M 10,10 Q 50,5 90,15",
    wrist: "M 15,50 Q 50,40 85,55",
    waist: "M 10,70 Q 50,80 90,65",
    thrust: "M 50,20 L 50,80",
  };
  return (
    <svg viewBox="0 0 100 100" style={{
      position: "absolute",
      inset: 0,
      zIndex: 10,
      pointerEvents: "none",
      opacity: 0,
      animation: "slashAnim 0.4s ease-out forwards",
    }}>
      <path d={paths[zone] || paths.head}
        fill="none"
        stroke={isPlayer ? C.brass : C.accentBright}
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#glow)"
        strokeDasharray="200"
        strokeDashoffset="200"
        style={{ animation: "slashDraw 0.3s ease-out 0.05s forwards" }}
      />
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

/* ── Opponent Telegraph ── */
function TelegraphIndicator({ zone, visible }) {
  if (!visible) return null;
  const positions = {
    head: { top: "8%", left: "50%", transform: "translateX(-50%)" },
    wrist: { top: "38%", right: "5%" },
    waist: { top: "55%", left: "50%", transform: "translateX(-50%)" },
    thrust: { top: "30%", left: "50%", transform: "translateX(-50%)" },
  };
  return (
    <div style={{
      position: "absolute",
      ...positions[zone],
      width: 40, height: 40,
      borderRadius: "50%",
      border: `2px solid ${C.accentBright}`,
      background: "rgba(225,68,48,0.15)",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "telegraphPulse 0.5s ease-in-out infinite",
      zIndex: 5,
    }}>
      <span style={{ fontSize: 11, color: C.accentBright, fontWeight: 700 }}>!</span>
    </div>
  );
}

export default function Battle() {
  const { studentId } = useParams();
  const [phase, setPhase] = useState("ready");
  const [battleInfo, setBattleInfo] = useState(null);
  const [score, setScore] = useState({ player: 0, opponent: 0 });
  const [roundLog, setRoundLog] = useState([]);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [lastAction, setLastAction] = useState(null);
  const [playerPose, setPlayerPose] = useState("ready");
  const [opponentPose, setOpponentPose] = useState("ready");
  const [playerHit, setPlayerHit] = useState(false);
  const [opponentHit, setOpponentHit] = useState(false);
  const [attackZone, setAttackZone] = useState(null);
  const [opponentZone, setOpponentZone] = useState(null);
  const [shake, setShake] = useState(false);
  const [showSlash, setShowSlash] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [telegraph, setTelegraph] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef(null);
  const telegraphRef = useRef(null);

  const startBattle = useCallback(async () => {
    setPhase("countdown");
    setCountdown(3);
    const info = await api.battleStart({ student_id: Number(studentId), opponent_type: "ai" });
    setBattleInfo(info);
    setScore({ player: 0, opponent: 0 });
    setRoundLog([]);
    setResult(null);
    setTimeLeft(TIME_LIMIT);
    setLastAction(null);
    setShowResult(false);
    setPlayerPose("ready");
    setOpponentPose("ready");
  }, [studentId]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) {
      setPhase("fight");
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 800);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "fight") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          api.battleTimeout(Number(studentId)).then((res) => {
            setResult(res);
            setPhase("result");
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    const doTelegraph = () => {
      const zones = ["head", "wrist", "waist", "thrust"];
      const z = zones[Math.floor(Math.random() * zones.length)];
      setTelegraph(z);
      setTimeout(() => setTelegraph(null), 1500);
      telegraphRef.current = setTimeout(doTelegraph, 2500 + Math.random() * 2000);
    };
    telegraphRef.current = setTimeout(doTelegraph, 1500);

    return () => {
      clearInterval(timerRef.current);
      clearTimeout(telegraphRef.current);
    };
  }, [phase, studentId]);

  async function attack(zone) {
    if (phase !== "fight") return;

    setAttackZone(zone);
    setPlayerPose("attack");
    setShowSlash(true);
    setShowResult(false);

    const timing = telegraph && telegraph === zone ? 0.9 : 0.3 + Math.random() * 0.4;

    const res = await api.battleAction(Number(studentId), { zone, timing });
    setLastAction(res);
    setScore(res.score);
    setRoundLog((prev) => [...prev, res]);
    setOpponentZone(res.opponent?.zone);
    setShowResult(true);

    if (res.player.hit) {
      setOpponentHit(true);
      setOpponentPose("hit");
      setShake(true);
      setTimeout(() => { setOpponentHit(false); setShake(false); }, 350);
    }

    setTimeout(() => {
      setOpponentPose("attack");
      if (res.opponent.hit) {
        setTimeout(() => {
          setPlayerHit(true);
          setShake(true);
          setTimeout(() => { setPlayerHit(false); setShake(false); }, 350);
        }, 150);
      }
    }, 300);

    setTimeout(() => {
      setPlayerPose("ready");
      setOpponentPose("ready");
      setShowSlash(false);
    }, 700);

    setTimeout(() => setShowResult(false), 1500);

    if (res.finished) {
      clearInterval(timerRef.current);
      clearTimeout(telegraphRef.current);
      setTimeout(() => {
        setResult(res);
        setPhase("result");
      }, 1000);
      await api.battleFinish(Number(studentId)).catch(() => {});
    }
  }

  const gradeColor = (g) =>
    g === "perfect" ? C.brass : g === "good" ? "#7FA876" : C.accentBright;

  /* ── Countdown ── */
  if (phase === "countdown") {
    const labels = ["始め!", "構え!", "礼!"];
    return (
      <div style={{
        height: "80vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: `radial-gradient(circle at 50% 50%, rgba(155,58,44,0.1) 0%, transparent 70%)`,
      }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginBottom: 40 }}>
          <KendoSVG facing="right" pose="ready" />
          <KendoSVG facing="left" pose="ready" />
        </div>
        <p key={countdown} style={{
          fontFamily: "serif", fontSize: 52, fontWeight: 900,
          color: countdown === 0 ? C.brass : C.paper,
          textShadow: `0 0 40px ${countdown === 0 ? C.brass : "rgba(236,228,211,0.4)"}`,
          animation: "hitPop 0.6s ease-out",
        }}>
          {countdown > 0 ? labels[countdown - 1] : "始め!"}
        </p>
      </div>
    );
  }

  /* ── Ready ── */
  if (phase === "ready") {
    return (
      <div style={{ padding: "12px 0", animation: "fadeIn 0.3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <p style={{ fontFamily: "serif", fontSize: 32, fontWeight: 900, color: C.brass }}>対決</p>
          <p style={{ fontSize: 12, color: C.paperDim, marginTop: 4 }}>AI 가상 상대와 검도 시합</p>
        </div>

        {/* Fighters preview */}
        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          gap: 16, padding: "24px 0",
          background: `radial-gradient(ellipse at 50% 90%, rgba(195,163,95,0.06) 0%, transparent 60%)`,
          borderRadius: 16, marginBottom: 16,
        }}>
          <div style={{ textAlign: "center" }}>
            <KendoSVG facing="right" pose="ready" />
            <p style={{ fontSize: 12, color: C.paper, fontWeight: 600, marginTop: 8 }}>나</p>
          </div>
          <div style={{
            fontFamily: "serif", fontSize: 36, fontWeight: 900,
            color: C.accent, padding: "0 8px", marginBottom: 60,
          }}>VS</div>
          <div style={{ textAlign: "center" }}>
            <KendoSVG facing="left" pose="ready" />
            <p style={{ fontSize: 12, color: C.paper, fontWeight: 600, marginTop: 8 }}>AI</p>
          </div>
        </div>

        <div style={{
          padding: 16, borderRadius: 12,
          background: C.surface, border: `1px solid ${C.line}`, marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.paper, marginBottom: 10 }}>시합 규칙</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: C.paperDim }}>
            <span>• 삼본승부 — 2본 선취 시 승리</span>
            <span>• 제한시간 {TIME_LIMIT}초</span>
            <span>• 상대의 빈틈(❗)이 보이면 해당 부위 공격</span>
            <span>• 타이밍이 맞으면 Perfect → 유효타 확률 UP</span>
          </div>
        </div>

        <button onClick={startBattle} style={{
          width: "100%", padding: "16px 0", borderRadius: 12,
          fontSize: 15, fontWeight: 700,
          background: `linear-gradient(135deg, ${C.accent} 0%, #7A2E22 100%)`,
          color: C.paper, border: "none", cursor: "pointer",
          boxShadow: `0 4px 24px rgba(155,58,44,0.5)`,
        }}>
          시합 시작
        </button>
      </div>
    );
  }

  /* ── Result ── */
  if (phase === "result") {
    const won = result?.result === "win";
    const lost = result?.result === "lose";
    return (
      <div style={{ padding: "12px 0", animation: "fadeIn 0.3s ease" }}>
        <div style={{
          textAlign: "center", padding: "28px 0", marginBottom: 16,
          background: won ? "rgba(195,163,95,0.08)" : lost ? "rgba(225,68,48,0.06)" : "rgba(155,148,133,0.06)",
          borderRadius: 16,
        }}>
          <p style={{
            fontFamily: "serif", fontSize: 56, fontWeight: 900,
            color: won ? C.brass : lost ? C.accentBright : C.paperDim,
            textShadow: won ? `0 0 50px rgba(195,163,95,0.5)` : "none",
          }}>
            {won ? "勝利" : lost ? "敗北" : "引分"}
          </p>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 20, marginTop: 12,
          }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 10, color: C.paperDim }}>나</p>
              <p style={{ fontFamily: "serif", fontSize: 32, fontWeight: 700, color: C.paper }}>{score.player}</p>
            </div>
            <span style={{ fontSize: 20, color: C.paperDim }}>—</span>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: 10, color: C.paperDim }}>상대</p>
              <p style={{ fontFamily: "serif", fontSize: 32, fontWeight: 700, color: C.paper }}>{score.opponent}</p>
            </div>
          </div>
        </div>

        <div style={{
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          gap: 16, padding: "16px 0", marginBottom: 16,
        }}>
          <KendoSVG facing="right" pose={won ? "attack" : "ready"} attackZone="head" />
          <KendoSVG facing="left" pose={lost ? "attack" : "hit"} attackZone="head" hit={won} />
        </div>

        {roundLog.length > 0 && (
          <div style={{
            padding: 14, borderRadius: 12, marginBottom: 16,
            background: C.surface, border: `1px solid ${C.line}`,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.paper, marginBottom: 8 }}>시합 기록</p>
            {roundLog.map((r) => (
              <div key={r.round} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: 11, padding: "6px 0",
                borderBottom: `1px solid ${C.line}`,
              }}>
                <span style={{ color: C.paperDim, width: 30 }}>R{r.round}</span>
                <span style={{ color: gradeColor(r.player.timing_grade), flex: 1, textAlign: "center", fontWeight: 600 }}>
                  {ZONES.find(z => z.key === r.player.zone)?.kanji}{" "}
                  {r.player.timing_grade === "perfect" ? "完璧" : r.player.timing_grade === "good" ? "有効" : "空振"}
                  {r.player.hit ? " ✓" : ""}
                </span>
                <span style={{ color: r.opponent.hit ? C.accentBright : C.paperDim, width: 60, textAlign: "right" }}>
                  상대 {r.opponent.hit ? "유효" : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setPhase("ready")} style={{
          width: "100%", padding: "16px 0", borderRadius: 12,
          fontSize: 15, fontWeight: 700,
          background: C.accent, color: C.paper, border: "none", cursor: "pointer",
        }}>
          다시 시합
        </button>
      </div>
    );
  }

  /* ── Fight ── */
  return (
    <div style={{
      transform: shake ? `translate(${Math.random() > 0.5 ? 4 : -4}px, ${Math.random() > 0.5 ? 2 : -2}px)` : "none",
      transition: "transform 0.05s",
    }}>
      {/* Score HUD */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 4px", marginBottom: 4,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: C.paperDim }}>나</span>
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                width: 20, height: 20, borderRadius: "50%",
                background: i < score.player ? C.accent : "transparent",
                border: `2px solid ${i < score.player ? C.accent : C.line}`,
                boxShadow: i < score.player ? `0 0 8px ${C.accent}` : "none",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `2.5px solid ${timeLeft <= 10 ? C.accentBright : C.brass}`,
          color: timeLeft <= 10 ? C.accentBright : C.brass,
          fontFamily: "monospace", fontSize: 20, fontWeight: 800,
          background: timeLeft <= 10 ? "rgba(225,68,48,0.1)" : "transparent",
          transition: "all 0.3s",
        }}>
          {timeLeft}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {[0, 1].map(i => (
              <div key={i} style={{
                width: 20, height: 20, borderRadius: "50%",
                background: i < score.opponent ? C.accentBright : "transparent",
                border: `2px solid ${i < score.opponent ? C.accentBright : C.line}`,
                boxShadow: i < score.opponent ? `0 0 8px ${C.accentBright}` : "none",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: C.paperDim }}>상대</span>
        </div>
      </div>

      {/* Arena */}
      <div style={{
        position: "relative",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        gap: 0, height: 230,
        padding: "16px 0",
        background: `radial-gradient(ellipse at 50% 100%, rgba(155,58,44,0.06) 0%, transparent 60%)`,
        borderRadius: 16,
        overflow: "hidden",
      }}>
        {/* Floor line */}
        <div style={{
          position: "absolute", bottom: 10, left: "10%", right: "10%",
          height: 2, background: "rgba(195,163,95,0.15)", borderRadius: 1,
        }} />

        <div style={{ position: "relative" }}>
          <KendoSVG facing="right" pose={playerPose} hit={playerHit} attackZone={attackZone} />
        </div>
        <div style={{ position: "relative" }}>
          <KendoSVG facing="left" pose={opponentPose} hit={opponentHit} attackZone={opponentZone} />
          <TelegraphIndicator zone={telegraph} visible={!!telegraph} />
        </div>

        {/* Slash effect */}
        {showSlash && <SlashEffect zone={attackZone} visible={showSlash} isPlayer={true} />}
      </div>

      {/* Action feedback */}
      <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {showResult && lastAction && (
          <div key={lastAction.round} style={{ textAlign: "center", animation: "hitPop 0.3s ease-out" }}>
            <span style={{
              fontFamily: "serif", fontSize: 22, fontWeight: 900,
              color: gradeColor(lastAction.player.timing_grade),
              textShadow: `0 0 15px ${gradeColor(lastAction.player.timing_grade)}`,
            }}>
              {lastAction.player.timing_grade === "perfect" ? "完璧" : lastAction.player.timing_grade === "good" ? "有効" : "空振"}
            </span>
            <span style={{ fontSize: 12, color: C.paperDim, marginLeft: 8 }}>
              {lastAction.player.hit ? "유효타!" : ""}
              {lastAction.opponent.hit ? " · 상대 반격!" : ""}
            </span>
          </div>
        )}
        {!showResult && telegraph && (
          <p style={{ fontSize: 12, color: C.accentBright, animation: "fadeIn 0.2s ease" }}>
            상대의 빈틈이 보인다! → {ZONES.find(z => z.key === telegraph)?.kanji} 공격!
          </p>
        )}
      </div>

      {/* Zone buttons */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}>
        {ZONES.map((z) => {
          const isTelegraph = telegraph === z.key;
          return (
            <button
              key={z.key}
              onClick={() => attack(z.key)}
              style={{
                position: "relative",
                background: isTelegraph ? "rgba(195,163,95,0.12)" : C.surfaceAlt,
                border: `1.5px solid ${isTelegraph ? C.brass : C.line}`,
                borderRadius: 14,
                padding: "18px 0",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isTelegraph ? `0 0 16px rgba(195,163,95,0.2)` : "none",
              }}
              onPointerDown={(e) => {
                e.currentTarget.style.transform = "scale(0.93)";
                e.currentTarget.style.background = "rgba(155,58,44,0.2)";
              }}
              onPointerUp={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = isTelegraph ? "rgba(195,163,95,0.12)" : C.surfaceAlt;
              }}
              onPointerLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.background = isTelegraph ? "rgba(195,163,95,0.12)" : C.surfaceAlt;
              }}
            >
              {isTelegraph && (
                <div style={{
                  position: "absolute", top: 4, right: 6,
                  fontSize: 10, color: C.brass, fontWeight: 700,
                  animation: "telegraphPulse 0.5s ease-in-out infinite",
                }}>빈틈!</div>
              )}
              <span style={{ fontFamily: "serif", fontSize: 26, fontWeight: 800, color: C.brass }}>{z.kanji}</span>
              <span style={{ fontSize: 11, color: C.paperDim }}>{z.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes hitPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes slashAnim {
          0% { opacity: 0; }
          20% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes slashDraw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes telegraphPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
