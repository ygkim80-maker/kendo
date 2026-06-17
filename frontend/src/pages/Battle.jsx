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
  floorDark: "#B89B6A",
  courtLine: "#2E7D32",
  courtBlue: "#1565C0",
};

const ZONES = [
  { key: "head", label: "머리", kanji: "面" },
  { key: "wrist", label: "손목", kanji: "小手" },
  { key: "waist", label: "허리", kanji: "胴" },
  { key: "thrust", label: "찌르기", kanji: "突" },
];

const TIME_LIMIT = 60;

/* ── Kendo Fighter (top-down court view) ── */
function Fighter({ isPlayer, attacking, attackZone, hit, ippon }) {
  const rotation = isPlayer ? 0 : 180;

  const getAttackAnim = () => {
    if (!attacking) return {};
    const dy = isPlayer ? -30 : 30;
    return {
      transform: `rotate(${rotation}deg) translateY(${isPlayer ? -20 : -20}px)`,
      transition: "transform 0.12s ease-out",
    };
  };

  const baseStyle = {
    position: "relative",
    width: 70,
    height: 100,
    transform: `rotate(${rotation}deg)`,
    transition: "transform 0.2s ease, filter 0.15s",
    filter: hit ? "brightness(2) drop-shadow(0 0 15px #fff)" : "none",
    ...getAttackAnim(),
  };

  return (
    <div style={baseStyle}>
      {/* Hakama (skirt) */}
      <div style={{
        position: "absolute", bottom: 0, left: 5, right: 5, height: 50,
        background: "linear-gradient(180deg, #0D1B3A 0%, #162D5A 40%, #0D1B3A 100%)",
        borderRadius: "0 0 20px 20px",
        clipPath: "polygon(15% 0%, 85% 0%, 100% 100%, 0% 100%)",
      }}>
        {[20, 35, 50, 65, 80].map(p => (
          <div key={p} style={{
            position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: 1,
            background: "rgba(0,0,0,0.25)",
          }} />
        ))}
      </div>

      {/* Do (body) */}
      <div style={{
        position: "absolute", top: 20, left: 10, right: 10, height: 35,
        background: "linear-gradient(180deg, #1A1535 0%, #2A2050 100%)",
        borderRadius: "6px 6px 2px 2px",
        border: "1.5px solid #4A3A6A",
      }}>
        <div style={{
          position: "absolute", top: 3, left: 3, right: 3, bottom: 3,
          background: "linear-gradient(180deg, #8B2500 0%, #6B1A00 100%)",
          borderRadius: 3, opacity: 0.7,
        }} />
        {/* Tare flaps */}
        <div style={{
          position: "absolute", bottom: -8, left: -2, right: -2, height: 10,
          display: "flex", gap: 1, justifyContent: "center",
        }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              width: i === 2 ? 14 : 10, height: "100%",
              background: "#1A1535", borderRadius: "0 0 2px 2px",
              border: "1px solid #3A2A5A",
            }} />
          ))}
        </div>
      </div>

      {/* Men (helmet) */}
      <div style={{
        position: "absolute", top: 0, left: 13, right: 13, height: 24,
        background: "radial-gradient(ellipse at 50% 60%, #2A2040 0%, #1A1030 100%)",
        borderRadius: "10px 10px 4px 4px",
        border: "1.5px solid #4A3A6A",
        boxShadow: "0 2px 6px rgba(0,0,0,0.5)",
      }}>
        {/* Mengane (face grille) */}
        <div style={{
          position: "absolute", top: 8, left: 4, right: 4, height: 10,
          background: "repeating-linear-gradient(0deg, #5A4A7A 0px, #5A4A7A 1.5px, #1A1030 1.5px, #1A1030 3px)",
          borderRadius: 2,
        }} />
      </div>

      {/* Kote (gloves) */}
      <div style={{
        position: "absolute", top: 28, left: -4, width: 14, height: 16,
        background: "#2A2040", borderRadius: "4px 2px 2px 4px",
        border: "1px solid #4A3A6A",
      }} />
      <div style={{
        position: "absolute", top: 28, right: -4, width: 14, height: 16,
        background: "#2A2040", borderRadius: "2px 4px 4px 2px",
        border: "1px solid #4A3A6A",
      }} />

      {/* Shinai */}
      <div style={{
        position: "absolute", top: -15, left: "50%", marginLeft: -2,
        width: 4, height: 40,
        background: "linear-gradient(180deg, #F0E0C0 0%, #D4B876 20%, #A08050 100%)",
        borderRadius: 2,
        transformOrigin: "50% 100%",
        transform: attacking
          ? attackZone === "head" ? "rotate(-5deg)"
          : attackZone === "thrust" ? "rotate(0deg) translateY(-15px)"
          : attackZone === "wrist" ? "rotate(25deg)"
          : "rotate(-30deg)"
          : "rotate(-15deg)",
        transition: "transform 0.15s ease",
        boxShadow: "1px 1px 4px rgba(0,0,0,0.3)",
      }}>
        <div style={{
          position: "absolute", bottom: 12, left: -1.5, width: 7, height: 5,
          background: "#6B4E1B", borderRadius: 1,
        }} />
      </div>
    </div>
  );
}

/* ── Court / Arena ── */
function Court({ children }) {
  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: 340,
      background: `linear-gradient(180deg, ${C.floorDark} 0%, ${C.floor} 30%, ${C.floor} 70%, ${C.floorDark} 100%)`,
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: "inset 0 0 40px rgba(0,0,0,0.3)",
    }}>
      {/* Wood grain */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          top: 0, bottom: 0,
          left: `${(i + 1) * 8}%`,
          width: 1,
          background: "rgba(0,0,0,0.06)",
        }} />
      ))}
      {/* Court boundary lines */}
      <div style={{
        position: "absolute", top: 20, left: 20, right: 20, bottom: 20,
        border: `2px solid ${C.courtLine}`,
        borderRadius: 4,
      }} />
      {/* Center cross marks */}
      <div style={{
        position: "absolute", top: "50%", left: "38%",
        width: 20, height: 3, marginTop: -1.5,
        background: C.courtLine,
      }} />
      <div style={{
        position: "absolute", top: "50%", right: "38%",
        width: 20, height: 3, marginTop: -1.5,
        background: C.courtLine,
      }} />
      {/* Start lines */}
      <div style={{
        position: "absolute", top: "35%", left: "30%", right: "30%",
        height: 2, background: "rgba(255,255,255,0.15)",
      }} />
      <div style={{
        position: "absolute", top: "65%", left: "30%", right: "30%",
        height: 2, background: "rgba(255,255,255,0.15)",
      }} />
      {children}
    </div>
  );
}

/* ── Referee ── */
function Referee({ side, flagUp, flagColor }) {
  const isLeft = side === "left";
  return (
    <div style={{
      position: "absolute",
      [isLeft ? "left" : "right"]: 8,
      top: "50%", marginTop: -20,
      width: 20, height: 40,
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{
        width: 10, height: 10, borderRadius: "50%",
        background: "#D4B88C", border: "1px solid #A08050",
      }} />
      <div style={{
        width: 16, height: 22,
        background: "#f0f0f0", borderRadius: "2px 2px 4px 4px",
        border: "1px solid #ccc",
      }} />
      {flagUp && (
        <div style={{
          position: "absolute", top: -8,
          [isLeft ? "right" : "left"]: -4,
          width: 10, height: 8,
          background: flagColor || "#E53935",
          borderRadius: 1,
          transform: `rotate(${isLeft ? -20 : 20}deg)`,
          animation: "flagWave 0.3s ease-in-out 3",
        }} />
      )}
    </div>
  );
}

/* ── Score HUD ── */
function ScoreHUD({ playerScore, opponentScore, timeLeft }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0", marginBottom: 4,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 11, color: C.paperDim }}>나</span>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: i < playerScore ? C.accent : "transparent",
              border: `2px solid ${i < playerScore ? C.accent : C.line}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700,
              color: i < playerScore ? C.paper : "transparent",
              transition: "all 0.3s ease",
              boxShadow: i < playerScore ? `0 0 8px ${C.accent}` : "none",
            }}>{i < playerScore ? "本" : ""}</div>
          ))}
        </div>
      </div>

      <div style={{
        width: 52, height: 52, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: timeLeft <= 10 ? "rgba(225,68,48,0.15)" : "rgba(195,163,95,0.1)",
        border: `2.5px solid ${timeLeft <= 10 ? C.accentBright : C.brass}`,
        color: timeLeft <= 10 ? C.accentBright : C.brass,
        fontFamily: "monospace", fontSize: 20, fontWeight: 800,
        transition: "all 0.3s",
      }}>
        {timeLeft}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1].map(i => (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: i < opponentScore ? C.accentBright : "transparent",
              border: `2px solid ${i < opponentScore ? C.accentBright : C.line}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 700,
              color: i < opponentScore ? C.paper : "transparent",
              transition: "all 0.3s ease",
              boxShadow: i < opponentScore ? `0 0 8px ${C.accentBright}` : "none",
            }}>{i < opponentScore ? "本" : ""}</div>
          ))}
        </div>
        <span style={{ fontSize: 11, color: C.paperDim }}>상대</span>
      </div>
    </div>
  );
}

/* ── Hit Effect Overlay ── */
function HitOverlay({ grade, zone, playerHit, opponentHit, visible }) {
  if (!visible) return null;
  const zoneKanji = { head: "面", wrist: "小手", waist: "胴", thrust: "突" };
  const gradeText = grade === "perfect" ? "完璧" : grade === "good" ? "有効" : "空振";
  const color = grade === "perfect" ? C.brass : grade === "good" ? "#7FA876" : C.accentBright;

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: grade === "perfect" ? "rgba(195,163,95,0.12)" : grade === "good" ? "rgba(127,168,118,0.08)" : "rgba(225,68,48,0.08)",
      zIndex: 15, pointerEvents: "none",
      animation: "fadeIn 0.1s ease",
    }}>
      <p style={{
        fontFamily: "serif", fontSize: 44, fontWeight: 900,
        color, textShadow: `0 0 30px ${color}, 0 0 60px ${color}`,
        animation: "hitPop 0.4s ease-out",
      }}>
        {gradeText}
      </p>
      <p style={{
        fontSize: 16, color: C.paper, marginTop: 2,
        fontFamily: "serif", fontWeight: 700,
      }}>
        {zoneKanji[zone]}
        {playerHit ? " — 유효타!" : ""}
      </p>
      {opponentHit && (
        <p style={{ fontSize: 13, color: C.accentBright, marginTop: 4 }}>
          상대 반격 유효!
        </p>
      )}
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
  const [showHit, setShowHit] = useState(false);
  const [flagUp, setFlagUp] = useState(false);
  const timerRef = useRef(null);
  const [vsCount, setVsCount] = useState(0);

  const startBattle = useCallback(async () => {
    setPhase("vs");
    setVsCount(3);
    const info = await api.battleStart({ student_id: Number(studentId), opponent_type: "ai" });
    setBattleInfo(info);
    setScore({ player: 0, opponent: 0 });
    setRoundLog([]);
    setResult(null);
    setTimeLeft(TIME_LIMIT);
    setLastAction(null);
    setShowHit(false);
  }, [studentId]);

  useEffect(() => {
    if (phase !== "vs") return;
    if (vsCount <= 0) {
      setPhase("fight");
      setRingPhase((p) => p + 1);
      return;
    }
    const t = setTimeout(() => setVsCount(vsCount - 1), 700);
    return () => clearTimeout(t);
  }, [phase, vsCount]);

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
    setShowHit(false);

    const elapsed = (ringPhase * 2000 - (Date.now() % 2000)) / 2000;
    const timing = Math.max(0, Math.min(1, 0.5 + (elapsed - 0.5) * 0.8));

    const res = await api.battleAction(Number(studentId), { zone, timing });
    setLastAction(res);
    setScore(res.score);
    setRoundLog((prev) => [...prev, res]);
    setShowHit(true);

    if (res.player.hit) {
      setOpponentHit(true);
      setShake(true);
      setFlagUp(true);
      setTimeout(() => { setOpponentHit(false); setShake(false); }, 350);
      setTimeout(() => setFlagUp(false), 1200);
    }
    if (res.opponent.hit) {
      setPlayerHit(true);
      setShake(true);
      setTimeout(() => { setPlayerHit(false); setShake(false); }, 350);
    }

    setOpponentAttacking(true);
    setTimeout(() => {
      setPlayerAttacking(false);
      setOpponentAttacking(false);
    }, 400);

    setTimeout(() => setShowHit(false), 1000);

    if (res.finished) {
      clearInterval(timerRef.current);
      setTimeout(() => {
        setResult(res);
        setPhase("result");
      }, 800);
      await api.battleFinish(Number(studentId)).catch(() => {});
    } else {
      setRingPhase((p) => p + 1);
    }
  }

  const gradeColor = (g) =>
    g === "perfect" ? C.brass : g === "good" ? "#7FA876" : C.accentBright;
  const gradeLabel = (g) =>
    g === "perfect" ? "完璧" : g === "good" ? "有効" : "空振";
  const resultLabel = (r) =>
    r === "win" ? "勝利" : r === "lose" ? "敗北" : "引分";

  /* ── VS Countdown ── */
  if (phase === "vs") {
    const labels = ["始め!", "構え!", "礼!"];
    return (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", height: "75vh",
      }}>
        <Court>
          <div style={{
            position: "absolute", top: "18%", left: "50%",
            transform: "translateX(-50%)",
          }}>
            <Fighter isPlayer={false} />
          </div>
          <div style={{
            position: "absolute", bottom: "10%", left: "50%",
            transform: "translateX(-50%)",
          }}>
            <Fighter isPlayer={true} />
          </div>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
          }}>
            <p key={vsCount} style={{
              fontFamily: "serif", fontSize: 56, fontWeight: 900,
              color: C.paper,
              textShadow: "0 0 40px rgba(236,228,211,0.6)",
              animation: "hitPop 0.5s ease-out",
            }}>
              {vsCount > 0 ? labels[vsCount - 1] || vsCount : "始め!"}
            </p>
          </div>
          <Referee side="left" />
          <Referee side="right" />
        </Court>
      </div>
    );
  }

  /* ── Ready screen ── */
  if (phase === "ready") {
    return (
      <div style={{ padding: "16px 0", animation: "fadeIn 0.3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <p style={{ fontFamily: "serif", fontSize: 32, fontWeight: 900, color: C.brass }}>対決</p>
          <p style={{ fontSize: 12, color: C.paperDim, marginTop: 2 }}>AI 가상 상대와 1v1 검도 시합</p>
        </div>

        <Court>
          <div style={{
            position: "absolute", top: "20%", left: "50%",
            transform: "translateX(-50%)",
          }}>
            <Fighter isPlayer={false} />
            <p style={{
              textAlign: "center", fontSize: 11, color: "#333",
              marginTop: 6, fontWeight: 600,
            }}>AI 상대</p>
          </div>
          <div style={{
            position: "absolute", bottom: "12%", left: "50%",
            transform: "translateX(-50%)",
          }}>
            <Fighter isPlayer={true} />
            <p style={{
              textAlign: "center", fontSize: 11, color: "#333",
              marginTop: 6, fontWeight: 600,
            }}>나</p>
          </div>
          <Referee side="left" />
          <Referee side="right" />
        </Court>

        <div style={{
          marginTop: 16, padding: 16, borderRadius: 12,
          background: C.surface, border: `1px solid ${C.line}`,
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.paper, marginBottom: 10 }}>시합 규칙</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: C.paperDim }}>
            <span>• 삼본승부 — 2본 선취 시 승리</span>
            <span>• 제한시간 {TIME_LIMIT}초, 시간 초과 시 판정</span>
            <span>• 타이밍 게이지에 맞춰 타격 부위 선택</span>
            <span>• Perfect / Good / Miss 판정</span>
          </div>
        </div>

        <button
          onClick={startBattle}
          style={{
            width: "100%", padding: "16px 0", marginTop: 16,
            borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: C.accent, color: C.paper, border: "none",
            cursor: "pointer",
            boxShadow: `0 4px 20px rgba(155,58,44,0.4)`,
          }}
        >
          시합 시작
        </button>
      </div>
    );
  }

  /* ── Result screen ── */
  if (phase === "result") {
    const won = result?.result === "win";
    return (
      <div style={{ padding: "16px 0", animation: "fadeIn 0.3s ease" }}>
        <div style={{
          textAlign: "center", padding: "24px 0", marginBottom: 12,
          background: won ? "rgba(195,163,95,0.08)" : "rgba(225,68,48,0.06)",
          borderRadius: 16,
        }}>
          <p style={{
            fontFamily: "serif", fontSize: 52, fontWeight: 900,
            color: won ? C.brass : result?.result === "lose" ? C.accentBright : C.paperDim,
            textShadow: won ? `0 0 40px rgba(195,163,95,0.5)` : "none",
          }}>
            {resultLabel(result?.result)}
          </p>
          <p style={{
            fontFamily: "serif", fontSize: 28, fontWeight: 700,
            color: C.paper, marginTop: 8,
          }}>
            {score.player} — {score.opponent}
          </p>
        </div>

        <Court>
          <div style={{
            position: "absolute", top: "18%", left: "50%",
            transform: "translateX(-50%)",
          }}>
            <Fighter isPlayer={false} attacking={!won} attackZone="head" />
          </div>
          <div style={{
            position: "absolute", bottom: "10%", left: "50%",
            transform: "translateX(-50%)",
          }}>
            <Fighter isPlayer={true} attacking={won} attackZone="head" />
          </div>
          <Referee side="left" flagUp={won} flagColor="#E53935" />
          <Referee side="right" flagUp={won} flagColor="#E53935" />
        </Court>

        {roundLog.length > 0 && (
          <div style={{
            marginTop: 16, padding: 14, borderRadius: 12,
            background: C.surface, border: `1px solid ${C.line}`,
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.paper, marginBottom: 8 }}>시합 기록</p>
            {roundLog.map((r) => (
              <div key={r.round} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: 11, padding: "5px 0",
                borderBottom: `1px solid ${C.line}`,
              }}>
                <span style={{ color: C.paperDim, width: 28 }}>R{r.round}</span>
                <span style={{ color: gradeColor(r.player.timing_grade), flex: 1, textAlign: "center" }}>
                  {ZONES.find(z => z.key === r.player.zone)?.kanji}{" "}
                  {gradeLabel(r.player.timing_grade)} {r.player.hit ? "✓" : ""}
                </span>
                <span style={{ color: r.opponent.hit ? C.accentBright : C.paperDim }}>
                  상대 {r.opponent.hit ? "유효" : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setPhase("ready")}
          style={{
            width: "100%", padding: "16px 0", marginTop: 16,
            borderRadius: 12, fontSize: 15, fontWeight: 700,
            background: C.accent, color: C.paper, border: "none",
            cursor: "pointer",
          }}
        >
          다시 시합
        </button>
      </div>
    );
  }

  /* ── Fight screen ── */
  return (
    <div style={{
      animation: "fadeIn 0.2s ease",
      transform: shake ? `translateX(${Math.random() > 0.5 ? 3 : -3}px) translateY(${Math.random() > 0.5 ? 2 : -2}px)` : "none",
      transition: "transform 0.05s",
    }}>
      <ScoreHUD playerScore={score.player} opponentScore={score.opponent} timeLeft={timeLeft} />

      {/* Court arena */}
      <Court>
        {/* Opponent (top) */}
        <div style={{
          position: "absolute", top: "12%", left: "50%",
          transform: "translateX(-50%)",
          transition: "all 0.2s ease",
        }}>
          <Fighter
            isPlayer={false}
            attacking={opponentAttacking}
            attackZone={lastAction?.opponent?.zone}
            hit={opponentHit}
          />
        </div>

        {/* Player (bottom) */}
        <div style={{
          position: "absolute", bottom: "6%", left: "50%",
          transform: "translateX(-50%)",
          transition: "all 0.2s ease",
        }}>
          <Fighter
            isPlayer={true}
            attacking={playerAttacking}
            attackZone={attackZone}
            hit={playerHit}
          />
        </div>

        {/* Referees */}
        <Referee side="left" flagUp={flagUp} flagColor="#E53935" />
        <Referee side="right" flagUp={flagUp} flagColor="#fff" />

        {/* Hit effect overlay */}
        {showHit && lastAction && (
          <HitOverlay
            grade={lastAction.player.timing_grade}
            zone={lastAction.player.zone}
            playerHit={lastAction.player.hit}
            opponentHit={lastAction.opponent.hit}
            visible={showHit}
          />
        )}
      </Court>

      {/* Timing bar */}
      <div style={{ padding: "10px 0" }}>
        <div style={{ fontSize: 10, color: C.paperDim, textAlign: "center", marginBottom: 4 }}>
          타이밍
        </div>
        <div style={{
          width: "100%", height: 28, borderRadius: 6,
          background: C.surfaceAlt, border: `1px solid ${C.line}`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, display: "flex" }}>
            <div style={{ flex: 3 }} />
            <div style={{ flex: 2, background: "rgba(127,168,118,0.15)", borderLeft: "1px solid rgba(127,168,118,0.3)", borderRight: "1px solid rgba(127,168,118,0.3)" }} />
            <div style={{ flex: 1.2, background: "rgba(195,163,95,0.25)", borderLeft: "1px solid rgba(195,163,95,0.3)", borderRight: "1px solid rgba(195,163,95,0.3)" }} />
            <div style={{ flex: 2, background: "rgba(127,168,118,0.15)", borderLeft: "1px solid rgba(127,168,118,0.3)", borderRight: "1px solid rgba(127,168,118,0.3)" }} />
            <div style={{ flex: 3 }} />
          </div>
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center",
          }}>
            <div style={{ flex: 3, textAlign: "center" }}>
              <span style={{ fontSize: 8, color: C.accentBright, opacity: 0.5 }}>MISS</span>
            </div>
            <div style={{ flex: 2, textAlign: "center" }}>
              <span style={{ fontSize: 8, color: "#7FA876" }}>GOOD</span>
            </div>
            <div style={{ flex: 1.2, textAlign: "center" }}>
              <span style={{ fontSize: 8, color: C.brass, fontWeight: 700 }}>PERFECT</span>
            </div>
            <div style={{ flex: 2, textAlign: "center" }}>
              <span style={{ fontSize: 8, color: "#7FA876" }}>GOOD</span>
            </div>
            <div style={{ flex: 3, textAlign: "center" }}>
              <span style={{ fontSize: 8, color: C.accentBright, opacity: 0.5 }}>MISS</span>
            </div>
          </div>
          <div key={ringPhase} style={{
            position: "absolute", top: 3, bottom: 3,
            width: 4, borderRadius: 2,
            background: C.paper,
            boxShadow: `0 0 8px ${C.paper}`,
            zIndex: 2,
            animation: "timingSlide 2s linear infinite",
          }} />
        </div>
      </div>

      {/* Attack zone buttons */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 8,
      }}>
        {ZONES.map((z) => (
          <button
            key={z.key}
            onClick={() => attack(z.key)}
            style={{
              background: C.surfaceAlt,
              border: `1px solid ${C.line}`,
              borderRadius: 12,
              padding: "16px 0",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              cursor: "pointer",
              transition: "transform 0.1s, background 0.1s",
            }}
            onPointerDown={(e) => {
              e.currentTarget.style.transform = "scale(0.93)";
              e.currentTarget.style.background = C.surface;
            }}
            onPointerUp={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = C.surfaceAlt;
            }}
            onPointerLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.background = C.surfaceAlt;
            }}
          >
            <span style={{ fontFamily: "serif", fontSize: 24, fontWeight: 800, color: C.brass }}>{z.kanji}</span>
            <span style={{ fontSize: 11, color: C.paperDim }}>{z.label}</span>
          </button>
        ))}
      </div>

      <style>{`
        @keyframes hitPop {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes timingSlide {
          0% { left: 0%; }
          50% { left: calc(100% - 4px); }
          100% { left: 0%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes flagWave {
          0%, 100% { transform: rotate(-20deg); }
          50% { transform: rotate(-35deg); }
        }
      `}</style>
    </div>
  );
}
