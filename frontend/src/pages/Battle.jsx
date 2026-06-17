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
  const timerRef = useRef(null);
  const ringRef = useRef(null);

  const startBattle = useCallback(async () => {
    const info = await api.battleStart({ student_id: Number(studentId), opponent_type: "ai" });
    setBattleInfo(info);
    setScore({ player: 0, opponent: 0 });
    setRoundLog([]);
    setResult(null);
    setTimeLeft(TIME_LIMIT);
    setPhase("fight");
    startRing();
  }, [studentId]);

  function startRing() {
    setRingPhase((p) => p + 1);
  }

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
    const elapsed = (ringPhase * 2000 - (Date.now() % 2000)) / 2000;
    const timing = Math.max(0, Math.min(1, 0.5 + (elapsed - 0.5) * 0.8));

    const res = await api.battleAction(Number(studentId), { zone, timing });
    setLastAction(res);
    setScore(res.score);
    setRoundLog((prev) => [...prev, res]);

    if (res.finished) {
      clearInterval(timerRef.current);
      setResult(res);
      setPhase("result");
      await api.battleFinish(Number(studentId)).catch(() => {});
    } else {
      startRing();
    }
  }

  const gradeColor = (g) =>
    g === "perfect" ? C.brass : g === "good" ? "#7FA876" : C.accentBright;
  const gradeLabel = (g) =>
    g === "perfect" ? "完璧" : g === "good" ? "良" : "空振";
  const resultLabel = (r) =>
    r === "win" ? "勝" : r === "lose" ? "敗" : "引分";

  if (phase === "ready") {
    return (
      <div className="flex flex-col items-center gap-6 pt-10" style={{ animation: "fadeIn 0.3s ease" }}>
        <div className="text-center">
          <p className="font-serif text-3xl font-black" style={{ color: C.brass }}>対決</p>
          <p className="text-xs mt-1" style={{ color: C.paperDim }}>AI 가상 상대와 1v1 대결</p>
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

  if (phase === "result") {
    return (
      <div className="flex flex-col items-center gap-6 pt-10" style={{ animation: "fadeIn 0.3s ease" }}>
        <p
          className="font-serif font-black text-5xl"
          style={{ color: result?.result === "win" ? C.brass : result?.result === "lose" ? C.accentBright : C.paperDim }}
        >
          {resultLabel(result?.result)}
        </p>
        <div className="flex items-center gap-8 text-center">
          <div>
            <p className="text-xs" style={{ color: C.paperDim }}>나</p>
            <p className="font-serif text-4xl font-bold" style={{ color: C.paper }}>{score.player}</p>
          </div>
          <p className="font-serif text-lg" style={{ color: C.paperDim }}>—</p>
          <div>
            <p className="text-xs" style={{ color: C.paperDim }}>상대</p>
            <p className="font-serif text-4xl font-bold" style={{ color: C.paper }}>{score.opponent}</p>
          </div>
        </div>
        {roundLog.length > 0 && (
          <div className="w-full rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <p className="text-xs font-bold mb-2" style={{ color: C.paper }}>라운드 기록</p>
            {roundLog.map((r) => (
              <div key={r.round} className="flex justify-between text-[11px] py-1" style={{ borderBottom: `1px solid ${C.line}` }}>
                <span style={{ color: C.paperDim }}>R{r.round}</span>
                <span style={{ color: gradeColor(r.player.timing_grade) }}>
                  {r.player.zone === "head" ? "머리" : r.player.zone === "wrist" ? "손목" : r.player.zone === "waist" ? "허리" : "찌르기"}{" "}
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

  return (
    <div className="flex flex-col items-center gap-4 pt-4" style={{ animation: "fadeIn 0.3s ease" }}>
      {/* 점수 */}
      <div className="flex items-center gap-6 w-full justify-center">
        <div className="text-center">
          <p className="text-[10px]" style={{ color: C.paperDim }}>나</p>
          <p className="font-serif text-3xl font-bold" style={{ color: C.paper }}>{score.player}</p>
        </div>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center font-mono text-lg font-bold"
          style={{ border: `2px solid ${timeLeft <= 10 ? C.accentBright : C.brass}`, color: timeLeft <= 10 ? C.accentBright : C.brass }}
        >
          {timeLeft}
        </div>
        <div className="text-center">
          <p className="text-[10px]" style={{ color: C.paperDim }}>상대</p>
          <p className="font-serif text-3xl font-bold" style={{ color: C.paper }}>{score.opponent}</p>
        </div>
      </div>

      {/* 타이밍 링 */}
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
          <circle cx="50" cy="50" r="44" fill="none" stroke={C.surfaceAlt} strokeWidth="3" />
          <circle
            cx="50" cy="50" r="44"
            fill="none"
            stroke={C.brass}
            strokeWidth="3"
            strokeDasharray="276.5"
            strokeDashoffset="0"
            strokeLinecap="round"
            style={{
              animation: `shrinkRing 2s linear infinite`,
              transformOrigin: "50% 50%",
            }}
            key={ringPhase}
          />
        </svg>
        <p className="font-serif text-xs" style={{ color: C.paperDim }}>타이밍!</p>
      </div>

      {/* 마지막 액션 피드백 */}
      {lastAction && (
        <div className="text-center" style={{ animation: "fadeIn 0.2s ease" }} key={lastAction.round}>
          <p className="text-lg font-bold" style={{ color: gradeColor(lastAction.player.timing_grade) }}>
            {gradeLabel(lastAction.player.timing_grade)}
          </p>
          <p className="text-[11px]" style={{ color: C.paperDim }}>
            {lastAction.player.hit ? "유효타!" : "범타"}
            {lastAction.opponent.hit ? " · 상대 유효타!" : ""}
          </p>
        </div>
      )}

      {/* 부위 선택 */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {ZONES.map((z) => (
          <button
            key={z.key}
            onClick={() => attack(z.key)}
            className="rounded-xl py-5 flex flex-col items-center gap-1 active:scale-95 transition-transform"
            style={{ background: C.surfaceAlt, border: `1px solid ${C.line}`, color: C.paper }}
          >
            <span className="font-serif text-xl font-bold" style={{ color: C.brass }}>{z.kanji}</span>
            <span className="text-xs" style={{ color: C.paperDim }}>{z.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
