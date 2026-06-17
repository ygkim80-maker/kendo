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
  perfect: "#C3A35F",
  good: "#7FA876",
  miss: "#E14430",
};

const ZONES = [
  { key: "head", label: "머리", kanji: "面" },
  { key: "wrist", label: "손목", kanji: "小手" },
  { key: "waist", label: "허리", kanji: "胴" },
  { key: "thrust", label: "찌르기", kanji: "突" },
];

const TIME_LIMIT = 60;

function KendoFighter({ side, state, zone }) {
  const isLeft = side === "left";
  const mirror = isLeft ? 1 : -1;

  const bodyColor = isLeft ? "#1a3a5c" : "#5c1a1a";
  const doColor = isLeft ? "#0d2240" : "#401010";
  const menColor = isLeft ? "#2a4a6c" : "#6c2a2a";
  const skinColor = "#d4a574";

  const getAttackTransform = () => {
    if (state === "idle") return "";
    if (state === "attack_head") return `translateX(${mirror * 30}px) translateY(-10px)`;
    if (state === "attack_wrist") return `translateX(${mirror * 25}px)`;
    if (state === "attack_waist") return `translateX(${mirror * 20}px) rotate(${mirror * -10}deg)`;
    if (state === "attack_thrust") return `translateX(${mirror * 40}px)`;
    if (state === "hit") return `translateX(${mirror * -15}px)`;
    if (state === "guard") return "";
    return "";
  };

  const getShinaiAngle = () => {
    if (state === "idle") return isLeft ? -45 : -135;
    if (state === "attack_head") return isLeft ? -90 : -90;
    if (state === "attack_wrist") return isLeft ? -30 : -150;
    if (state === "attack_waist") return isLeft ? -20 : -160;
    if (state === "attack_thrust") return isLeft ? 0 : -180;
    if (state === "hit") return isLeft ? -60 : -120;
    return isLeft ? -45 : -135;
  };

  const isHit = state === "hit";
  const isAttacking = state?.startsWith("attack");

  return (
    <div
      style={{
        position: "relative",
        width: 90,
        height: 160,
        transform: getAttackTransform(),
        transition: state === "idle" ? "transform 0.3s ease" : "transform 0.15s ease-out",
        filter: isHit ? "brightness(2)" : "none",
      }}
    >
      {/* 면(Men) - 머리 */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 36,
          height: 40,
          background: menColor,
          borderRadius: "8px 8px 4px 4px",
          border: `2px solid ${C.brass}`,
          boxShadow: isHit ? `0 0 20px ${C.accentBright}` : "none",
        }}
      >
        {/* 면금(멘가네) */}
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: 4,
            right: 4,
            height: 16,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 2, background: C.brass, borderRadius: 1, opacity: 0.7 }} />
          ))}
        </div>
      </div>

      {/* 도(Do) - 몸통 */}
      <div
        style={{
          position: "absolute",
          top: 42,
          left: "50%",
          transform: "translateX(-50%)",
          width: 44,
          height: 50,
          background: doColor,
          borderRadius: 6,
          border: `1px solid ${C.brass}`,
        }}
      >
        {/* 도의 무늬 */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 6,
            right: 6,
            bottom: 8,
            border: `1px solid ${C.brass}`,
            borderRadius: 4,
            opacity: 0.4,
          }}
        />
      </div>

      {/* 코테(Kote) - 팔 */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: isLeft ? -8 : undefined,
          right: isLeft ? undefined : -8,
          width: 16,
          height: 30,
          background: bodyColor,
          borderRadius: 6,
          transform: isAttacking ? `rotate(${mirror * -20}deg)` : "none",
          transition: "transform 0.15s ease",
        }}
      />

      {/* 죽도(Shinai) */}
      <div
        style={{
          position: "absolute",
          top: 35,
          left: isLeft ? -5 : undefined,
          right: isLeft ? undefined : -5,
          width: 3,
          height: 70,
          background: `linear-gradient(to bottom, ${C.brass}, #8B7340)`,
          borderRadius: 2,
          transformOrigin: isLeft ? "bottom left" : "bottom right",
          transform: `rotate(${getShinaiAngle()}deg)`,
          transition: state === "idle" ? "transform 0.3s ease" : "transform 0.12s ease-out",
          boxShadow: isAttacking ? `0 0 8px ${C.brass}` : "none",
        }}
      />

      {/* 하카마(Hakama) - 하의 */}
      <div
        style={{
          position: "absolute",
          top: 90,
          left: "50%",
          transform: "translateX(-50%)",
          width: 50,
          height: 45,
          background: bodyColor,
          borderRadius: "0 0 4px 4px",
          clipPath: "polygon(10% 0%, 90% 0%, 100% 100%, 0% 100%)",
        }}
      >
        {/* 하카마 주름 */}
        {[20, 35, 50, 65, 80].map((x) => (
          <div
            key={x}
            style={{
              position: "absolute",
              top: 0,
              left: `${x}%`,
              width: 1,
              height: "100%",
              background: "rgba(0,0,0,0.2)",
            }}
          />
        ))}
      </div>

      {/* 발 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 6,
        }}
      >
        <div style={{ width: 14, height: 6, background: "#333", borderRadius: 3 }} />
        <div style={{ width: 14, height: 6, background: "#333", borderRadius: 3 }} />
      </div>

      {/* 히트 이펙트 */}
      {isHit && (
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 60,
            height: 60,
            background: "radial-gradient(circle, rgba(225,68,48,0.6) 0%, transparent 70%)",
            borderRadius: "50%",
            animation: "hitFlash 0.3s ease-out",
          }}
        />
      )}
    </div>
  );
}

function IpponMarker({ count, side }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: side === "left" ? "flex-start" : "flex-end" }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: `2px solid ${i < count ? C.accentBright : C.line}`,
            background: i < count ? C.accentBright : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 900,
            color: i < count ? "#fff" : C.paperDim,
            fontFamily: "'Noto Serif KR', serif",
          }}
        >
          {i < count ? "本" : ""}
        </div>
      ))}
    </div>
  );
}

function HitEffect({ grade, zone }) {
  if (!grade) return null;
  const color = grade === "perfect" ? C.perfect : grade === "good" ? C.good : C.miss;
  const label = grade === "perfect" ? "完璧!" : grade === "good" ? "良!" : "空振!";
  const zoneLabel = { head: "面!", wrist: "小手!", waist: "胴!", thrust: "突!" }[zone] || "";

  return (
    <div
      style={{
        position: "absolute",
        top: "25%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        animation: "hitTextFloat 0.8s ease-out forwards",
        zIndex: 20,
        pointerEvents: "none",
      }}
    >
      {grade !== "miss" && (
        <p
          style={{
            fontFamily: "'Noto Serif KR', serif",
            fontSize: 32,
            fontWeight: 900,
            color,
            textShadow: `0 0 20px ${color}, 0 2px 4px rgba(0,0,0,0.8)`,
            margin: 0,
          }}
        >
          {zoneLabel}
        </p>
      )}
      <p
        style={{
          fontSize: 18,
          fontWeight: 700,
          color,
          textShadow: `0 0 10px ${color}`,
          margin: 0,
        }}
      >
        {label}
      </p>
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
  const [ringProgress, setRingProgress] = useState(0);
  const [playerState, setPlayerState] = useState("idle");
  const [opponentState, setOpponentState] = useState("idle");
  const [hitEffect, setHitEffect] = useState(null);
  const [screenShake, setScreenShake] = useState(false);
  const [lastAction, setLastAction] = useState(null);
  const timerRef = useRef(null);
  const ringRef = useRef(null);
  const ringStartRef = useRef(null);

  const startBattle = useCallback(async () => {
    const info = await api.battleStart({ student_id: Number(studentId), opponent_type: "ai" });
    setBattleInfo(info);
    setScore({ player: 0, opponent: 0 });
    setRoundLog([]);
    setResult(null);
    setTimeLeft(TIME_LIMIT);
    setPhase("fight");
    setPlayerState("idle");
    setOpponentState("idle");
    startRingLoop();
  }, [studentId]);

  function startRingLoop() {
    ringStartRef.current = Date.now();
    if (ringRef.current) cancelAnimationFrame(ringRef.current);
    const animate = () => {
      const elapsed = (Date.now() - ringStartRef.current) % 2000;
      setRingProgress(elapsed / 2000);
      ringRef.current = requestAnimationFrame(animate);
    };
    ringRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    if (phase !== "fight") {
      if (ringRef.current) cancelAnimationFrame(ringRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          if (ringRef.current) cancelAnimationFrame(ringRef.current);
          api.battleTimeout(Number(studentId)).then((res) => {
            setResult(res);
            setPhase("result");
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      clearInterval(timerRef.current);
      if (ringRef.current) cancelAnimationFrame(ringRef.current);
    };
  }, [phase, studentId]);

  async function attack(zone) {
    if (phase !== "fight") return;

    const deviation = Math.abs(ringProgress - 0.5);
    const timing = Math.max(0, Math.min(1, 0.5 + (0.5 - deviation)));

    setPlayerState(`attack_${zone}`);

    const res = await api.battleAction(Number(studentId), { zone, timing });
    setLastAction(res);
    setScore(res.score);
    setRoundLog((prev) => [...prev, res]);

    setHitEffect({ grade: res.player.timing_grade, zone: res.player.zone });

    if (res.player.hit) {
      setOpponentState("hit");
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 300);
    }

    if (res.opponent.hit) {
      setTimeout(() => {
        setOpponentState(`attack_${res.opponent.zone}`);
        setTimeout(() => {
          setPlayerState("hit");
          setScreenShake(true);
          setTimeout(() => setScreenShake(false), 300);
        }, 150);
      }, 400);
    } else {
      setTimeout(() => {
        setOpponentState("attack_" + res.opponent.zone);
        setTimeout(() => setOpponentState("idle"), 300);
      }, 400);
    }

    setTimeout(() => {
      setPlayerState("idle");
      setOpponentState("idle");
      setHitEffect(null);
    }, 800);

    if (res.finished) {
      setTimeout(() => {
        clearInterval(timerRef.current);
        if (ringRef.current) cancelAnimationFrame(ringRef.current);
        setResult(res);
        setPhase("result");
        api.battleFinish(Number(studentId)).catch(() => {});
      }, 1200);
    } else {
      ringStartRef.current = Date.now();
    }
  }

  const gradeColor = (g) => g === "perfect" ? C.perfect : g === "good" ? C.good : C.miss;
  const gradeLabel = (g) => g === "perfect" ? "完璧" : g === "good" ? "良" : "空振";
  const resultLabel = (r) => r === "win" ? "勝" : r === "lose" ? "敗" : "引分";

  // --- READY ---
  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center gap-6 pt-8" style={{ animation: "fadeIn 0.3s ease" }}>
        <div className="text-center">
          <p className="font-serif text-4xl font-black" style={{ color: C.brass }}>対決</p>
          <p className="text-xs mt-2" style={{ color: C.paperDim }}>AI 가상 상대와 1v1 검도 시합</p>
        </div>

        <div style={{ display: "flex", gap: 40, alignItems: "flex-end", margin: "20px 0" }}>
          <div style={{ textAlign: "center" }}>
            <KendoFighter side="left" state="idle" />
            <p className="text-xs mt-2 font-bold" style={{ color: C.paper }}>나</p>
          </div>
          <p className="font-serif text-2xl font-bold" style={{ color: C.brass, marginBottom: 40 }}>VS</p>
          <div style={{ textAlign: "center" }}>
            <KendoFighter side="right" state="idle" />
            <p className="text-xs mt-2 font-bold" style={{ color: C.accentBright }}>AI</p>
          </div>
        </div>

        <div className="rounded-xl p-4 w-full" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <p className="text-sm font-bold mb-2" style={{ color: C.paper }}>시합 규칙</p>
          <ul className="flex flex-col gap-1.5 text-xs" style={{ color: C.paperDim }}>
            <li>• 2본 선취 시 즉시 승리 (삼본승부)</li>
            <li>• 제한시간 {TIME_LIMIT}초 · 우세 판정</li>
            <li>• 타이밍 링 중앙에 맞춰 부위를 선택</li>
            <li>• Perfect → 유효타 확률 최대</li>
          </ul>
        </div>

        <button
          onClick={startBattle}
          className="w-full py-4 rounded-xl text-base font-bold tracking-wider"
          style={{ background: C.accent, color: C.paper, border: "none", fontFamily: "'Noto Serif KR', serif" }}
        >
          始め — 시작
        </button>
      </div>
    );
  }

  // --- RESULT ---
  if (phase === "result") {
    const won = result?.result === "win";
    const lost = result?.result === "lose";
    return (
      <div className="flex flex-col items-center gap-5 pt-6" style={{ animation: "fadeIn 0.5s ease" }}>
        <p
          className="font-serif font-black"
          style={{
            fontSize: 64,
            color: won ? C.brass : lost ? C.accentBright : C.paperDim,
            textShadow: won ? `0 0 30px ${C.brass}` : lost ? `0 0 30px ${C.accentBright}` : "none",
          }}
        >
          {resultLabel(result?.result)}
        </p>

        <div style={{ display: "flex", gap: 40, alignItems: "flex-end", margin: "10px 0" }}>
          <div style={{ textAlign: "center" }}>
            <KendoFighter side="left" state={won ? "idle" : "hit"} />
          </div>
          <div style={{ textAlign: "center" }}>
            <KendoFighter side="right" state={lost ? "idle" : "hit"} />
          </div>
        </div>

        <div className="flex items-center gap-8 text-center">
          <div>
            <p className="text-xs" style={{ color: C.paperDim }}>나</p>
            <p className="font-serif text-4xl font-bold" style={{ color: C.paper }}>{score.player}</p>
            <IpponMarker count={score.player} side="left" />
          </div>
          <p className="font-serif text-lg" style={{ color: C.paperDim }}>—</p>
          <div>
            <p className="text-xs" style={{ color: C.paperDim }}>상대</p>
            <p className="font-serif text-4xl font-bold" style={{ color: C.paper }}>{score.opponent}</p>
            <IpponMarker count={score.opponent} side="right" />
          </div>
        </div>

        {roundLog.length > 0 && (
          <div className="w-full rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <p className="text-xs font-bold mb-2" style={{ color: C.paper }}>시합 기록</p>
            {roundLog.map((r) => (
              <div key={r.round} className="flex justify-between text-[11px] py-1.5" style={{ borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.paperDim }}>R{r.round}</span>
                <span style={{ color: gradeColor(r.player.timing_grade) }}>
                  {ZONES.find((z) => z.key === r.player.zone)?.kanji}{" "}
                  {gradeLabel(r.player.timing_grade)} {r.player.hit ? "有効!" : ""}
                </span>
                <span style={{ color: r.opponent.hit ? C.accentBright : C.paperDim }}>
                  상대 {r.opponent.hit ? "有効" : "—"}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setPhase("ready")}
          className="w-full py-4 rounded-xl text-sm font-bold"
          style={{ background: C.accent, color: C.paper, border: "none" }}
        >
          再試合 — 다시 대결
        </button>
      </div>
    );
  }

  // --- FIGHT ---
  const ringSize = 276.5;
  const perfectZone = 0.15;
  const goodZone = 0.40;

  return (
    <div
      className="flex flex-col items-center gap-3 pt-2"
      style={{
        animation: "fadeIn 0.3s ease",
        transform: screenShake ? `translateX(${Math.random() > 0.5 ? 4 : -4}px)` : "none",
        transition: screenShake ? "none" : "transform 0.1s",
      }}
    >
      <style>{`
        @keyframes hitFlash {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
        }
        @keyframes hitTextFloat {
          0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
          50% { opacity: 1; transform: translate(-50%, -70%) scale(1.1); }
          100% { opacity: 0; transform: translate(-50%, -90%) scale(0.9); }
        }
        @keyframes ipponFlash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>

      {/* 상단 HUD */}
      <div className="w-full flex items-center justify-between px-1">
        <div style={{ flex: 1 }}>
          <p className="text-[10px] font-bold" style={{ color: C.paper }}>나</p>
          <IpponMarker count={score.player} side="left" />
        </div>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-mono text-lg font-bold"
          style={{
            border: `2px solid ${timeLeft <= 10 ? C.accentBright : C.brass}`,
            color: timeLeft <= 10 ? C.accentBright : C.brass,
            animation: timeLeft <= 10 ? "ipponFlash 0.5s infinite" : "none",
          }}
        >
          {timeLeft}
        </div>
        <div style={{ flex: 1, textAlign: "right" }}>
          <p className="text-[10px] font-bold" style={{ color: C.accentBright }}>AI</p>
          <IpponMarker count={score.opponent} side="right" />
        </div>
      </div>

      {/* 경기장 */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: 220,
          background: `linear-gradient(180deg, ${C.bg} 0%, #151a28 50%, #1a1510 100%)`,
          borderRadius: 16,
          border: `1px solid ${C.line}`,
          overflow: "hidden",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 30,
          padding: "0 20px 15px",
        }}
      >
        {/* 바닥 라인 */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "10%",
            right: "10%",
            height: 2,
            background: `linear-gradient(90deg, transparent, ${C.brass}44, transparent)`,
          }}
        />
        {/* 중앙선 */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            width: 2,
            height: 15,
            background: C.brass,
            opacity: 0.5,
          }}
        />

        <KendoFighter side="left" state={playerState} />
        <KendoFighter side="right" state={opponentState} />

        {hitEffect && <HitEffect grade={hitEffect.grade} zone={hitEffect.zone} />}
      </div>

      {/* 타이밍 게이지 */}
      <div style={{ width: "100%", position: "relative", height: 40 }}>
        <div
          style={{
            width: "100%",
            height: 12,
            background: C.surfaceAlt,
            borderRadius: 6,
            overflow: "hidden",
            position: "relative",
            marginTop: 14,
          }}
        >
          {/* Perfect 존 */}
          <div
            style={{
              position: "absolute",
              left: `${(0.5 - perfectZone) * 100}%`,
              width: `${perfectZone * 2 * 100}%`,
              height: "100%",
              background: `${C.brass}44`,
              borderLeft: `1px solid ${C.brass}`,
              borderRight: `1px solid ${C.brass}`,
            }}
          />
          {/* Good 존 */}
          <div
            style={{
              position: "absolute",
              left: `${(0.5 - goodZone) * 100}%`,
              width: `${(goodZone - perfectZone) * 100}%`,
              height: "100%",
              background: `${C.good}22`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${(0.5 + perfectZone) * 100}%`,
              width: `${(goodZone - perfectZone) * 100}%`,
              height: "100%",
              background: `${C.good}22`,
            }}
          />
          {/* 이동하는 커서 */}
          <div
            style={{
              position: "absolute",
              left: `${ringProgress * 100}%`,
              top: -4,
              width: 4,
              height: 20,
              background: C.paper,
              borderRadius: 2,
              transform: "translateX(-50%)",
              boxShadow: `0 0 8px ${C.paper}`,
              transition: "none",
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[9px]" style={{ color: C.paperDim }}>
          <span>MISS</span>
          <span style={{ color: C.good }}>GOOD</span>
          <span style={{ color: C.brass }}>PERFECT</span>
          <span style={{ color: C.good }}>GOOD</span>
          <span>MISS</span>
        </div>
      </div>

      {/* 마지막 액션 피드백 */}
      {lastAction && (
        <div className="text-center" key={lastAction.round}>
          <span
            className="text-sm font-bold"
            style={{ color: gradeColor(lastAction.player.timing_grade) }}
          >
            {lastAction.player.hit ? "유효타!" : gradeLabel(lastAction.player.timing_grade)}
          </span>
          {lastAction.opponent.hit && (
            <span className="text-sm ml-2" style={{ color: C.accentBright }}>
              · 상대 유효타!
            </span>
          )}
        </div>
      )}

      {/* 부위 선택 버튼 */}
      <div className="grid grid-cols-4 gap-2 w-full">
        {ZONES.map((z) => (
          <button
            key={z.key}
            onClick={() => attack(z.key)}
            className="rounded-lg py-3 flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
            style={{
              background: C.surfaceAlt,
              border: `1px solid ${C.line}`,
              color: C.paper,
            }}
          >
            <span className="font-serif text-lg font-bold" style={{ color: C.brass }}>{z.kanji}</span>
            <span className="text-[10px]" style={{ color: C.paperDim }}>{z.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
