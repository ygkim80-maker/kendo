import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

const API = "http://localhost:8000";

const ZONE_META = {
  head:   { kanji: "面",   label: "머리",  color: "#4FC3F7" },
  wrist:  { kanji: "小手", label: "손목",  color: "#81C784" },
  waist:  { kanji: "胴",   label: "허리",  color: "#FFB74D" },
  thrust: { kanji: "突",   label: "찌름",  color: "#F06292" },
};

function drawChibi(ctx, cx, cy, { flip = false, pose = "ready", hitZone = null, activeZone = null, semeShake = 0, isHit = false, kamae = "chudan" }) {
  ctx.save();
  if (flip) { ctx.translate(cx * 2, 0); ctx.scale(-1, 1); }

  const shake = semeShake * (Math.random() - 0.5) * 4;
  ctx.translate(cx + shake, cy);

  const glow = hitZone ? ZONE_META[hitZone]?.color : activeZone ? ZONE_META[activeZone]?.color : null;
  if (isHit && glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 30;
  }

  const bodyCol = isHit ? "#FF5252" : "#5C6BC0";
  const armorCol = isHit ? "#B71C1C" : "#1A237E";

  ctx.fillStyle = "#333";
  ctx.fillRect(-10, 30, 8, 28);
  ctx.fillRect(2, 30, 8, 28);

  ctx.fillStyle = armorCol;
  ctx.beginPath();
  ctx.moveTo(-14, 18); ctx.lineTo(14, 18); ctx.lineTo(18, 55); ctx.lineTo(-18, 55); ctx.closePath();
  ctx.fill();

  const waistHighlight = hitZone === "waist" || activeZone === "waist";
  ctx.fillStyle = waistHighlight ? ZONE_META.waist.color : "#FF8F00";
  ctx.fillRect(-13, 4, 26, 16);
  ctx.strokeStyle = waistHighlight ? "#fff" : "#E65100";
  ctx.lineWidth = waistHighlight ? 2 : 1;
  ctx.strokeRect(-13, 4, 26, 16);

  ctx.fillStyle = bodyCol;
  ctx.fillRect(-12, -18, 24, 24);

  const wristHighlight = hitZone === "wrist" || activeZone === "wrist";
  const koteCol = wristHighlight ? ZONE_META.wrist.color : "#558B2F";
  if (pose === "strike") {
    ctx.fillStyle = koteCol;
    ctx.fillRect(10, -40, 10, 8);
    ctx.fillRect(16, -48, 8, 10);
  } else if (pose === "thrust") {
    ctx.fillStyle = koteCol;
    ctx.fillRect(10, -14, 26, 8);
    ctx.fillRect(30, -16, 8, 10);
  } else {
    ctx.fillStyle = koteCol;
    ctx.fillRect(-22, -14, 10, 8);
    ctx.fillRect(12, -14, 10, 8);
  }
  if (wristHighlight) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    if (pose === "strike") ctx.strokeRect(10, -40, 10, 8);
    else ctx.strokeRect(12, -14, 10, 8);
  }

  const headHighlight = hitZone === "head" || activeZone === "head";
  ctx.fillStyle = "#FFCCBC";
  ctx.fillRect(-5, -22, 10, 6);
  ctx.fillStyle = headHighlight ? ZONE_META.head.color : "#37474F";
  ctx.beginPath();
  ctx.arc(0, -34, 16, Math.PI, 0);
  ctx.fillRect(-16, -34, 32, 14);
  ctx.fill();
  ctx.strokeStyle = headHighlight ? "#fff" : "#90A4AE";
  ctx.lineWidth = headHighlight ? 2.5 : 1.5;
  for (let i = -10; i <= 10; i += 5) {
    ctx.beginPath(); ctx.moveTo(i, -34); ctx.lineTo(i, -20); ctx.stroke();
  }
  ctx.strokeStyle = headHighlight ? "#fff" : "#263238";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -34, 16, Math.PI, 0);
  ctx.stroke();
  ctx.strokeRect(-16, -34, 32, 14);

  const thrustHighlight = hitZone === "thrust" || activeZone === "thrust";
  ctx.strokeStyle = thrustHighlight ? ZONE_META.thrust.color : "#8D6E63";
  ctx.lineWidth = thrustHighlight ? 4 : 3;
  if (pose === "strike") {
    ctx.beginPath(); ctx.moveTo(15, -40); ctx.lineTo(15, -90); ctx.stroke();
  } else if (pose === "thrust") {
    ctx.beginPath(); ctx.moveTo(34, -10); ctx.lineTo(80, -10); ctx.stroke();
  } else if (kamae === "jodan") {
    ctx.beginPath(); ctx.moveTo(10, -20); ctx.lineTo(30, -70); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(40, -50); ctx.stroke();
  }

  ctx.restore();
}

function drawReferee(ctx, x, y, scale = 0.6, flagUp = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(-8, -20, 16, 28);
  ctx.fillStyle = "#FFCCBC";
  ctx.beginPath(); ctx.arc(0, -28, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = flagUp ? "#ef5350" : "#fff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -15);
  if (flagUp) { ctx.lineTo(20, -45); } else { ctx.lineTo(20, 0); }
  ctx.stroke();
  ctx.fillStyle = flagUp ? "#ef5350" : "#fff";
  ctx.beginPath();
  if (flagUp) {
    ctx.moveTo(20, -45); ctx.lineTo(38, -38); ctx.lineTo(22, -30); ctx.closePath();
  } else {
    ctx.moveTo(20, 0); ctx.lineTo(36, 6); ctx.lineTo(22, 14); ctx.closePath();
  }
  ctx.fill();
  ctx.restore();
}

function renderScene(canvas, state) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.65);
  sky.addColorStop(0, "#0d0d2b");
  sky.addColorStop(1, "#1a1a4e");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.65);

  const floor = ctx.createLinearGradient(0, H * 0.65, 0, H);
  floor.addColorStop(0, "#5D4037");
  floor.addColorStop(1, "#3E2723");
  ctx.fillStyle = floor;
  ctx.fillRect(0, H * 0.65, W, H * 0.35);

  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.65); ctx.lineTo(W * 0.5, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.9, H * 0.65); ctx.lineTo(W * 0.5, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H * 0.65); ctx.lineTo(W, H * 0.65); ctx.stroke();

  const refY = H * 0.82;
  drawReferee(ctx, 80, refY, 0.55, state.playerScore > 0);
  drawReferee(ctx, W / 2, H * 0.72, 0.55, false);
  drawReferee(ctx, W - 80, refY, 0.55, state.oppScore > 0);

  const gap = state.distance === "far" ? 200 : state.distance === "issoku" ? 100 : 60;
  const baseY = H * 0.62;
  const playerX = W / 2 - gap;
  const oppX = W / 2 + gap;

  drawChibi(ctx, playerX, baseY, {
    flip: false,
    pose: state.playerPose || "ready",
    hitZone: state.hitZone && state.hitTarget === "player" ? state.hitZone : null,
    activeZone: state.activeZone,
    semeShake: state.playerSeme ? 1 : 0,
    isHit: state.hitTarget === "player",
    kamae: state.playerKamae || "chudan",
  });

  drawChibi(ctx, oppX, baseY, {
    flip: true,
    pose: state.oppPose || "ready",
    hitZone: state.hitZone && state.hitTarget === "opponent" ? state.hitZone : null,
    activeZone: null,
    semeShake: 0,
    isHit: state.hitTarget === "opponent",
    kamae: state.oppKamae || "chudan",
  });

  const distLabel = { far: "원거리", issoku: "일족일도", tsuba: "코등이" }[state.distance] || "";
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(distLabel, W / 2, H * 0.68);
}

function useScene(canvasRef, sceneState) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderScene(canvas, sceneState);
  });
}

export default function Battle() {
  const { studentId } = useParams();
  const canvasRef = useRef(null);

  const [phase, setPhase] = useState("setup");
  const [oppType, setOppType] = useState("ai");
  const [oppId, setOppId] = useState("");
  const [students, setStudents] = useState([]);
  const [oppName, setOppName] = useState("AI 상대");
  const [battle, setBattle] = useState(null);
  const [log, setLog] = useState([]);
  const [holding, setHolding] = useState(null);
  const [activeZone, setActiveZone] = useState(null);
  const [timer, setTimer] = useState(180);
  const [result, setResult] = useState(null);
  const [kiai, setKiai] = useState(false);
  const [kamae, setKamae] = useState("chudan");

  useEffect(() => {
    fetch(`${API}/api/students`).then(r => r.json()).then(setStudents).catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "fighting") return;
    const id = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(id);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const sceneState = {
    playerScore: battle?.player_score ?? 0,
    oppScore: battle?.opponent_score ?? 0,
    distance: battle?.distance ?? "far",
    playerPose: holding ? "strike" : "ready",
    oppPose: "ready",
    hitZone: battle?.last_hit_zone ?? null,
    hitTarget: battle?.last_hit_target ?? null,
    activeZone,
    playerSeme: holding === "seme",
    playerKamae: kamae,
    oppKamae: "chudan",
  };
  useScene(canvasRef, sceneState);

  async function startBattle() {
    const body = {
      student_id: parseInt(studentId),
      opponent_type: oppType,
      opponent_student_id: oppType === "ghost" && oppId ? parseInt(oppId) : null,
    };
    const r = await fetch(`${API}/api/battle/start`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) { alert("시합 시작 실패"); return; }
    const data = await r.json();
    setOppName(data.opponent_name);
    setBattle(data);
    setPhase("fighting");
    setTimer(180);
    setLog([]);
  }

  const sendAction = useCallback(async (action, zone) => {
    const r = await fetch(`${API}/api/battle/action/${studentId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, zone: zone || null, kiai, kamae_change: null }),
    });
    if (!r.ok) return;
    const data = await r.json();
    setBattle(data);
    if (data.log) setLog(prev => [data.log, ...prev].slice(0, 12));
    if (data.finished) {
      const res = await fetch(`${API}/api/battle/finish/${studentId}`, { method: "POST" });
      const fin = await res.json();
      setResult(fin);
      setPhase("result");
    }
  }, [studentId, kiai, kamae]);

  async function handleTimeout() {
    const r = await fetch(`${API}/api/battle/timeout/${studentId}`, { method: "POST" });
    const fin = await r.json();
    setResult(fin);
    setPhase("result");
  }

  useEffect(() => {
    if (holding !== "seme") return;
    const id = setInterval(() => sendAction("seme"), 800);
    return () => clearInterval(id);
  }, [holding, sendAction]);

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const zoneKeys = Object.keys(ZONE_META);

  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-3xl font-bold text-yellow-400">⚔️ 시합 설정</h1>
        <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">상대 유형</label>
            <div className="flex gap-3">
              <button onClick={() => setOppType("ai")} className={`flex-1 py-2 rounded-lg font-bold ${oppType === "ai" ? "bg-blue-600" : "bg-gray-700"}`}>AI</button>
              <button onClick={() => setOppType("ghost")} className={`flex-1 py-2 rounded-lg font-bold ${oppType === "ghost" ? "bg-purple-600" : "bg-gray-700"}`}>유령 대전</button>
            </div>
          </div>
          {oppType === "ghost" && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">상대 선택</label>
              <select value={oppId} onChange={e => setOppId(e.target.value)} className="w-full bg-gray-700 rounded-lg p-2">
                <option value="">-- 선수 선택 --</option>
                {students.filter(s => s.id !== parseInt(studentId)).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={startBattle} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl text-lg mt-2">
            시작 ！
          </button>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const won = result?.result === "win";
    const draw = result?.result === "draw";
    return (
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
        <div className={`text-5xl font-black ${won ? "text-yellow-400" : draw ? "text-gray-300" : "text-red-400"}`}>
          {won ? "勝！" : draw ? "引分" : "負"}
        </div>
        <div className="text-2xl">{won ? "승리!" : draw ? "무승부" : "패배..."}</div>
        <div className="text-lg text-gray-300">
          {result?.score?.player ?? 0} 본 : {result?.score?.opponent ?? 0} 본
        </div>
        <div className="flex gap-4 mt-4">
          <button onClick={() => { setPhase("setup"); setBattle(null); setResult(null); setTimer(180); }} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold">다시 하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-3 gap-3">
      <div className="flex items-center justify-between w-full max-w-3xl bg-gray-800 rounded-xl px-4 py-2">
        <div className="text-center">
          <div className="text-xs text-gray-400">나</div>
          <div className="text-3xl font-black text-yellow-400">{battle?.player_score ?? 0}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-mono font-bold text-red-400">{fmtTime(timer)}</div>
          <div className="text-xs text-gray-400">{battle?.distance === "far" ? "원거리" : battle?.distance === "issoku" ? "일족일도" : "코등이"}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">{oppName}</div>
          <div className="text-3xl font-black text-red-400">{battle?.opponent_score ?? 0}</div>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={750}
        height={320}
        className="rounded-xl border border-gray-700 max-w-full"
        style={{ imageRendering: "pixelated" }}
      />

      {log.length > 0 && (
        <div className="w-full max-w-3xl bg-gray-800 rounded-xl px-3 py-1 text-xs text-gray-300 h-12 overflow-hidden">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      <div className="w-full max-w-3xl grid grid-cols-2 gap-3">
        <div className="col-span-2 grid grid-cols-4 gap-2">
          {zoneKeys.map(z => (
            <button
              key={z}
              onPointerEnter={() => setActiveZone(z)}
              onPointerLeave={() => setActiveZone(null)}
              onPointerDown={() => { setHolding("strike"); sendAction("strike", z); }}
              onPointerUp={() => setHolding(null)}
              className="py-3 rounded-xl font-bold text-lg active:scale-95 transition-transform"
              style={{ backgroundColor: ZONE_META[z].color + "33", border: `2px solid ${ZONE_META[z].color}`, color: ZONE_META[z].color }}
            >
              {ZONE_META[z].kanji}<br /><span className="text-xs font-normal">{ZONE_META[z].label}</span>
            </button>
          ))}
        </div>

        <button
          onPointerDown={() => { setHolding("step_in"); sendAction("step_in"); }}
          onPointerUp={() => setHolding(null)}
          className="bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold"
        >앞으로 ▶</button>
        <button
          onPointerDown={() => { setHolding("step_back"); sendAction("step_back"); }}
          onPointerUp={() => setHolding(null)}
          className="bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold"
        >◀ 뒤로</button>

        <button
          onPointerDown={() => setHolding("seme")}
          onPointerUp={() => setHolding(null)}
          className={`py-3 rounded-xl font-bold ${holding === "seme" ? "bg-orange-500" : "bg-orange-800 hover:bg-orange-700"}`}
        >세메 (꾹)</button>
        <button
          onPointerDown={() => { setKiai(true); sendAction("kiai"); }}
          onPointerUp={() => setKiai(false)}
          className="bg-red-800 hover:bg-red-700 py-3 rounded-xl font-bold"
        >기합 ！！</button>

        <div className="col-span-2 flex gap-2 justify-center">
          {["chudan", "jodan", "gedan"].map(k => (
            <button
              key={k}
              onClick={() => { setKamae(k); sendAction("kamae", null); }}
              className={`px-4 py-2 rounded-lg text-sm font-bold ${kamae === k ? "bg-indigo-600" : "bg-gray-700"}`}
            >{k === "chudan" ? "中段" : k === "jodan" ? "上段" : "下段"}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
