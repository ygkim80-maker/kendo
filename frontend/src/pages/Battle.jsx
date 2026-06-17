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
  floor: "#D4B88C",
  floorLine: "#2E7D32",
  blueLine: "#1565C0",
};

const ZONES = [
  { key: "head", label: "머리", kanji: "面" },
  { key: "wrist", label: "손목", kanji: "小手" },
  { key: "waist", label: "허리", kanji: "胴" },
  { key: "thrust", label: "찌르기", kanji: "突" },
];

const TIME_LIMIT = 60;

/* ── Realistic Kendo Fighter SVG ── */
function KendoFighter({ facing = "right", pose = "ready", hit = false, attackZone = null, scale = 1 }) {
  const flip = facing === "left" ? -1 : 1;

  const getShinaiTransform = () => {
    if (pose === "attack") {
      switch (attackZone) {
        case "head": return "rotate(-80, 58, 95)";
        case "wrist": return "rotate(-30, 58, 95)";
        case "waist": return "rotate(35, 58, 95)";
        case "thrust": return "rotate(-5, 58, 95) translate(15, -5)";
        default: return "rotate(-15, 58, 95)";
      }
    }
    if (pose === "hit") return "rotate(-25, 58, 95)";
    return "rotate(-12, 58, 95)";
  };

  const bodyShift = pose === "attack" ? `translate(${flip * 8}, -3)` :
                    pose === "hit" ? `translate(${flip * -5}, 2)` : "";

  return (
    <svg viewBox="0 0 120 300" width={80 * scale} height={200 * scale} style={{
      transform: `scaleX(${flip})`,
      filter: hit
        ? "brightness(2) drop-shadow(0 0 15px rgba(255,255,200,0.8))"
        : "drop-shadow(1px 3px 6px rgba(0,0,0,0.4))",
      transition: "filter 0.12s ease",
    }}>
      <g transform={bodyShift} style={{ transition: "transform 0.18s ease-out" }}>
        {/* ── Feet ── */}
        <ellipse cx="50" cy="292" rx="11" ry="5" fill="#1a1a2e" opacity="0.7" />
        <ellipse cx="70" cy="295" rx="11" ry="5" fill="#1a1a2e" opacity="0.7" />

        {/* ── Hakama (wide pleated skirt) ── */}
        <path d="M32,155 Q28,220 24,288 Q45,298 60,295 Q75,298 96,288 Q92,220 88,155 Z"
          fill="#0d1b3a" stroke="#0a1628" strokeWidth="0.5" />
        <path d="M32,155 Q28,220 24,288 Q45,298 60,295 Q75,298 96,288 Q92,220 88,155 Z"
          fill="url(#hakamaGrad)" />
        {/* Hakama pleats */}
        {[38, 46, 54, 60, 68, 76].map((x, i) => (
          <line key={i} x1={x} y1="158" x2={x + (i < 3 ? -3 : 3)} y2="290"
            stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
        ))}
        {/* Hakama front overlap */}
        <path d="M44,155 L42,220 Q55,225 60,222 Q65,225 78,220 L76,155 Z"
          fill="rgba(13,27,58,0.3)" />

        {/* ── Obi (belt) ── */}
        <rect x="34" y="148" width="52" height="10" rx="2" fill="#1a1535" />

        {/* ── Tare (waist protector) ── */}
        <g>
          {[0,1,2,3,4].map(i => (
            <path key={i}
              d={`M${36 + i * 9},155 L${34 + i * 9},178 L${34 + i * 9 + (i === 2 ? 12 : 9)},178 L${36 + i * 9 + (i === 2 ? 12 : 9)},155 Z`}
              fill="#1a1535" stroke="#2a2050" strokeWidth="0.5" />
          ))}
        </g>

        {/* ── Keikogi (upper garment under do) ── */}
        <path d="M36,85 L32,150 L88,150 L84,85 Z" fill="#0d1b3a" />
        {/* Sleeves */}
        <path d="M36,88 L18,105 L22,118 L38,108 Z" fill="#0d1b3a" stroke="#0a1628" strokeWidth="0.3" />
        <path d="M84,88 L102,105 L98,118 L82,108 Z" fill="#0d1b3a" stroke="#0a1628" strokeWidth="0.3" />

        {/* ── Do (chest armor) ── */}
        <path d="M36,88 Q34,95 36,145 L84,145 Q86,95 84,88 Q72,82 60,82 Q48,82 36,88 Z"
          fill="#1a1535" stroke="#3a2a5a" strokeWidth="0.8" />
        {/* Do lacquer panel */}
        <path d="M40,93 Q39,98 40,140 L80,140 Q81,98 80,93 Q70,88 60,88 Q50,88 40,93 Z"
          fill="#5a1a00" opacity="0.7" />
        <path d="M40,93 Q39,98 40,140 L80,140 Q81,98 80,93 Q70,88 60,88 Q50,88 40,93 Z"
          fill="url(#doGrad)" opacity="0.85" />
        {/* Do mune (upper chest plate) */}
        <path d="M38,88 Q60,82 82,88 L82,96 Q60,90 38,96 Z"
          fill="#1a1535" stroke="#3a2a5a" strokeWidth="0.5" />

        {/* ── Do himo (chest ties) ── */}
        <line x1="40" y1="90" x2="28" y2="78" stroke="#3a2a5a" strokeWidth="1.5" />
        <line x1="80" y1="90" x2="92" y2="78" stroke="#3a2a5a" strokeWidth="1.5" />
        <circle cx="28" cy="78" r="2" fill="#3a2a5a" />
        <circle cx="92" cy="78" r="2" fill="#3a2a5a" />

        {/* ── Kote (left glove) ── */}
        <g transform={pose === "attack" ? "translate(-2,-3)" : ""} style={{ transition: "transform 0.15s" }}>
          <path d="M18,108 Q14,112 16,125 Q18,130 24,130 Q28,128 28,118 L26,108 Z"
            fill="#1a1535" stroke="#2a2050" strokeWidth="0.5" />
          <ellipse cx="20" cy="128" rx="5" ry="3" fill="#2a2040" />
        </g>

        {/* ── Kote (right glove - grips shinai) ── */}
        <g transform={pose === "attack" ? "translate(3,-2)" : ""} style={{ transition: "transform 0.15s" }}>
          <path d="M92,108 Q96,112 94,125 Q92,130 86,130 Q82,128 82,118 L84,108 Z"
            fill="#1a1535" stroke="#2a2050" strokeWidth="0.5" />
          <ellipse cx="90" cy="128" rx="5" ry="3" fill="#2a2040" />
        </g>

        {/* ── Men (helmet) ── */}
        <g>
          {/* Men body */}
          <path d="M38,40 Q36,50 38,78 Q48,84 60,84 Q72,84 82,78 Q84,50 82,40 Q72,32 60,32 Q48,32 38,40 Z"
            fill="#1a1030" stroke="#3a2a5a" strokeWidth="0.8" />
          {/* Men top pad */}
          <ellipse cx="60" cy="36" rx="22" ry="8" fill="#2a2040" stroke="#3a2a5a" strokeWidth="0.5" />
          {/* Mengane (face grille) */}
          {[0,1,2,3,4,5,6,7,8].map(i => (
            <line key={i} x1="42" y1={44 + i * 3.5} x2="78" y2={44 + i * 3.5}
              stroke="#4a3a6a" strokeWidth="1" strokeLinecap="round" />
          ))}
          {/* Tsuki-dare (throat guard) */}
          <path d="M46,78 L44,86 Q52,90 60,90 Q68,90 76,86 L74,78 Z"
            fill="#1a1535" stroke="#2a2050" strokeWidth="0.5" />
          {/* Men-himo (ties flowing back) */}
          <path d="M38,48 Q26,55 18,70 Q16,78 20,82" fill="none" stroke="#2a2050" strokeWidth="2" />
          <path d="M82,48 Q94,55 102,70 Q104,78 100,82" fill="none" stroke="#2a2050" strokeWidth="2" />
          {/* Tenugui (cloth under men) visible at back */}
          <rect x="48" y="30" width="24" height="6" rx="2" fill="#f0f0f0" opacity="0.3" />
        </g>

        {/* ── Shinai (bamboo sword) - chudan no kamae ── */}
        <g transform={getShinaiTransform()} style={{ transition: "transform 0.15s ease-out" }}>
          {/* Main shaft */}
          <line x1="90" y1="120" x2="155" y2="60"
            stroke="#c4a050" strokeWidth="3" strokeLinecap="round" />
          <line x1="90" y1="120" x2="155" y2="60"
            stroke="url(#shinaiBody)" strokeWidth="2.5" strokeLinecap="round" />
          {/* Tsuba (hand guard) */}
          <circle cx="95" cy="117" r="4.5" fill="#6b4e1b" stroke="#8b6914" strokeWidth="0.5" />
          {/* Nakayui (center leather) */}
          <rect x="124" y="84" width="5" height="4" rx="1" fill="#8b4513"
            transform="rotate(-37, 126, 86)" />
          {/* Sakigawa (tip) */}
          <rect x="150" y="57" width="8" height="4" rx="2" fill="#f5f0e0"
            transform="rotate(-37, 154, 59)" />
          {/* Tsuka-gawa (handle) */}
          <line x1="85" y1="123" x2="92" y2="119"
            stroke="#2a1a0a" strokeWidth="4" strokeLinecap="round" />
        </g>
      </g>

      <defs>
        <linearGradient id="hakamaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1b3a" />
          <stop offset="40%" stopColor="#152852" />
          <stop offset="60%" stopColor="#152852" />
          <stop offset="100%" stopColor="#0d1b3a" />
        </linearGradient>
        <linearGradient id="doGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a2200" />
          <stop offset="40%" stopColor="#962c00" />
          <stop offset="100%" stopColor="#5a1800" />
        </linearGradient>
        <linearGradient id="shinaiBody" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a08050" />
          <stop offset="50%" stopColor="#d4b876" />
          <stop offset="100%" stopColor="#e8d8a8" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Referee SVG (realistic) ── */
function Referee({ position, flagUp, flagColor = "red" }) {
  const posStyles = {
    left: { position: "absolute", left: 8, top: "45%", transform: "translateY(-50%)" },
    right: { position: "absolute", right: 8, top: "45%", transform: "translateY(-50%)" },
    main: { position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)" },
  };

  return (
    <div style={posStyles[position]}>
      <svg viewBox="0 0 40 70" width={position === "main" ? 28 : 22} height={position === "main" ? 49 : 38}>
        {/* Head */}
        <circle cx="20" cy="10" r="7" fill="#d4a574" />
        {/* Hair */}
        <path d="M13,8 Q15,3 20,3 Q25,3 27,8" fill="#2a1a0a" />
        {/* White shirt */}
        <path d="M10,17 L8,45 L32,45 L30,17 Q25,14 20,14 Q15,14 10,17 Z"
          fill="#f0f0f0" stroke="#ddd" strokeWidth="0.3" />
        {/* Collar */}
        <path d="M16,17 L20,22 L24,17" fill="none" stroke="#ccc" strokeWidth="0.5" />
        {/* Tie */}
        <rect x="19" y="17" width="2" height="15" rx="0.5" fill="#8b1a1a" />
        {/* Dark pants */}
        <path d="M10,45 L8,68 L18,68 L20,50 L22,68 L32,68 L30,45 Z"
          fill="#2a2a2a" />
        {/* Arms */}
        <line x1="10" y1="20" x2="2" y2="35" stroke="#f0f0f0" strokeWidth="3" strokeLinecap="round" />
        <line x1="30" y1="20" x2="38" y2="35" stroke="#f0f0f0" strokeWidth="3" strokeLinecap="round" />
        {/* Hands */}
        <circle cx="2" cy="36" r="2.5" fill="#d4a574" />
        <circle cx="38" cy="36" r="2.5" fill="#d4a574" />

        {/* Flags */}
        {/* Left hand - red flag */}
        <line x1="2" y1="36" x2="2" y2="18" stroke="#8b6914" strokeWidth="1" />
        <rect x="-4" y={flagUp && flagColor === "red" ? 6 : 18} width="10" height="7" rx="0.5"
          fill="#E53935" opacity={flagUp && flagColor === "red" ? 1 : 0.4}
          style={{ transition: "y 0.3s ease, opacity 0.3s" }}>
          {flagUp && flagColor === "red" && <animate attributeName="y" values="6;4;6" dur="0.4s" repeatCount="3" />}
        </rect>

        {/* Right hand - white flag */}
        <line x1="38" y1="36" x2="38" y2="18" stroke="#8b6914" strokeWidth="1" />
        <rect x="34" y={flagUp && flagColor === "white" ? 6 : 18} width="10" height="7" rx="0.5"
          fill="#f0f0f0" stroke="#ccc" strokeWidth="0.3"
          opacity={flagUp && flagColor === "white" ? 1 : 0.4}
          style={{ transition: "y 0.3s ease, opacity 0.3s" }}>
          {flagUp && flagColor === "white" && <animate attributeName="y" values="6;4;6" dur="0.4s" repeatCount="3" />}
        </rect>
      </svg>
    </div>
  );
}

/* ── Court (wooden floor with lines) ── */
function Court({ children, height = 380 }) {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      height,
      background: `linear-gradient(180deg, #c8a472 0%, ${C.floor} 20%, ${C.floor} 80%, #c8a472 100%)`,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "inset 0 0 30px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)",
    }}>
      {/* Wood grain lines */}
      {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", top: 0, bottom: 0,
          left: `${(i + 1) * 6}%`, width: 1,
          background: "rgba(139,107,66,0.25)",
        }} />
      ))}
      {/* Court boundary - green */}
      <div style={{
        position: "absolute", top: 16, left: 16, right: 16, bottom: 16,
        border: `2.5px solid ${C.floorLine}`,
        borderRadius: 2,
      }} />
      {/* Blue side lines */}
      <div style={{
        position: "absolute", top: 14, left: 14, right: 14, bottom: 14,
        border: `1px solid ${C.blueLine}`,
        borderRadius: 2, opacity: 0.4,
      }} />
      {/* Center circle */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        width: 100, height: 60,
        border: "1.5px solid rgba(255,255,255,0.2)",
        borderRadius: "50%",
        transform: "translate(-50%, -50%)",
      }} />
      {/* Center cross marks */}
      <div style={{
        position: "absolute", top: "50%", left: "35%",
        width: 24, height: 2.5, marginTop: -1,
        background: C.floorLine, borderRadius: 1,
      }} />
      <div style={{
        position: "absolute", top: "50%", right: "35%",
        width: 24, height: 2.5, marginTop: -1,
        background: C.floorLine, borderRadius: 1,
      }} />
      {/* Red boundary lines */}
      <div style={{
        position: "absolute", top: "25%", left: "20%", right: "20%",
        height: 1.5, background: "rgba(200,80,60,0.3)",
      }} />
      <div style={{
        position: "absolute", top: "75%", left: "20%", right: "20%",
        height: 1.5, background: "rgba(200,80,60,0.3)",
      }} />
      {children}
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
  const [showResult, setShowResult] = useState(false);
  const [telegraph, setTelegraph] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [flagUp, setFlagUp] = useState(null);
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
    setFlagUp(null);
  }, [studentId]);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { setPhase("fight"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 900);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  useEffect(() => {
    if (phase !== "fight") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          api.battleTimeout(Number(studentId)).then(res => { setResult(res); setPhase("result"); });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    const doTelegraph = () => {
      const z = ZONES[Math.floor(Math.random() * ZONES.length)].key;
      setTelegraph(z);
      setTimeout(() => setTelegraph(null), 1800);
      telegraphRef.current = setTimeout(doTelegraph, 3000 + Math.random() * 2500);
    };
    telegraphRef.current = setTimeout(doTelegraph, 2000);
    return () => { clearInterval(timerRef.current); clearTimeout(telegraphRef.current); };
  }, [phase, studentId]);

  async function attack(zone) {
    if (phase !== "fight") return;
    setAttackZone(zone);
    setPlayerPose("attack");
    setShowResult(false);
    const timing = telegraph === zone ? 0.92 : 0.25 + Math.random() * 0.4;
    const res = await api.battleAction(Number(studentId), { zone, timing });
    setLastAction(res);
    setScore(res.score);
    setRoundLog(prev => [...prev, res]);
    setOpponentZone(res.opponent?.zone);
    setShowResult(true);

    if (res.player.hit) {
      setOpponentHit(true); setOpponentPose("hit"); setShake(true);
      setFlagUp("red");
      setTimeout(() => { setOpponentHit(false); setShake(false); }, 400);
      setTimeout(() => setFlagUp(null), 2000);
    }
    setTimeout(() => {
      setOpponentPose("attack");
      if (res.opponent.hit) {
        setTimeout(() => {
          setPlayerHit(true); setShake(true);
          setTimeout(() => { setPlayerHit(false); setShake(false); }, 400);
        }, 200);
      }
    }, 350);
    setTimeout(() => { setPlayerPose("ready"); setOpponentPose("ready"); }, 800);
    setTimeout(() => setShowResult(false), 1800);

    if (res.finished) {
      clearInterval(timerRef.current); clearTimeout(telegraphRef.current);
      setTimeout(() => { setResult(res); setPhase("result"); }, 1200);
      await api.battleFinish(Number(studentId)).catch(() => {});
    }
  }

  const gradeColor = g => g === "perfect" ? C.brass : g === "good" ? "#7FA876" : C.accentBright;

  /* ── Countdown ── */
  if (phase === "countdown") {
    const labels = ["始め!", "構え!", "礼!"];
    return (
      <div style={{ padding: "12px 0", animation: "fadeIn 0.3s ease" }}>
        <Court height={420}>
          <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%) translateX(-45px)" }}>
            <KendoFighter facing="right" pose="ready" scale={1.1} />
          </div>
          <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%) translateX(45px)" }}>
            <KendoFighter facing="left" pose="ready" scale={1.1} />
          </div>
          <Referee position="left" />
          <Referee position="right" />
          <Referee position="main" />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.35)",
          }}>
            <p key={countdown} style={{
              fontFamily: "serif", fontSize: 48, fontWeight: 900,
              color: countdown === 0 ? C.brass : "#fff",
              textShadow: `0 0 40px ${countdown === 0 ? C.brass : "rgba(255,255,255,0.4)"}`,
              animation: "hitPop 0.6s ease-out",
            }}>
              {countdown > 0 ? labels[countdown - 1] : "始め!"}
            </p>
          </div>
        </Court>
      </div>
    );
  }

  /* ── Ready ── */
  if (phase === "ready") {
    return (
      <div style={{ padding: "12px 0", animation: "fadeIn 0.3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <p style={{ fontFamily: "serif", fontSize: 30, fontWeight: 900, color: C.brass }}>対決</p>
          <p style={{ fontSize: 12, color: C.paperDim, marginTop: 4 }}>AI 가상 상대와 검도 시합</p>
        </div>

        <Court height={320}>
          <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%) translateX(-50px)" }}>
            <KendoFighter facing="right" pose="ready" />
            <p style={{ textAlign: "center", fontSize: 11, color: "#5a4a30", fontWeight: 600, marginTop: 4 }}>나</p>
          </div>
          <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%) translateX(50px)" }}>
            <KendoFighter facing="left" pose="ready" />
            <p style={{ textAlign: "center", fontSize: 11, color: "#5a4a30", fontWeight: 600, marginTop: 4 }}>AI</p>
          </div>
          <Referee position="left" />
          <Referee position="right" />
          <Referee position="main" />
        </Court>

        <div style={{
          marginTop: 14, padding: 14, borderRadius: 12,
          background: C.surface, border: `1px solid ${C.line}`,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.paper, marginBottom: 8 }}>시합 규칙</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: C.paperDim }}>
            <span>• 삼본승부 (3심제) — 2본 선취 시 승리</span>
            <span>• 제한시간 {TIME_LIMIT}초</span>
            <span>• 상대 빈틈(❗) 포착 시 해당 부위 공격 → Perfect</span>
          </div>
        </div>

        <button onClick={startBattle} style={{
          width: "100%", padding: "16px 0", marginTop: 14,
          borderRadius: 12, fontSize: 15, fontWeight: 700,
          background: `linear-gradient(135deg, ${C.accent} 0%, #7A2E22 100%)`,
          color: C.paper, border: "none", cursor: "pointer",
          boxShadow: `0 4px 20px rgba(155,58,44,0.4)`,
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
          textAlign: "center", padding: "24px 0 16px", marginBottom: 12,
          background: won ? "rgba(195,163,95,0.08)" : lost ? "rgba(225,68,48,0.06)" : "rgba(155,148,133,0.06)",
          borderRadius: 16,
        }}>
          <p style={{
            fontFamily: "serif", fontSize: 52, fontWeight: 900,
            color: won ? C.brass : lost ? C.accentBright : C.paperDim,
            textShadow: won ? `0 0 40px rgba(195,163,95,0.5)` : "none",
          }}>
            {won ? "勝利" : lost ? "敗北" : "引分"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 8 }}>
            <div><p style={{ fontSize: 10, color: C.paperDim }}>나</p><p style={{ fontFamily: "serif", fontSize: 28, fontWeight: 700, color: C.paper }}>{score.player}</p></div>
            <span style={{ fontSize: 18, color: C.paperDim }}>—</span>
            <div><p style={{ fontSize: 10, color: C.paperDim }}>상대</p><p style={{ fontFamily: "serif", fontSize: 28, fontWeight: 700, color: C.paper }}>{score.opponent}</p></div>
          </div>
        </div>

        <Court height={280}>
          <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%) translateX(-45px)" }}>
            <KendoFighter facing="right" pose={won ? "attack" : "ready"} attackZone="head" />
          </div>
          <div style={{ position: "absolute", top: "12%", left: "50%", transform: "translateX(-50%) translateX(45px)" }}>
            <KendoFighter facing="left" pose={lost ? "attack" : won ? "hit" : "ready"} attackZone="head" hit={won} />
          </div>
          <Referee position="left" flagUp={won} flagColor="red" />
          <Referee position="right" flagUp={won} flagColor="red" />
          <Referee position="main" flagUp={won} flagColor="red" />
        </Court>

        {roundLog.length > 0 && (
          <div style={{ marginTop: 12, padding: 14, borderRadius: 12, background: C.surface, border: `1px solid ${C.line}` }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.paper, marginBottom: 6 }}>시합 기록</p>
            {roundLog.map(r => (
              <div key={r.round} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "5px 0", borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.paperDim, width: 28 }}>R{r.round}</span>
                <span style={{ color: gradeColor(r.player.timing_grade), flex: 1, textAlign: "center", fontWeight: 600 }}>
                  {ZONES.find(z => z.key === r.player.zone)?.kanji}{" "}
                  {r.player.timing_grade === "perfect" ? "完璧" : r.player.timing_grade === "good" ? "有効" : "空振"}
                  {r.player.hit ? " ✓" : ""}
                </span>
                <span style={{ color: r.opponent.hit ? C.accentBright : C.paperDim }}>상대 {r.opponent.hit ? "유효" : "—"}</span>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setPhase("ready")} style={{
          width: "100%", padding: "16px 0", marginTop: 14, borderRadius: 12,
          fontSize: 15, fontWeight: 700, background: C.accent, color: C.paper, border: "none", cursor: "pointer",
        }}>다시 시합</button>
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 4px", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: C.paperDim }}>나</span>
          <div style={{ display: "flex", gap: 3 }}>
            {[0,1].map(i => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: "50%",
                background: i < score.player ? C.accent : "transparent",
                border: `2px solid ${i < score.player ? C.accent : C.line}`,
                boxShadow: i < score.player ? `0 0 6px ${C.accent}` : "none",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
        </div>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `2.5px solid ${timeLeft <= 10 ? C.accentBright : C.brass}`,
          color: timeLeft <= 10 ? C.accentBright : C.brass,
          fontFamily: "monospace", fontSize: 18, fontWeight: 800,
          background: timeLeft <= 10 ? "rgba(225,68,48,0.1)" : "transparent",
        }}>
          {timeLeft}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {[0,1].map(i => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: "50%",
                background: i < score.opponent ? C.accentBright : "transparent",
                border: `2px solid ${i < score.opponent ? C.accentBright : C.line}`,
                boxShadow: i < score.opponent ? `0 0 6px ${C.accentBright}` : "none",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: C.paperDim }}>상대</span>
        </div>
      </div>

      {/* Court Arena */}
      <Court height={300}>
        {/* Player (left) */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translateY(-55%) translateX(-95px)",
          transition: "all 0.2s ease",
        }}>
          <KendoFighter facing="right" pose={playerPose} hit={playerHit} attackZone={attackZone} scale={1.15} />
        </div>

        {/* Opponent (right) */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translateY(-55%) translateX(15px)",
          transition: "all 0.2s ease",
        }}>
          <KendoFighter facing="left" pose={opponentPose} hit={opponentHit} attackZone={opponentZone} scale={1.15} />
          {telegraph && (
            <div style={{
              position: "absolute",
              top: telegraph === "head" ? "5%" : telegraph === "wrist" ? "45%" : telegraph === "waist" ? "60%" : "35%",
              left: "30%",
              fontSize: 18, fontWeight: 900, color: C.accentBright,
              animation: "telegraphPulse 0.6s ease-in-out infinite",
              textShadow: `0 0 10px ${C.accentBright}`,
            }}>❗</div>
          )}
        </div>

        {/* 3 Referees */}
        <Referee position="left" flagUp={flagUp === "red"} flagColor="red" />
        <Referee position="right" flagUp={flagUp === "red"} flagColor="red" />
        <Referee position="main" flagUp={flagUp === "red"} flagColor="red" />
      </Court>

      {/* Action feedback */}
      <div style={{ height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {showResult && lastAction && (
          <div key={lastAction.round} style={{ textAlign: "center", animation: "hitPop 0.3s ease-out" }}>
            <span style={{
              fontFamily: "serif", fontSize: 20, fontWeight: 900,
              color: gradeColor(lastAction.player.timing_grade),
              textShadow: `0 0 12px ${gradeColor(lastAction.player.timing_grade)}`,
            }}>
              {lastAction.player.timing_grade === "perfect" ? "完璧" : lastAction.player.timing_grade === "good" ? "有効" : "空振"}
            </span>
            <span style={{ fontSize: 11, color: C.paperDim, marginLeft: 8 }}>
              {lastAction.player.hit ? "유효타!" : ""}
              {lastAction.opponent.hit ? " · 상대 반격!" : ""}
            </span>
          </div>
        )}
        {!showResult && telegraph && (
          <p style={{ fontSize: 12, color: C.brass, animation: "fadeIn 0.2s ease", fontWeight: 600 }}>
            상대의 빈틈! → {ZONES.find(z => z.key === telegraph)?.kanji} 공격!
          </p>
        )}
      </div>

      {/* Zone buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {ZONES.map(z => {
          const isTelegraph = telegraph === z.key;
          return (
            <button key={z.key} onClick={() => attack(z.key)} style={{
              position: "relative",
              background: isTelegraph ? "rgba(195,163,95,0.12)" : C.surfaceAlt,
              border: `1.5px solid ${isTelegraph ? C.brass : C.line}`,
              borderRadius: 14, padding: "16px 0",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              cursor: "pointer", transition: "all 0.15s ease",
              boxShadow: isTelegraph ? `0 0 14px rgba(195,163,95,0.2)` : "none",
            }}
            onPointerDown={e => { e.currentTarget.style.transform = "scale(0.93)"; e.currentTarget.style.background = "rgba(155,58,44,0.15)"; }}
            onPointerUp={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = isTelegraph ? "rgba(195,163,95,0.12)" : C.surfaceAlt; }}
            onPointerLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = isTelegraph ? "rgba(195,163,95,0.12)" : C.surfaceAlt; }}
            >
              {isTelegraph && (
                <div style={{ position: "absolute", top: 3, right: 6, fontSize: 9, color: C.brass, fontWeight: 700, animation: "telegraphPulse 0.6s ease-in-out infinite" }}>빈틈!</div>
              )}
              <span style={{ fontFamily: "serif", fontSize: 24, fontWeight: 800, color: C.brass }}>{z.kanji}</span>
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes telegraphPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
