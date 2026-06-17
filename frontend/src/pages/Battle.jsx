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
  { key: "head", label: "머리", kanji: "面" },
  { key: "wrist", label: "손목", kanji: "小手" },
  { key: "waist", label: "허리", kanji: "胴" },
  { key: "thrust", label: "찌르기", kanji: "突" },
];

const TIME_LIMIT = 60;

/* ── Kendo Fighter (CSS art) ── */
function KendoFighter({ side, attacking, attackZone, hit, style: outerStyle }) {
  const flip = side === "right" ? -1 : 1;
  const baseH = 160;

  const getAttackTransform = () => {
    if (!attacking) return "";
    switch (attackZone) {
      case "head": return `translateY(-18px)`;
      case "wrist": return `translateX(${flip * 20}px)`;
      case "waist": return `translateX(${flip * 15}px) rotate(${flip * -10}deg)`;
      case "thrust": return `translateX(${flip * 30}px)`;
      default: return "";
    }
  };

  const getShinaiTransform = () => {
    if (!attacking) return `rotate(${flip * -15}deg)`;
    switch (attackZone) {
      case "head": return `rotate(${flip * -70}deg) translateY(-10px)`;
      case "wrist": return `rotate(${flip * -40}deg) translateX(${flip * 10}px)`;
      case "waist": return `rotate(${flip * 20}deg) translateX(${flip * 10}px)`;
      case "thrust": return `rotate(${flip * -5}deg) translateX(${flip * 25}px)`;
      default: return `rotate(${flip * -15}deg)`;
    }
  };

  return (
    <div
      style={{
        position: "relative",
        width: 80,
        height: baseH,
        transition: "transform 0.15s ease, filter 0.1s",
        transform: `scaleX(${flip}) ${getAttackTransform()}`,
        filter: hit ? "brightness(2.5)" : "none",
        ...outerStyle,
      }}
    >
      {/* Men (helmet) */}
      <div style={{
        position: "absolute", top: 0, left: 20, width: 40, height: 36,
        background: "#2A2040", borderRadius: "8px 8px 4px 4px",
        border: "2px solid #4A3A6A",
        boxShadow: "inset 0 -8px 0 rgba(0,0,0,0.3)",
      }}>
        <div style={{
          position: "absolute", top: 8, left: 6, right: 6, height: 14,
          background: "repeating-linear-gradient(0deg, #3A2A5A 0px, #3A2A5A 2px, #1A1030 2px, #1A1030 4px)",
          borderRadius: 2,
        }} />
      </div>

      {/* Do (body armor) */}
      <div style={{
        position: "absolute", top: 36, left: 16, width: 48, height: 44,
        background: "linear-gradient(180deg, #1A1535 0%, #2A2050 100%)",
        borderRadius: "4px 4px 8px 8px",
        border: "2px solid #4A3A6A",
      }}>
        <div style={{
          position: "absolute", top: 4, left: 4, right: 4, bottom: 4,
          background: C.accent,
          borderRadius: 3,
          opacity: 0.6,
        }} />
      </div>

      {/* Tare (waist protector) */}
      <div style={{
        position: "absolute", top: 78, left: 14, width: 52, height: 20,
        background: "#1A1535",
        borderRadius: "0 0 4px 4px",
        border: "2px solid #4A3A6A",
        borderTop: "none",
      }} />

      {/* Hakama (legs) */}
      <div style={{
        position: "absolute", top: 96, left: 12, width: 56, height: 54,
        background: "linear-gradient(180deg, #0D1B3A 0%, #162D5A 100%)",
        borderRadius: "0 0 6px 6px",
        clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
      }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            position: "absolute",
            left: `${18 + i * 18}%`,
            top: 0, bottom: 0, width: 1,
            background: "rgba(0,0,0,0.3)",
          }} />
        ))}
      </div>

      {/* Kote (gloves) */}
      <div style={{
        position: "absolute", top: 50, left: -2, width: 16, height: 12,
        background: "#2A2040", borderRadius: 4,
        border: "1px solid #4A3A6A",
      }} />
      <div style={{
        position: "absolute", top: 50, right: -2, width: 16, height: 12,
        background: "#2A2040", borderRadius: 4,
        border: "1px solid #4A3A6A",
      }} />

      {/* Shinai */}
      <div style={{
        position: "absolute",
        top: 20, right: -10,
        width: 4, height: 80,
        background: "linear-gradient(180deg, #D4B876 0%, #A08050 100%)",
        borderRadius: 2,
        transformOrigin: "50% 0%",
        transition: "transform 0.15s ease",
        transform: getShinaiTransform(),
        boxShadow: "1px 1px 3px rgba(0,0,0,0.4)",
      }}>
        <div style={{
          position: "absolute", top: 0, left: -1, width: 6, height: 8,
          background: "#F0E0C0", borderRadius: "2px 2px 0 0",
        }} />
        <div style={{
          position: "absolute", top: 60, left: -2, width: 8, height: 6,
          background: "#8B6914", borderRadius: 2,
        }} />
      </div>
    </div>
  );
}

/* ── Ippon Markers ── */
function IpponMarker({ count, max = 2, color }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          width: 12, height: 12, borderRadius: "50%",
          background: i < count ? color : "transparent",
          border: `2px solid ${i < count ? color : C.line}`,
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );
}

/* ── Hit Effect Text ── */
function HitEffect({ grade, zone, visible }) {
  if (!visible) return null;
  const zoneKanji = { head: "面", wrist: "小手", waist: "胴", thrust: "突" };
  const gradeText = grade === "perfect" ? "完璧" : grade === "good" ? "良" : "空振";
  const color = grade === "perfect" ? C.brass : grade === "good" ? "#7FA876" : C.accentBright;

  return (
    <div style={{
      position: "absolute", top: "30%", left: "50%",
      transform: "translateX(-50%)",
      textAlign: "center",
      animation: "hitFloat 0.8s ease-out forwards",
      zIndex: 20, pointerEvents: "none",
    }}>
      <p style={{ fontFamily: "serif", fontSize: 36, fontWeight: 900, color, textShadow: `0 0 20px ${color}` }}>
        {gradeText}
      </p>
      <p style={{ fontSize: 14, color: C.paperDim, marginTop: -4 }}>
        {zoneKanji[zone]} {grade !== "miss" ? "유효타!" : ""} · 상대 유효타!
      </p>
    </div>
  );
}

/* ── Timing Bar ── */
function TimingBar({ active, ringPhase }) {
  if (!active) return null;
  return (
    <div style={{
      width: "100%", height: 32, borderRadius: 8,
      background: C.surfaceAlt, border: `1px solid ${C.line}`,
      position: "relative", overflow: "hidden",
    }}>
      {/* Zone labels */}
      <div style={{ position: "absolute", inset: 0, display: "flex", zIndex: 1 }}>
        <div style={{ flex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, color: C.accentBright, opacity: 0.6 }}>MISS</span>
        </div>
        <div style={{ flex: 2, background: "rgba(127,168,118,0.15)", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid rgba(127,168,118,0.3)`, borderRight: `1px solid rgba(127,168,118,0.3)` }}>
          <span style={{ fontSize: 9, color: "#7FA876" }}>GOOD</span>
        </div>
        <div style={{ flex: 1, background: "rgba(195,163,95,0.2)", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid rgba(195,163,95,0.3)`, borderRight: `1px solid rgba(195,163,95,0.3)` }}>
          <span style={{ fontSize: 9, color: C.brass, fontWeight: 700 }}>PERFECT</span>
        </div>
        <div style={{ flex: 2, background: "rgba(127,168,118,0.15)", display: "flex", alignItems: "center", justifyContent: "center", borderLeft: `1px solid rgba(127,168,118,0.3)`, borderRight: `1px solid rgba(127,168,118,0.3)` }}>
          <span style={{ fontSize: 9, color: "#7FA876" }}>GOOD</span>
        </div>
        <div style={{ flex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 9, color: C.accentBright, opacity: 0.6 }}>MISS</span>
        </div>
      </div>
      {/* Moving cursor */}
      <div key={ringPhase} style={{
        position: "absolute", top: 2, bottom: 2,
        width: 4, borderRadius: 2,
        background: C.paper,
        boxShadow: `0 0 8px ${C.paper}`,
        zIndex: 2,
        animation: "timingSlide 2s linear infinite",
      }} />
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
  const [ringPhase, setRingPhase] = useState(0);
  const [lastAction, setLastAction] = useState(null);
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [opponentAttacking, setOpponentAttacking] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [opponentHit, setOpponentHit] = useState(false);
  const [attackZone, setAttackZone] = useState(null);
  const [shake, setShake] = useState(false);
  const [showHitEffect, setShowHitEffect] = useState(false);
  const [vsAnim, setVsAnim] = useState(false);
  const timerRef = useRef(null);

  const startBattle = useCallback(async () => {
    setVsAnim(true);
    const info = await api.battleStart({ student_id: Number(studentId), opponent_type: "ai" });
    setBattleInfo(info);
    setScore({ player: 0, opponent: 0 });
    setRoundLog([]);
    setResult(null);
    setTimeLeft(TIME_LIMIT);
    setLastAction(null);
    setTimeout(() => {
      setVsAnim(false);
      setPhase("fight");
      setRingPhase((p) => p + 1);
    }, 1500);
  }, [studentId]);

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
    return () => clearInterval(timerRef.current);
  }, [phase, studentId]);

  async function attack(zone) {
    if (phase !== "fight") return;
    setAttackZone(zone);
    setPlayerAttacking(true);
    setShowHitEffect(false);

    const elapsed = (ringPhase * 2000 - (Date.now() % 2000)) / 2000;
    const timing = Math.max(0, Math.min(1, 0.5 + (elapsed - 0.5) * 0.8));

    const res = await api.battleAction(Number(studentId), { zone, timing });
    setLastAction(res);
    setScore(res.score);
    setRoundLog((prev) => [...prev, res]);
    setShowHitEffect(true);

    if (res.opponent.hit) {
      setPlayerHit(true);
      setShake(true);
      setTimeout(() => { setPlayerHit(false); setShake(false); }, 300);
    }
    if (res.player.hit) {
      setOpponentHit(true);
      setShake(true);
      setTimeout(() => { setOpponentHit(false); setShake(false); }, 300);
    }

    setOpponentAttacking(true);
    setTimeout(() => {
      setPlayerAttacking(false);
      setOpponentAttacking(false);
    }, 400);

    setTimeout(() => setShowHitEffect(false), 900);

    if (res.finished) {
      clearInterval(timerRef.current);
      setTimeout(() => {
        setResult(res);
        setPhase("result");
      }, 600);
      await api.battleFinish(Number(studentId)).catch(() => {});
    } else {
      setRingPhase((p) => p + 1);
    }
  }

  const gradeColor = (g) =>
    g === "perfect" ? C.brass : g === "good" ? "#7FA876" : C.accentBright;
  const gradeLabel = (g) =>
    g === "perfect" ? "完璧" : g === "good" ? "良" : "空振";
  const resultLabel = (r) =>
    r === "win" ? "勝" : r === "lose" ? "敗" : "引分";

  /* ── VS intro ── */
  if (phase === "ready" && vsAnim) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        height: "70vh", animation: "fadeIn 0.3s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          <KendoFighter side="left" />
          <div style={{ textAlign: "center" }}>
            <p style={{
              fontFamily: "serif", fontSize: 48, fontWeight: 900,
              color: C.accent, textShadow: `0 0 30px ${C.accent}`,
              animation: "vsScale 0.5s ease-out",
            }}>VS</p>
          </div>
          <KendoFighter side="right" />
        </div>
      </div>
    );
  }

  /* ── Ready screen ── */
  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center gap-6 pt-6" style={{ animation: "fadeIn 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 50, marginBottom: 10 }}>
          <div style={{ textAlign: "center" }}>
            <KendoFighter side="left" />
            <p style={{ fontSize: 11, color: C.paperDim, marginTop: 8 }}>나</p>
          </div>
          <p style={{ fontFamily: "serif", fontSize: 28, fontWeight: 900, color: C.brass, marginBottom: 40 }}>対決</p>
          <div style={{ textAlign: "center" }}>
            <KendoFighter side="right" />
            <p style={{ fontSize: 11, color: C.paperDim, marginTop: 8 }}>AI 상대</p>
          </div>
        </div>
        <div className="rounded-xl p-5 w-full" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <p className="text-sm font-bold mb-3" style={{ color: C.paper }}>대결 규칙</p>
          <ul className="flex flex-col gap-2 text-xs" style={{ color: C.paperDim }}>
            <li>• 2점(한판) 선취 시 즉시 승리</li>
            <li>• 제한시간 {TIME_LIMIT}초 내 점수 우세 판정</li>
            <li>• 타이밍 게이지에 맞춰 부위를 선택하세요</li>
            <li>• Perfect / Good / Miss 3단계 판정</li>
          </ul>
        </div>
        <button
          onClick={startBattle}
          className="w-full py-4 rounded-xl text-sm font-bold"
          style={{ background: C.accent, color: C.paper, border: "none" }}
        >
          대결 시작
        </button>
      </div>
    );
  }

  /* ── Result screen ── */
  if (phase === "result") {
    return (
      <div className="flex flex-col items-center gap-6 pt-6" style={{ animation: "fadeIn 0.3s ease" }}>
        <p
          className="font-serif font-black text-5xl"
          style={{ color: result?.result === "win" ? C.brass : result?.result === "lose" ? C.accentBright : C.paperDim }}
        >
          {resultLabel(result?.result)}
        </p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 50 }}>
          <div style={{ textAlign: "center" }}>
            <KendoFighter side="left" attacking={result?.result === "win"} attackZone="head" />
          </div>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <p style={{ fontFamily: "serif", fontSize: 40, fontWeight: 900, color: C.paper }}>
              {score.player} - {score.opponent}
            </p>
          </div>
          <div style={{ textAlign: "center" }}>
            <KendoFighter side="right" attacking={result?.result === "lose"} attackZone="head" />
          </div>
        </div>
        {roundLog.length > 0 && (
          <div className="w-full rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <p className="text-xs font-bold mb-2" style={{ color: C.paper }}>라운드 기록</p>
            {roundLog.map((r) => (
              <div key={r.round} className="flex justify-between text-[11px] py-1" style={{ borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.paperDim }}>R{r.round}</span>
                <span style={{ color: gradeColor(r.player.timing_grade) }}>
                  {r.player.zone === "head" ? "면" : r.player.zone === "wrist" ? "고테" : r.player.zone === "waist" ? "도" : "쯔키"}{" "}
                  {gradeLabel(r.player.timing_grade)} {r.player.hit ? "유효!" : ""}
                </span>
                <span style={{ color: r.opponent.hit ? C.accentBright : C.paperDim }}>
                  상대 {r.opponent.hit ? "유효" : "범타"}
                </span>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => { setPhase("ready"); }}
          className="w-full py-4 rounded-xl text-sm font-bold"
          style={{ background: C.accent, color: C.paper, border: "none" }}
        >
          다시 대결
        </button>
      </div>
    );
  }

  /* ── Fight screen ── */
  return (
    <div style={{ animation: "fadeIn 0.3s ease", transform: shake ? "translateX(4px)" : "none", transition: "transform 0.05s" }}>
      {/* Score bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px", marginBottom: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <IpponMarker count={score.player} color={C.brass} />
          <span style={{ fontFamily: "serif", fontSize: 24, fontWeight: 700, color: C.paper }}>{score.player}</span>
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `2px solid ${timeLeft <= 10 ? C.accentBright : C.brass}`,
          color: timeLeft <= 10 ? C.accentBright : C.brass,
          fontFamily: "monospace", fontSize: 18, fontWeight: 700,
        }}>
          {timeLeft}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "serif", fontSize: 24, fontWeight: 700, color: C.paper }}>{score.opponent}</span>
          <IpponMarker count={score.opponent} color={C.accentBright} />
        </div>
      </div>

      {/* Arena */}
      <div style={{
        position: "relative",
        height: 220,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        gap: 30,
        marginBottom: 12,
        background: `radial-gradient(ellipse at 50% 100%, rgba(155,58,44,0.08) 0%, transparent 70%)`,
      }}>
        <KendoFighter
          side="left"
          attacking={playerAttacking}
          attackZone={attackZone}
          hit={playerHit}
          style={{ marginBottom: 10 }}
        />
        <KendoFighter
          side="right"
          attacking={opponentAttacking}
          attackZone={lastAction?.opponent?.zone}
          hit={opponentHit}
          style={{ marginBottom: 10 }}
        />
        {showHitEffect && lastAction && (
          <HitEffect
            grade={lastAction.player.timing_grade}
            zone={lastAction.player.zone}
            visible={showHitEffect}
          />
        )}
      </div>

      {/* Timing bar */}
      <div style={{ padding: "0 8px", marginBottom: 12 }}>
        <TimingBar active={phase === "fight"} ringPhase={ringPhase} />
      </div>

      {/* Zone buttons */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 10, padding: "0 8px",
      }}>
        {ZONES.map((z) => (
          <button
            key={z.key}
            onClick={() => attack(z.key)}
            style={{
              background: C.surfaceAlt,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: "18px 0",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              cursor: "pointer",
              transition: "transform 0.1s",
            }}
            onPointerDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; }}
            onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            <span style={{ fontFamily: "serif", fontSize: 22, fontWeight: 700, color: C.brass }}>{z.kanji}</span>
            <span style={{ fontSize: 12, color: C.paperDim }}>{z.label}</span>
          </button>
        ))}
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes hitFloat {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-40px); }
        }
        @keyframes timingSlide {
          0% { left: 0%; }
          50% { left: calc(100% - 4px); }
          100% { left: 0%; }
        }
        @keyframes vsScale {
          0% { transform: scale(0.3); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
