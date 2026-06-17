import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../hooks/api";

const C = {
  bg: "#0B0E15", surface: "#1D2433", surfaceAlt: "#252E40",
  paper: "#ECE4D3", paperDim: "#9B9485", brass: "#C3A35F",
  accent: "#9B3A2C", accentBright: "#E14430", line: "rgba(236,228,211,0.10)",
};

const ZONES = [
  { key: "head", kanji: "面", label: "머리" },
  { key: "wrist", kanji: "小手", label: "손목" },
  { key: "waist", kanji: "胴", label: "허리" },
  { key: "thrust", kanji: "突", label: "찌르기" },
];
const KAMAE_LABELS = { chudan: "中段", jodan: "上段", gedan: "下段" };
const DIST_LABELS = { far: "원거리", issoku: "일족일도", tsuba: "코등이" };
const TIME_LIMIT = 60;

/* ── Audio ── */
const audioCtx = typeof AudioContext !== "undefined" ? new AudioContext() : null;
function playSound(type) {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain); gain.connect(audioCtx.destination);
  const t = audioCtx.currentTime;
  if (type === "fumikomi") {
    osc.type = "square"; osc.frequency.value = 80;
    gain.gain.setValueAtTime(0.4, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    osc.start(); osc.stop(t + 0.15);
  } else if (type === "hit") {
    osc.type = "sawtooth"; osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.5, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.start(); osc.stop(t + 0.1);
  } else if (type === "kiai") {
    osc.type = "sawtooth"; osc.frequency.value = 350;
    gain.gain.setValueAtTime(0.25, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
    osc.start(); osc.stop(t + 0.25);
  } else if (type === "shinai") {
    osc.type = "triangle"; osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.12, t); gain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
    osc.start(); osc.stop(t + 0.04);
  }
}

/* ══════════════════════════════════════════════
   Canvas 2D Kendo Fighter Drawing
   ══════════════════════════════════════════════ */
function drawFighter(ctx, x, y, { pose = "ready", attackZone = null, hit = false, flip = false, semeShake = 0, scale = 1 }) {
  ctx.save();
  ctx.translate(x + semeShake, y);
  ctx.scale(scale, scale);
  if (flip) { ctx.scale(-1, 1); ctx.translate(-120, 0); }

  let bx = 0, by = 0;
  if (pose === "attack") { bx = 15; by = -5; }
  if (pose === "hit") { bx = -10; by = 3; }
  ctx.translate(bx, by);

  if (hit) { ctx.globalAlpha = 0.7; }

  // Feet shadows
  ctx.fillStyle = "#0a0a1a";
  ctx.beginPath(); ctx.ellipse(42, 275, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(62, 278, 12, 4, 0, 0, Math.PI * 2); ctx.fill();

  // Hakama (wide pleated skirt)
  ctx.fillStyle = "#0d1b3a";
  ctx.beginPath();
  ctx.moveTo(25, 148); ctx.lineTo(18, 272); ctx.quadraticCurveTo(42, 282, 52, 278);
  ctx.quadraticCurveTo(62, 282, 85, 272); ctx.lineTo(78, 148); ctx.closePath();
  ctx.fill();
  // Pleat lines
  ctx.strokeStyle = "rgba(8,20,40,0.3)"; ctx.lineWidth = 1;
  for (const px of [33, 42, 52, 62, 71]) {
    ctx.beginPath(); ctx.moveTo(px, 150); ctx.lineTo(px + (px < 52 ? -2 : 2), 275); ctx.stroke();
  }

  // Tare (waist protector)
  for (let i = 0; i < 5; i++) {
    const tw = i === 2 ? 13 : 10;
    ctx.fillStyle = "#1a1535";
    ctx.beginPath();
    ctx.roundRect(26 + i * 10, 145, tw, 22, 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(42,32,80,0.5)"; ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Keikogi (jacket)
  ctx.fillStyle = "#0d1b3a";
  ctx.beginPath();
  ctx.moveTo(30, 80); ctx.lineTo(26, 148); ctx.lineTo(78, 148); ctx.lineTo(74, 80);
  ctx.closePath(); ctx.fill();
  // Left sleeve
  ctx.beginPath();
  ctx.moveTo(30, 84); ctx.lineTo(12, 102); ctx.lineTo(16, 115); ctx.lineTo(32, 105);
  ctx.closePath(); ctx.fill();
  // Right sleeve
  ctx.beginPath();
  ctx.moveTo(74, 84); ctx.lineTo(92, 102); ctx.lineTo(88, 115); ctx.lineTo(72, 105);
  ctx.closePath(); ctx.fill();

  // Do (chest armor)
  ctx.strokeStyle = "rgba(58,42,90,0.8)"; ctx.lineWidth = 1;
  ctx.fillStyle = "#1a1535";
  ctx.beginPath();
  ctx.moveTo(30, 82); ctx.quadraticCurveTo(28, 95, 30, 140);
  ctx.lineTo(74, 140); ctx.quadraticCurveTo(76, 95, 74, 82);
  ctx.quadraticCurveTo(52, 75, 30, 82);
  ctx.fill(); ctx.stroke();
  // Lacquer panel
  ctx.fillStyle = "rgba(122,34,0,0.8)";
  ctx.beginPath();
  ctx.moveTo(34, 100); ctx.quadraticCurveTo(32, 115, 34, 135);
  ctx.lineTo(70, 135); ctx.quadraticCurveTo(72, 115, 70, 100);
  ctx.quadraticCurveTo(52, 95, 34, 100);
  ctx.fill();

  // Neck
  ctx.fillStyle = "#d4a574";
  ctx.fillRect(46, 55, 12, 12);

  // Men (head armor)
  ctx.fillStyle = "#0d1535";
  ctx.beginPath();
  ctx.arc(52, 40, 22, 0, Math.PI * 2); ctx.fill();
  // Men-gane (face grille)
  ctx.strokeStyle = "#3a3a5a"; ctx.lineWidth = 1.5;
  for (let gy = 30; gy < 50; gy += 4) {
    ctx.beginPath(); ctx.moveTo(36, gy); ctx.lineTo(68, gy); ctx.stroke();
  }
  // Tsuki-dare (throat protector)
  ctx.fillStyle = "#1a1535";
  ctx.fillRect(38, 50, 28, 10);

  // Kote (gloves)
  ctx.fillStyle = "#1a1535";
  ctx.beginPath(); ctx.ellipse(14, 112, 8, 6, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(90, 112, 8, 6, 0.3, 0, Math.PI * 2); ctx.fill();

  // Shinai (bamboo sword)
  const shinaiLen = 85;
  let rad;
  if (pose === "attack") {
    if (attackZone === "head") rad = -0.3;
    else if (attackZone === "wrist") rad = 0.4;
    else if (attackZone === "waist") rad = 0.8;
    else if (attackZone === "thrust") rad = -0.1;
    else rad = -0.3;
  } else { rad = -0.15; }
  const pivotX = 85, pivotY = 108;
  // Blade
  ctx.strokeStyle = "#c4a45a"; ctx.lineWidth = 3;
  const tipX = pivotX + Math.sin(rad) * shinaiLen;
  const tipY = pivotY - Math.cos(rad) * shinaiLen;
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(tipX, tipY); ctx.stroke();
  // Tsuba (guard)
  ctx.fillStyle = "#6b4e1b";
  const tsubaX = pivotX + Math.sin(rad) * 8;
  const tsubaY2 = pivotY - Math.cos(rad) * 8;
  ctx.beginPath(); ctx.ellipse(tsubaX, tsubaY2, 5, 5, 0, 0, Math.PI * 2); ctx.fill();
  // Tip
  ctx.fillStyle = "#f5f0e0";
  const sakiX = pivotX + Math.sin(rad) * (shinaiLen - 4);
  const sakiY = pivotY - Math.cos(rad) * (shinaiLen - 4);
  ctx.beginPath(); ctx.ellipse(sakiX, sakiY, 3, 4, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawReferee(ctx, x, y, scale, flagUp) {
  ctx.save();
  ctx.translate(x, y);
  const s = scale;
  // Head
  ctx.fillStyle = "#d4a574";
  ctx.beginPath(); ctx.arc(0, -15 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
  // Body (white shirt)
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(-7 * s, -10 * s, 14 * s, 20 * s);
  // Tie
  ctx.fillStyle = "#8b1a1a";
  ctx.fillRect(-1, -10 * s, 2, 12 * s);
  // Pants
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(-7 * s, 10 * s, 14 * s, 14 * s);
  // Red flag (left)
  ctx.strokeStyle = "#8b6914"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-10, -5); ctx.lineTo(-10, flagUp ? -30 : -12); ctx.stroke();
  ctx.fillStyle = flagUp ? "#E53935" : "rgba(68,34,34,0.3)";
  ctx.fillRect(-18, flagUp ? -38 : -18, 10, 7);
  // White flag (right)
  ctx.beginPath(); ctx.moveTo(10, -5); ctx.lineTo(10, flagUp ? -30 : -12); ctx.stroke();
  ctx.fillStyle = flagUp ? "#f0f0f0" : "rgba(68,68,68,0.3)";
  ctx.fillRect(8, flagUp ? -38 : -18, 10, 7);
  ctx.restore();
}

function drawScene(canvas, sceneState) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // Wooden floor
  ctx.fillStyle = "#D4B88C";
  ctx.fillRect(0, 0, W, H);
  // Wood grain
  ctx.strokeStyle = "rgba(139,107,66,0.18)"; ctx.lineWidth = 1;
  for (let i = 1; i <= 15; i++) {
    ctx.beginPath(); ctx.moveTo(i * 25, 0); ctx.lineTo(i * 25, H); ctx.stroke();
  }
  // Green boundary
  ctx.strokeStyle = "#2E7D32"; ctx.lineWidth = 2.5;
  ctx.strokeRect(16, 16, W - 32, H - 32);
  // Center circle
  ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 50, 30, 0, 0, Math.PI * 2); ctx.stroke();
  // Cross marks
  ctx.strokeStyle = "#2E7D32"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(140, H / 2); ctx.lineTo(162, H / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(238, H / 2); ctx.lineTo(260, H / 2); ctx.stroke();

  const { distance, playerPose, opponentPose, playerHit, opponentHit,
          attackZone, opponentZone, flags, semeShake } = sceneState;

  // Distance → position
  const gap = distance === "far" ? 80 : distance === "issoku" ? 30 : 0;
  const playerX = W / 2 - 60 - gap / 2;
  const opponentX = W / 2 + gap / 2 - 60;
  const fighterY = 30;

  // Draw player
  drawFighter(ctx, playerX, fighterY, {
    pose: playerPose, attackZone, hit: playerHit, flip: false, semeShake,
  });
  // Draw opponent
  drawFighter(ctx, opponentX, fighterY, {
    pose: opponentPose, attackZone: opponentZone, hit: opponentHit, flip: true, semeShake: -semeShake * 0.6,
  });

  // Referees
  const refPositions = [
    { x: 22, y: 140 },
    { x: W - 22, y: 140 },
    { x: W / 2, y: H - 25 },
  ];
  refPositions.forEach((rp, i) => {
    const sc = i === 2 ? 1.1 : 0.85;
    const flagUp = flags && flags[i];
    drawReferee(ctx, rp.x, rp.y, sc, flagUp);
  });
}

/* ══════════════════════════════════════════════
   Canvas Scene Hook
   ══════════════════════════════════════════════ */
function useCanvasScene(canvasRef, sceneState) {
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 400;
    canvas.height = 320;
    drawScene(canvas, sceneState);
  }, [canvasRef, sceneState]);
}

export default function Battle() {
  const { studentId } = useParams();
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("ready");
  const [state, setState] = useState({
    distance: "far", player_kamae: "chudan", opponent_kamae: "chudan",
    score: { player: 0, opponent: 0 }, hansoku: { player: 0, opponent: 0 },
    seme_pressure: 0.5, opening_zone: null, finished: false, result: null, turn: 0,
  });
  const [lastResult, setLastResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [playerPose, setPlayerPose] = useState("ready");
  const [opponentPose, setOpponentPose] = useState("ready");
  const [playerHit, setPlayerHit] = useState(false);
  const [opponentHit, setOpponentHit] = useState(false);
  const [attackZone, setAttackZone] = useState(null);
  const [shake, setShake] = useState(false);
  const [flags, setFlags] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [kiai, setKiai] = useState(false);
  const [kiaiTimer, setKiaiTimer] = useState(0);
  const [semeHolding, setSemeHolding] = useState(false);
  const [semeShake, setSemeShake] = useState(0);
  const timerRef = useRef(null);
  const logRef = useRef(null);
  const semeIntervalRef = useRef(null);
  const semeTickRef = useRef(0);
  const kiaiTimeoutRef = useRef(null);

  // Canvas scene
  const sceneState = {
    distance: state.distance, playerPose, opponentPose,
    playerHit, opponentHit, attackZone,
    opponentZone: lastResult?.opponent_zone,
    flags, semeShake,
  };
  useCanvasScene(canvasRef, sceneState);

  const startBattle = useCallback(async () => {
    setPhase("countdown"); setCountdown(3);
    const info = await api.battleStart({ student_id: Number(studentId), opponent_type: "ai" });
    setState(s => ({ ...s, ...info, score: info.score || { player: 0, opponent: 0 } }));
    setTimeLeft(TIME_LIMIT); setLastResult(null); setEventLog([]);
    setPlayerPose("ready"); setOpponentPose("ready");
    setFlags(null); setKiai(false); setKiaiTimer(0);
  }, [studentId]);

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown <= 0) { setPhase("fight"); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 900);
    return () => clearTimeout(t);
  }, [phase, countdown]);

  // Timer
  useEffect(() => {
    if (phase !== "fight") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          api.battleTimeout(Number(studentId)).then(res => {
            setState(s => ({ ...s, ...res }));
            setPhase("result");
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, studentId]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [eventLog]);

  // ── 세메 홀드 시스템 ──
  function startSemeHold() {
    if (phase !== "fight" || state.distance === "far") return;
    setSemeHolding(true);
    semeTickRef.current = 0;
    playSound("shinai");
    semeIntervalRef.current = setInterval(() => {
      setSemeShake(Math.random() * 5 - 2.5);
      semeTickRef.current += 1;
      if (semeTickRef.current % 3 === 0) playSound("shinai");
      if (semeTickRef.current % 5 === 0) {
        api.battleAction(Number(studentId), { action: "seme", kiai: false }).then(res => {
          setState(s => ({ ...s, ...res }));
          if (res.player_event) setEventLog(p => [...p.slice(-20), { side: "player", text: res.player_event }]);
          if (res.opponent_event) setEventLog(p => [...p.slice(-20), { side: "opponent", text: res.opponent_event }]);
        }).catch(() => {});
      }
    }, 60);
  }
  function stopSemeHold() {
    setSemeHolding(false); setSemeShake(0);
    clearInterval(semeIntervalRef.current);
  }
  useEffect(() => () => clearInterval(semeIntervalRef.current), []);

  // ── 기합 휘발성 타이머 (1.5초) ──
  function activateKiai() {
    if (kiai) return;
    setKiai(true); setKiaiTimer(1.5); playSound("kiai");
    clearTimeout(kiaiTimeoutRef.current);
    const start = Date.now();
    const tick = () => {
      const rem = Math.max(0, 1.5 - (Date.now() - start) / 1000);
      setKiaiTimer(rem);
      if (rem > 0) kiaiTimeoutRef.current = setTimeout(tick, 50);
      else { setKiai(false); setKiaiTimer(0); }
    };
    kiaiTimeoutRef.current = setTimeout(tick, 50);
  }
  useEffect(() => () => clearTimeout(kiaiTimeoutRef.current), []);

  // ── Action handler ──
  async function doAction(action, zone = null, kamae = null) {
    if (phase !== "fight") return;
    const res = await api.battleAction(Number(studentId), {
      action, zone, kiai, kamae_change: kamae,
    });
    setState(s => ({ ...s, ...res }));
    setLastResult(res);

    if (res.player_event) setEventLog(p => [...p.slice(-20), { side: "player", text: res.player_event }]);
    if (res.opponent_event) setEventLog(p => [...p.slice(-20), { side: "opponent", text: res.opponent_event }]);

    if (action === "strike") {
      playSound("fumikomi");
      setAttackZone(zone);
      setPlayerPose("attack");
      setTimeout(() => setPlayerPose("ready"), 450);

      if (res.player_ippon?.ippon) {
        playSound("hit");
        setOpponentHit(true); setShake(true);
        setFlags(res.flags_player);
        setTimeout(() => { setOpponentHit(false); setShake(false); }, 400);
        setTimeout(() => setFlags(null), 2500);
      }
    }

    if (res.opponent_zone && res.opponent_ippon) {
      setTimeout(() => {
        setOpponentPose("attack");
        if (res.opponent_ippon?.ippon) {
          playSound("hit");
          setPlayerHit(true); setShake(true);
          setFlags(res.flags_opponent);
          setTimeout(() => { setPlayerHit(false); setShake(false); }, 400);
          setTimeout(() => setFlags(null), 2500);
        }
        setTimeout(() => setOpponentPose("ready"), 450);
      }, 300);
    }

    if (res.finished) {
      clearInterval(timerRef.current);
      setTimeout(() => setPhase("result"), 1500);
      await api.battleFinish(Number(studentId)).catch(() => {});
    }
    if (kiai) { setKiai(false); setKiaiTimer(0); clearTimeout(kiaiTimeoutRef.current); }
  }

  const dist = state.distance;
  const opening = state.opening_zone;
  const canStrike = dist === "issoku" || dist === "tsuba";

  /* ── Countdown overlay ── */
  if (phase === "countdown") {
    const labels = ["始め!", "構え!", "礼!"];
    return (
      <div style={{ padding: "12px 0", textAlign: "center" }}>
        <div style={{ position: "relative", borderRadius: 14, overflow: "hidden" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: 14 }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,.4)" }}>
            <p key={countdown} style={{ fontFamily: "serif", fontSize: 52, fontWeight: 900, color: countdown === 0 ? C.brass : "#fff", textShadow: `0 0 40px ${countdown === 0 ? C.brass : "rgba(255,255,255,.4)"}`, animation: "hitPop .6s ease-out" }}>
              {countdown > 0 ? labels[countdown - 1] : "始め!"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Ready ── */
  if (phase === "ready") {
    return (
      <div style={{ padding: "12px 0", animation: "fadeIn .3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <p style={{ fontFamily: "serif", fontSize: 30, fontWeight: 900, color: C.brass }}>対決</p>
          <p style={{ fontSize: 12, color: C.paperDim, marginTop: 4 }}>기검체일치 — 검도 시합 시뮬레이터</p>
        </div>
        <div style={{ borderRadius: 14, overflow: "hidden" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: 14 }} />
        </div>
        <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: C.surface, border: `1px solid ${C.line}` }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: C.paper, marginBottom: 8 }}>시합 규칙</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 12, color: C.paperDim }}>
            <span>• 삼본승부 (3심제) — 2본 선취 승리</span>
            <span>• 세메(꾹 누르기)로 상대 빈틈을 만들어라</span>
            <span>• 기합 → 1.5초 내 타격해야 유효!</span>
            <span>• 심판 2명 이상 깃발 → 한판 인정</span>
          </div>
        </div>
        <button onClick={startBattle} style={{ width: "100%", padding: "16px 0", marginTop: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, background: `linear-gradient(135deg,${C.accent} 0%,#7A2E22 100%)`, color: C.paper, border: "none", cursor: "pointer", boxShadow: `0 4px 20px rgba(155,58,44,.4)` }}>
          시합 시작
        </button>
      </div>
    );
  }

  /* ── Result ── */
  if (phase === "result") {
    const won = state.result === "win";
    const lost = state.result === "lose";
    return (
      <div style={{ padding: "12px 0", animation: "fadeIn .3s ease" }}>
        <div style={{ textAlign: "center", padding: "24px 0", marginBottom: 12, borderRadius: 16, background: won ? "rgba(195,163,95,.08)" : lost ? "rgba(225,68,48,.06)" : "rgba(155,148,133,.06)" }}>
          <p style={{ fontFamily: "serif", fontSize: 52, fontWeight: 900, color: won ? C.brass : lost ? C.accentBright : C.paperDim }}>{won ? "勝利" : lost ? "敗北" : "引分"}</p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 8 }}>
            <div><p style={{ fontSize: 10, color: C.paperDim }}>나</p><p style={{ fontFamily: "serif", fontSize: 28, fontWeight: 700, color: C.paper }}>{state.score.player}</p></div>
            <span style={{ fontSize: 18, color: C.paperDim }}>—</span>
            <div><p style={{ fontSize: 10, color: C.paperDim }}>상대</p><p style={{ fontFamily: "serif", fontSize: 28, fontWeight: 700, color: C.paper }}>{state.score.opponent}</p></div>
          </div>
        </div>
        <div style={{ borderRadius: 14, overflow: "hidden" }}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: 14 }} />
        </div>
        {eventLog.length > 0 && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: C.surface, border: `1px solid ${C.line}`, maxHeight: 140, overflow: "auto" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.paper, marginBottom: 6 }}>시합 기록</p>
            {eventLog.map((e, i) => (
              <p key={i} style={{ fontSize: 11, color: e.side === "player" ? C.paper : C.accentBright, padding: "2px 0", borderBottom: `1px solid ${C.line}` }}>
                {e.side === "player" ? "▸ " : "◂ "}{e.text}
              </p>
            ))}
          </div>
        )}
        <button onClick={() => setPhase("ready")} style={{ width: "100%", padding: "16px 0", marginTop: 14, borderRadius: 12, fontSize: 15, fontWeight: 700, background: C.accent, color: C.paper, border: "none", cursor: "pointer" }}>다시 시합</button>
      </div>
    );
  }

  /* ── Fight ── */
  return (
    <div style={{ transform: shake ? `translate(${Math.random() > 0.5 ? 4 : -4}px,${Math.random() > 0.5 ? 2 : -2}px)` : "none", transition: "transform .05s" }}>
      {/* HUD */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", marginBottom: 2 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontSize: 10, color: C.paperDim }}>나</span>
          {[0, 1].map(i => <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < state.score.player ? C.accent : "transparent", border: `2px solid ${i < state.score.player ? C.accent : C.line}`, boxShadow: i < state.score.player ? `0 0 6px ${C.accent}` : "none" }} />)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: C.brass, fontWeight: 700 }}>{DIST_LABELS[dist]}</span>
          <div style={{ width: 42, height: 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: `2.5px solid ${timeLeft <= 10 ? C.accentBright : C.brass}`, color: timeLeft <= 10 ? C.accentBright : C.brass, fontFamily: "monospace", fontSize: 17, fontWeight: 800 }}>{timeLeft}</div>
          <span style={{ fontSize: 9, color: C.paperDim }}>{KAMAE_LABELS[state.opponent_kamae]}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {[0, 1].map(i => <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < state.score.opponent ? C.accentBright : "transparent", border: `2px solid ${i < state.score.opponent ? C.accentBright : C.line}`, boxShadow: i < state.score.opponent ? `0 0 6px ${C.accentBright}` : "none" }} />)}
          <span style={{ fontSize: 10, color: C.paperDim }}>상대</span>
        </div>
      </div>

      {/* Seme Pressure Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
        <span style={{ fontSize: 9, color: C.accentBright, width: 28 }}>상대</span>
        <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.surfaceAlt, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: `${state.seme_pressure * 100}%`, background: state.seme_pressure > 0.65 ? C.brass : state.seme_pressure < 0.35 ? C.accentBright : C.paperDim, borderRadius: 3, transition: "width .3s, background .3s" }} />
          <div style={{ position: "absolute", top: -2, bottom: -2, left: "50%", width: 1, background: "rgba(255,255,255,.3)" }} />
        </div>
        <span style={{ fontSize: 9, color: C.brass, width: 28, textAlign: "right" }}>나</span>
      </div>

      {/* Canvas */}
      <div style={{ borderRadius: 14, overflow: "hidden", position: "relative" }}>
        <canvas ref={canvasRef} style={{ width: "100%", height: "auto", borderRadius: 14 }} />
        {opening && (
          <div style={{ position: "absolute", top: opening === "head" ? "10%" : opening === "wrist" ? "40%" : opening === "waist" ? "55%" : "30%", right: "25%", fontSize: 22, color: C.accentBright, animation: "pulse .5s ease-in-out infinite", textShadow: `0 0 12px ${C.accentBright}`, pointerEvents: "none" }}>❗</div>
        )}
      </div>

      {/* Event log */}
      <div ref={logRef} style={{ height: 44, overflow: "auto", padding: "3px 0", marginBottom: 3 }}>
        {eventLog.slice(-3).map((e, i) => (
          <p key={i} style={{ fontSize: 11, color: e.side === "player" ? C.paper : C.accentBright, margin: "1px 0" }}>
            {e.side === "player" ? "▸ " : "◂ "}{e.text}
          </p>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {/* Row 1: Distance + Seme */}
        <div style={{ display: "flex", gap: 5 }}>
          <button onClick={() => doAction("advance")} disabled={dist === "tsuba"} style={{ ...btn, flex: 1, opacity: dist === "tsuba" ? .4 : 1 }}>
            <span style={{ fontSize: 14 }}>⇧</span><span style={{ fontSize: 10 }}>전진</span>
          </button>
          <button
            onPointerDown={startSemeHold} onPointerUp={stopSemeHold} onPointerLeave={stopSemeHold}
            onContextMenu={e => e.preventDefault()}
            disabled={dist === "far"}
            style={{ ...btn, flex: 2, background: semeHolding ? "rgba(195,163,95,.2)" : canStrike ? "rgba(195,163,95,.08)" : C.surfaceAlt, borderColor: semeHolding ? C.brass : canStrike ? C.brass : C.line, opacity: dist === "far" ? .4 : 1, boxShadow: semeHolding ? `0 0 16px rgba(195,163,95,.3)` : "none" }}>
            <span style={{ fontSize: 12, color: C.brass, fontWeight: 700 }}>{semeHolding ? "⚔ 세메 중..." : "세메 (꾹 누르기)"}</span>
            <span style={{ fontSize: 9, color: C.paperDim }}>{semeHolding ? "칼끝 교란 중" : "길게 눌러 빈틈 유도"}</span>
          </button>
          <button onClick={() => doAction("retreat")} disabled={dist === "far"} style={{ ...btn, flex: 1, opacity: dist === "far" ? .4 : 1 }}>
            <span style={{ fontSize: 14 }}>⇩</span><span style={{ fontSize: 10 }}>후퇴</span>
          </button>
        </div>

        {/* Row 2: Kiai (volatile 1.5s) */}
        <button onClick={activateKiai} disabled={kiai} style={{ ...btn, width: "100%", position: "relative", overflow: "hidden", background: kiai ? "rgba(195,163,95,.18)" : C.surfaceAlt, borderColor: kiai ? C.brass : C.line }}>
          {kiai && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${(kiaiTimer / 1.5) * 100}%`, background: "rgba(195,163,95,.15)", transition: "width 50ms linear" }} />}
          <span style={{ fontSize: 13, fontWeight: 700, color: kiai ? C.brass : C.paperDim, position: "relative", zIndex: 1 }}>
            {kiai ? `기합! (${kiaiTimer.toFixed(1)}s) → 지금 타격!` : "기합 (탭 → 1.5초 내 타격!)"}
          </span>
        </button>

        {/* Row 3: Strike zones */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
          {ZONES.map(z => {
            const isOpening = opening === z.key;
            const disabled = !canStrike;
            return (
              <button key={z.key} onClick={() => doAction("strike", z.key)} disabled={disabled}
                style={{ ...btn, opacity: disabled ? .35 : 1, background: isOpening ? "rgba(195,163,95,.12)" : C.surfaceAlt, borderColor: isOpening ? C.brass : C.line, boxShadow: isOpening ? `0 0 12px rgba(195,163,95,.2)` : "none", padding: "14px 0" }}>
                {isOpening && <span style={{ position: "absolute", top: 3, right: 6, fontSize: 9, color: C.brass, fontWeight: 700, animation: "pulse .5s ease-in-out infinite" }}>빈틈!</span>}
                <span style={{ fontFamily: "serif", fontSize: 22, fontWeight: 800, color: C.brass }}>{z.kanji}</span>
                <span style={{ fontSize: 10, color: C.paperDim }}>{z.label}</span>
              </button>
            );
          })}
        </div>

        {/* Row 4: Kamae + push_out */}
        <div style={{ display: "flex", gap: 5 }}>
          {Object.entries(KAMAE_LABELS).map(([k, v]) => (
            <button key={k} onClick={() => doAction("wait", null, k)} style={{ ...btn, flex: 1, background: state.player_kamae === k ? "rgba(195,163,95,.1)" : C.surfaceAlt, borderColor: state.player_kamae === k ? C.brass : C.line }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: state.player_kamae === k ? C.brass : C.paperDim }}>{v}</span>
            </button>
          ))}
          {dist === "tsuba" && (
            <button onClick={() => doAction("push_out")} style={{ ...btn, flex: 1 }}>
              <span style={{ fontSize: 11, color: C.paper }}>밀어내기</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes hitPop { 0%{transform:scale(.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.15)} }
      `}</style>
    </div>
  );
}

const btn = {
  position: "relative",
  background: C.surfaceAlt,
  border: `1.5px solid ${C.line}`,
  borderRadius: 10,
  padding: "10px 0",
  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  cursor: "pointer", transition: "all .15s ease", color: C.paper,
};
