import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../hooks/api";

/* ── Design tokens ── */
const C = {
  bg: "#0B0E15", surface: "#1A2035", surfaceAlt: "#222B40",
  paper: "#ECE4D3", paperDim: "#9B9485", brass: "#C3A35F",
  accent: "#9B3A2C", accentBright: "#E14430", line: "rgba(236,228,211,0.10)",
  hitFlash: "#FFD700",
  zoneHead:  "#4FC3F7",
  zoneWrist: "#81C784",
  zoneWaist: "#FFB74D",
  zoneThrust:"#F06292",
};

const ZONE_META = {
  head:   { kanji: "面",  label: "머리",   color: C.zoneHead,   emoji: "⬆" },
  wrist:  { kanji: "小手",label: "손목",   color: C.zoneWrist,  emoji: "✋" },
  waist:  { kanji: "胴",  label: "허리",   color: C.zoneWaist,  emoji: "◀" },
  thrust: { kanji: "突",  label: "찌름",   color: C.zoneThrust, emoji: "▶" },
};
const KAMAE_LABELS = { chudan: "中段", jodan: "上段", gedan: "下段" };
const DIST_LABELS  = { far: "원거리", issoku: "일족일도", tsuba: "코등이" };
const TIME_LIMIT   = 60;

/* ── Audio ── */
let _audioCtx = null;
function getAudio() {
  if (!_audioCtx && typeof AudioContext !== "undefined") _audioCtx = new AudioContext();
  return _audioCtx;
}
function playSound(type) {
  const ctx = getAudio(); if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume();
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  const t = ctx.currentTime;
  if (type === "fumikomi") {
    o.type = "square"; o.frequency.value = 80;
    g.gain.setValueAtTime(0.4, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    o.start(); o.stop(t + 0.15);
  } else if (type === "hit") {
    o.type = "sawtooth"; o.frequency.value = 220;
    g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
    o.start(); o.stop(t + 0.12);
  } else if (type === "kiai") {
    o.type = "sawtooth"; o.frequency.value = 380;
    g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.28);
    o.start(); o.stop(t + 0.28);
  } else if (type === "shinai") {
    o.type = "triangle"; o.frequency.value = 1400;
    g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.04);
    o.start(); o.stop(t + 0.04);
  }
}

function drawChibi(ctx, cx, cy, {
  flip = false, pose = "ready", hitZone = null, activeZone = null,
  semeShake = 0, isHit = false, kamae = "chudan",
}) {
  ctx.save();
  ctx.translate(cx + semeShake, cy);
  if (flip) ctx.scale(-1, 1);

  const flash = (zone) => hitZone === zone ? C.hitFlash : activeZone === zone ? ZONE_META[zone].color : null;

  let bx = 0, by = 0, shinaiAngle = -0.15;
  if (pose === "attack") {
    bx = flip ? -18 : 18; by = -6;
    if (hitZone === "head")   shinaiAngle = -0.35;
    else if (hitZone === "wrist") shinaiAngle = 0.5;
    else if (hitZone === "waist") shinaiAngle = 0.85;
    else if (hitZone === "thrust") shinaiAngle = 0.0;
    else shinaiAngle = -0.3;
  }
  if (kamae === "jodan") shinaiAngle = -0.7;
  if (kamae === "gedan") shinaiAngle = 0.6;
  ctx.translate(bx, by);

  if (isHit) { ctx.globalAlpha = 0.75; }

  const W  = 60;
  const CX = 0;

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath(); ctx.ellipse(CX, 120, 28, 7, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#0d1b3a";
  ctx.beginPath();
  ctx.moveTo(CX - W/2 + 4, 40);
  ctx.lineTo(CX - W/2 - 4, 115);
  ctx.quadraticCurveTo(CX, 122, CX + W/2 + 4, 115);
  ctx.lineTo(CX + W/2 - 4, 40);
  ctx.closePath(); ctx.fill();

  ctx.strokeStyle = "rgba(8,20,55,0.5)"; ctx.lineWidth = 1;
  for (const px of [-18, -9, 0, 9, 18]) {
    ctx.beginPath();
    ctx.moveTo(CX + px, 42); ctx.lineTo(CX + px + (px < 0 ? -1 : 1), 112);
    ctx.stroke();
  }

  const tareFill = flash("waist") || "#1e1840";
  for (let i = 0; i < 5; i++) {
    const tx2 = CX - 24 + i * 10;
    const tw = i === 2 ? 12 : 9;
    ctx.fillStyle = tareFill;
    ctx.beginPath(); ctx.roundRect(tx2, 38, tw, 18, 2); ctx.fill();
    ctx.strokeStyle = flash("waist") ? "rgba(255,215,0,0.6)" : "rgba(50,40,90,0.4)";
    ctx.lineWidth = 0.8; ctx.stroke();
  }
  if (flash("waist")) {
    ctx.shadowColor = flash("waist"); ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.roundRect(CX - 26, 36, 54, 22, 3);
    ctx.strokeStyle = flash("waist"); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.shadowBlur = 0;
  }

  const doFill = flash("waist") || "#1a1535";
  ctx.fillStyle = doFill;
  ctx.strokeStyle = flash("waist") ? "rgba(255,215,0,0.5)" : "rgba(58,42,90,0.7)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(CX - W/2 + 2, -22);
  ctx.quadraticCurveTo(CX - W/2, -2, CX - W/2 + 2, 42);
  ctx.lineTo(CX + W/2 - 2, 42);
  ctx.quadraticCurveTo(CX + W/2, -2, CX + W/2 - 2, -22);
  ctx.quadraticCurveTo(CX, -28, CX - W/2 + 2, -22);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = "rgba(100,25,0,0.85)";
  ctx.beginPath();
  ctx.moveTo(CX - 22, -10);
  ctx.quadraticCurveTo(CX - 23, 8, CX - 20, 36);
  ctx.lineTo(CX + 20, 36);
  ctx.quadraticCurveTo(CX + 23, 8, CX + 22, -10);
  ctx.quadraticCurveTo(CX, -15, CX - 22, -10);
  ctx.fill();

  ctx.fillStyle = "#0d1b3a";
  ctx.beginPath();
  ctx.moveTo(CX - W/2 + 2, -20);
  ctx.lineTo(CX - W/2 - 12, 5);
  ctx.lineTo(CX - W/2 - 6, 18);
  ctx.lineTo(CX - W/2 + 8, 0);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(CX + W/2 - 2, -20);
  ctx.lineTo(CX + W/2 + 12, 5);
  ctx.lineTo(CX + W/2 + 6, 18);
  ctx.lineTo(CX + W/2 - 8, 0);
  ctx.closePath(); ctx.fill();

  const koteFill = flash("wrist") || "#1a1535";
  ctx.fillStyle = koteFill;
  ctx.beginPath(); ctx.ellipse(CX - W/2 - 8, 12, 9, 7, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(CX + W/2 + 8, 12, 9, 7, 0.4, 0, Math.PI * 2); ctx.fill();
  if (flash("wrist")) {
    ctx.shadowColor = flash("wrist"); ctx.shadowBlur = 12;
    ctx.strokeStyle = flash("wrist"); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(CX - W/2 - 8, 12, 11, 9, -0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(CX + W/2 + 8, 12, 11, 9, 0.4, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = "#d4a574";
  ctx.beginPath(); ctx.roundRect(CX - 7, -36, 14, 16, 3); ctx.fill();

  const menFill = flash("head") || "#0d1535";
  ctx.fillStyle = menFill;
  ctx.beginPath();
  ctx.arc(CX, -62, 30, 0, Math.PI * 2); ctx.fill();
  if (flash("head")) {
    ctx.shadowColor = flash("head"); ctx.shadowBlur = 14;
    ctx.strokeStyle = flash("head"); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(CX, -62, 32, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.strokeStyle = "#3a3a6a"; ctx.lineWidth = 1.5;
  for (let gy = -72; gy < -42; gy += 5) {
    ctx.beginPath(); ctx.moveTo(CX - 20, gy); ctx.lineTo(CX + 20, gy); ctx.stroke();
  }
  ctx.fillStyle = menFill;
  ctx.beginPath(); ctx.roundRect(CX - 18, -40, 36, 10, 3); ctx.fill();
  ctx.strokeStyle = "rgba(150,140,200,0.3)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(CX - 8, -78, 12, Math.PI * 1.1, Math.PI * 1.8); ctx.stroke();

  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(CX - 9, -64, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(CX + 9, -64, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a1a3a";
  ctx.beginPath(); ctx.ellipse(CX - 9, -63, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(CX + 9, -63, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.ellipse(CX - 8, -65, 1.2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(CX + 10, -65, 1.2, 1.5, 0, 0, Math.PI * 2); ctx.fill();

  const thrustGlow = flash("thrust");
  const shinaiLen = 100;
  const pivotX = CX + 14, pivotY = 5;
  const ex = pivotX + Math.sin(shinaiAngle) * shinaiLen;
  const ey = pivotY - Math.cos(shinaiAngle) * shinaiLen;

  if (thrustGlow) { ctx.shadowColor = thrustGlow; ctx.shadowBlur = 14; }
  const grad = ctx.createLinearGradient(pivotX, pivotY, ex, ey);
  grad.addColorStop(0, "#8b6914"); grad.addColorStop(1, "#e8d5a0");
  ctx.strokeStyle = grad; ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.lineCap = "butt";
  ctx.fillStyle = "#6b4e1b";
  const tsubaX = pivotX + Math.sin(shinaiAngle) * 8;
  const tsubaY = pivotY - Math.cos(shinaiAngle) * 8;
  ctx.beginPath(); ctx.ellipse(tsubaX, tsubaY, 6, 5, shinaiAngle, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = thrustGlow || "#f5f0e0";
  const sakiX = pivotX + Math.sin(shinaiAngle) * (shinaiLen - 3);
  const sakiY = pivotY - Math.cos(shinaiAngle) * (shinaiLen - 3);
  ctx.beginPath(); ctx.ellipse(sakiX, sakiY, 3.5, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawReferee(ctx, x, y, scale, flagUp) {
  ctx.save(); ctx.translate(x, y);
  const s = scale;
  ctx.fillStyle = "#d4a574";
  ctx.beginPath(); ctx.arc(0, -14 * s, 5 * s, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(-6 * s, -9 * s, 12 * s, 18 * s);
  ctx.fillStyle = "#8b1a1a";
  ctx.fillRect(-1, -9 * s, 2, 10 * s);
  ctx.fillStyle = "#2a2a2a";
  ctx.fillRect(-6 * s, 9 * s, 12 * s, 12 * s);
  const up = !!flagUp;
  ctx.strokeStyle = "#7a5a10"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(-8, up ? -28 : -12); ctx.stroke();
  ctx.fillStyle = up ? "#E53935" : "rgba(68,34,34,0.25)";
  ctx.fillRect(-15, up ? -36 : -18, 9, 7);
  ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(8, up ? -28 : -12); ctx.stroke();
  ctx.fillStyle = up ? "#eeeeee" : "rgba(68,68,68,0.25)";
  ctx.fillRect(7, up ? -36 : -18, 9, 7);
  ctx.restore();
}

function renderScene(canvas, state) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const floorGrad = ctx.createLinearGradient(0, H * 0.55, 0, H);
  floorGrad.addColorStop(0, "#C8A870");
  floorGrad.addColorStop(1, "#A07840");
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  const bgGrad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
  bgGrad.addColorStop(0, "#0B0E1A");
  bgGrad.addColorStop(1, "#141826");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H * 0.57);

  ctx.strokeStyle = "rgba(100,70,30,0.15)"; ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath(); ctx.moveTo(i * 28, H * 0.55); ctx.lineTo(i * 28, H); ctx.stroke();
  }

  ctx.strokeStyle = "#2E7D32"; ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, W - 40, H - 40);
  ctx.strokeStyle = "rgba(46,125,50,0.3)"; ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(W / 2, 20); ctx.lineTo(W / 2, H - 20); ctx.stroke();

  ctx.strokeStyle = "#2E7D32"; ctx.lineWidth = 2.5;
  const markOffsets = [W / 2 - 70, W / 2 + 70];
  for (const mx of markOffsets) {
    ctx.beginPath(); ctx.moveTo(mx - 12, H * 0.7); ctx.lineTo(mx + 12, H * 0.7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mx, H * 0.7 - 10); ctx.lineTo(mx, H * 0.7 + 10); ctx.stroke();
  }

  const {
    distance, playerPose, opponentPose, playerHit, opponentHit,
    hitZone, opponentZone, flags, semeShake, playerKamae, opponentKamae,
    opening, activeZone,
  } = state;

  const refData = [
    { x: 42, y: H - 42, scale: 0.85 },
    { x: W - 42, y: H - 42, scale: 0.85 },
    { x: W / 2, y: H - 30, scale: 1.0 },
  ];
  refData.forEach((r, i) => {
    drawReferee(ctx, r.x, r.y, r.scale, flags && flags[i]);
  });

  const gap = distance === "far" ? 200 : distance === "issoku" ? 100 : 60;
  const playerX = W / 2 - gap / 2;
  const opponentX = W / 2 + gap / 2;
  const fighterY = H * 0.62;

  drawChibi(ctx, opponentX, fighterY, {
    flip: true, pose: opponentPose,
    hitZone: opponentHit ? opponentZone : null,
    activeZone: null,
    semeShake: -semeShake * 0.6,
    isHit: opponentHit, kamae: opponentKamae,
  });

  drawChibi(ctx, playerX, fighterY, {
    flip: false, pose: playerPose,
    hitZone: playerHit ? hitZone : null,
    activeZone: activeZone,
    semeShake, isHit: playerHit, kamae: playerKamae,
  });

  if (opening) {
    const zc = ZONE_META[opening];
    const ox = opponentX - 20;
    const oy = fighterY + (opening === "head" ? -95 : opening === "wrist" ? -5 : opening === "waist" ? 20 : -50);
    ctx.save();
    ctx.font = "bold 11px sans-serif";
    ctx.fillStyle = zc.color;
    ctx.shadowColor = zc.color; ctx.shadowBlur = 10;
    ctx.fillText("빈틈!", ox - 18, oy);
    ctx.fillText(zc.kanji, ox, oy + 14);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
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

  const [phase, setPhase] = useState("ready");
  const [gameState, setGameState] = useState({
    distance: "far", player_kamae: "chudan", opponent_kamae: "chudan",
    score: { player: 0, opponent: 0 }, hansoku: { player: 0, opponent: 0 },
    seme_pressure: 0.5, opening_zone: null, finished: false, result: null,
  });
  const [lastResult, setLastResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [playerPose, setPlayerPose] = useState("ready");
  const [opponentPose, setOpponentPose] = useState("ready");
  const [playerHit, setPlayerHit] = useState(false);
  const [opponentHit, setOpponentHit] = useState(false);
  const [hitZone, setHitZone] = useState(null);
  const [activeZone, setActiveZone] = useState(null);
  const [flags, setFlags] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [countdown, setCountdown] = useState(0);
  const [kiai, setKiai] = useState(false);
  const [kiaiTimer, setKiaiTimer] = useState(0);
  const [semeHolding, setSemeHolding] = useState(false);
  const [semeShake, setSemeShake] = useState(0);
  const [shake, setShake] = useState(false);

  const timerRef = useRef(null);
  const logRef = useRef(null);
  const semeIntervalRef = useRef(null);
  const semeTickRef = useRef(0);
  const kiaiTimeoutRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 750;
    canvas.height = 320;
  }, []);

  const sceneState = {
    distance: gameState.distance,
    playerPose, opponentPose, playerHit, opponentHit,
    hitZone, opponentZone: lastResult?.opponent_zone,
    flags, semeShake, opening: gameState.opening_zone,
    playerKamae: gameState.player_kamae,
    opponentKamae: gameState.opponent_kamae,
    activeZone,
  };
  useScene(canvasRef, sceneState);

  const startBattle = useCallback(async () => {
    setPhase("countdown"); setCountdown(3);
    const info = await api.battleStart({ student_id: Number(studentId), opponent_type: "ai" });
    setGameState(s => ({ ...s, ...info, score: info.score || { player: 0, opponent: 0 } }));
    setTimeLeft(TIME_LIMIT); setLastResult(null); setEventLog([]);
    setPlayerPose("ready"); setOpponentPose("ready");
    setFlags(null); setKiai(false); setKiaiTimer(0); setHitZone(null);
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
          api.battleTimeout(Number(studentId)).then(res => {
            setGameState(s => ({ ...s, ...res }));
            setPhase("result");
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, studentId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [eventLog]);

  function startSemeHold() {
    if (phase !== "fight" || gameState.distance === "far") return;
    setSemeHolding(true); semeTickRef.current = 0; playSound("shinai");
    semeIntervalRef.current = setInterval(() => {
      setSemeShake(Math.random() * 6 - 3);
      semeTickRef.current += 1;
      if (semeTickRef.current % 3 === 0) playSound("shinai");
      if (semeTickRef.current % 5 === 0) {
        api.battleAction(Number(studentId), { action: "seme", kiai: false }).then(res => {
          setGameState(s => ({ ...s, ...res }));
          if (res.player_event) setEventLog(p => [...p.slice(-30), { side: "player", text: res.player_event }]);
          if (res.opponent_event) setEventLog(p => [...p.slice(-30), { side: "opponent", text: res.opponent_event }]);
        }).catch(() => {});
      }
    }, 60);
  }
  function stopSemeHold() {
    setSemeHolding(false); setSemeShake(0);
    clearInterval(semeIntervalRef.current);
  }
  useEffect(() => () => clearInterval(semeIntervalRef.current), []);

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

  async function doAction(action, zone = null, kamae = null) {
    if (phase !== "fight") return;
    const res = await api.battleAction(Number(studentId), {
      action, zone, kiai, kamae_change: kamae,
    });
    setGameState(s => ({ ...s, ...res }));
    setLastResult(res);

    if (res.player_event) setEventLog(p => [...p.slice(-30), { side: "player", text: res.player_event }]);
    if (res.opponent_event) setEventLog(p => [...p.slice(-30), { side: "opponent", text: res.opponent_event }]);

    if (action === "strike" && zone) {
      playSound("fumikomi");
      setHitZone(zone);
      setPlayerPose("attack");
      setTimeout(() => { setPlayerPose("ready"); setHitZone(null); }, 480);

      if (res.player_ippon?.ippon) {
        playSound("hit");
        setOpponentHit(true); setShake(true);
        setFlags(res.flags_player);
        setTimeout(() => { setOpponentHit(false); setShake(false); }, 420);
        setTimeout(() => setFlags(null), 2800);
      }
    }

    if (res.opponent_zone && res.opponent_ippon) {
      setTimeout(() => {
        setOpponentPose("attack");
        if (res.opponent_ippon?.ippon) {
          playSound("hit");
          setPlayerHit(true); setShake(true);
          setFlags(res.flags_opponent);
          setTimeout(() => { setPlayerHit(false); setShake(false); }, 420);
          setTimeout(() => setFlags(null), 2800);
        }
        setTimeout(() => setOpponentPose("ready"), 480);
      }, 300);
    }

    if (res.finished) {
      clearInterval(timerRef.current);
      setTimeout(() => setPhase("result"), 1600);
      await api.battleFinish(Number(studentId)).catch(() => {});
    }
    if (kiai) { setKiai(false); setKiaiTimer(0); clearTimeout(kiaiTimeoutRef.current); }
  }

  const dist = gameState.distance;
  const opening = gameState.opening_zone;
  const canStrike = dist === "issoku" || dist === "tsuba";

  const wrapStyle = {
    display: "flex", flexDirection: "column", gap: 8,
    transform: shake ? `translate(${Math.random() > 0.5 ? 5 : -5}px,2px)` : "none",
    transition: "transform .05s",
  };

  const canvasBlock = (
    <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", background: C.bg }}>
      <canvas ref={canvasRef} style={{ width: "100%", display: "block", borderRadius: 14 }} />
      {opening && (
        <div style={{
          position: "absolute", top: "8%", right: "8%",
          background: "rgba(0,0,0,0.7)",
          border: `1.5px solid ${ZONE_META[opening].color}`,
          borderRadius: 8, padding: "4px 10px",
          color: ZONE_META[opening].color, fontSize: 13, fontWeight: 800,
          animation: "pulse .4s ease-in-out infinite",
          textShadow: `0 0 8px ${ZONE_META[opening].color}`,
        }}>
          {ZONE_META[opening].kanji} 빈틈!
        </div>
      )}
      {phase === "countdown" && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", background: "rgba(0,0,0,.5)", borderRadius: 14,
        }}>
          <p key={countdown} style={{
            fontFamily: "serif", fontSize: 64, fontWeight: 900,
            color: countdown === 0 ? C.brass : "#fff",
            textShadow: `0 0 40px ${countdown === 0 ? C.brass : "rgba(255,255,255,.5)"}`,
            animation: "hitPop .6s ease-out",
          }}>
            {countdown > 0 ? ["礼!", "構え!", "始め!"][3 - countdown] : "始め!"}
          </p>
        </div>
      )}
    </div>
  );

  const hud = (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 2px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, color: C.paperDim, fontWeight: 600 }}>나</span>
        {[0, 1].map(i => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: "50%",
            background: i < gameState.score.player ? C.accent : "transparent",
            border: `2px solid ${i < gameState.score.player ? C.accent : C.line}`,
            boxShadow: i < gameState.score.player ? `0 0 8px ${C.accent}` : "none",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <div style={{
          width: 46, height: 46, borderRadius: "50%", display: "flex",
          alignItems: "center", justifyContent: "center",
          border: `2.5px solid ${timeLeft <= 10 ? C.accentBright : C.brass}`,
          color: timeLeft <= 10 ? C.accentBright : C.brass,
          fontFamily: "monospace", fontSize: 18, fontWeight: 800,
        }}>{timeLeft}</div>
        <span style={{ fontSize: 9, color: C.paperDim }}>{DIST_LABELS[dist]}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[0, 1].map(i => (
          <div key={i} style={{
            width: 18, height: 18, borderRadius: "50%",
            background: i < gameState.score.opponent ? C.accentBright : "transparent",
            border: `2px solid ${i < gameState.score.opponent ? C.accentBright : C.line}`,
            boxShadow: i < gameState.score.opponent ? `0 0 8px ${C.accentBright}` : "none",
          }} />
        ))}
        <span style={{ fontSize: 11, color: C.paperDim, fontWeight: 600 }}>상대</span>
      </div>
    </div>
  );

  const semebar = (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 9, color: C.accentBright, width: 30 }}>상대</span>
      <div style={{ flex: 1, height: 7, borderRadius: 4, background: C.surfaceAlt, position: "relative", overflow: "hidden" }}>
        <div style={{
          position: "absolute", inset: "0 auto 0 0",
          width: `${gameState.seme_pressure * 100}%`,
          background: gameState.seme_pressure > 0.65 ? C.brass : gameState.seme_pressure < 0.35 ? C.accentBright : C.paperDim,
          borderRadius: 4, transition: "width .25s, background .25s",
        }} />
        <div style={{ position: "absolute", top: -2, bottom: -2, left: "50%", width: 1.5, background: "rgba(255,255,255,.25)" }} />
      </div>
      <span style={{ fontSize: 9, color: C.brass, width: 30, textAlign: "right" }}>나</span>
    </div>
  );

  const kiaibtn = (
    <button
      onClick={activateKiai}
      disabled={kiai || phase !== "fight"}
      style={{
        width: "100%", position: "relative", overflow: "hidden",
        background: kiai ? "rgba(195,163,95,.2)" : C.surfaceAlt,
        border: `1.5px solid ${kiai ? C.brass : C.line}`,
        borderRadius: 10, padding: "9px 0", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
      }}
    >
      {kiai && (
        <div style={{
          position: "absolute", inset: "0 auto 0 0",
          width: `${(kiaiTimer / 1.5) * 100}%`,
          background: "rgba(195,163,95,.2)", transition: "width 50ms linear",
        }} />
      )}
      <span style={{ fontSize: 16 }}>{kiai ? "🔥" : "💨"}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: kiai ? C.brass : C.paperDim, position: "relative" }}>
        {kiai ? `기합! ${kiaiTimer.toFixed(1)}초 내 타격!` : "기합 (탭)"}
      </span>
    </button>
  );

  const zoneBtns = (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6 }}>
      {Object.entries(ZONE_META).map(([zk, zm]) => {
        const isOpening = opening === zk;
        const disabled = !canStrike || phase !== "fight";
        return (
          <button
            key={zk}
            onClick={() => doAction("strike", zk)}
            onPointerEnter={() => !disabled && setActiveZone(zk)}
            onPointerLeave={() => setActiveZone(null)}
            disabled={disabled}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: 3, padding: "12px 4px",
              background: isOpening ? `rgba(${hexToRgb(zm.color)},0.15)` : C.surfaceAlt,
              border: `2px solid ${isOpening ? zm.color : C.line}`,
              borderRadius: 12, cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.35 : 1, position: "relative",
              boxShadow: isOpening ? `0 0 14px ${zm.color}44` : "none",
              transition: "all .15s",
            }}
          >
            {isOpening && (
              <span style={{
                position: "absolute", top: 3, right: 5,
                fontSize: 8, color: zm.color, fontWeight: 800,
                animation: "pulse .4s ease-in-out infinite",
              }}>빈틈!</span>
            )}
            <span style={{ fontFamily: "serif", fontSize: 24, fontWeight: 900, color: zm.color, lineHeight: 1 }}>{zm.kanji}</span>
            <span style={{ fontSize: 10, color: C.paperDim }}>{zm.label}</span>
          </button>
        );
      })}
    </div>
  );

  const moveBtns = (
    <div style={{ display: "flex", gap: 6 }}>
      <button onClick={() => doAction("advance")} disabled={dist === "tsuba" || phase !== "fight"}
        style={{ ...btnBase, flex: 1, opacity: dist === "tsuba" ? .4 : 1 }}>
        <span style={{ fontSize: 16 }}>→</span>
        <span style={{ fontSize: 10, color: C.paperDim }}>전진</span>
      </button>
      <button
        onPointerDown={startSemeHold} onPointerUp={stopSemeHold} onPointerLeave={stopSemeHold}
        onContextMenu={e => e.preventDefault()}
        disabled={dist === "far" || phase !== "fight"}
        style={{
          ...btnBase, flex: 2,
          background: semeHolding ? "rgba(195,163,95,.18)" : canStrike ? "rgba(195,163,95,.07)" : C.surfaceAlt,
          borderColor: semeHolding ? C.brass : canStrike ? `${C.brass}88` : C.line,
          opacity: dist === "far" ? .4 : 1,
          boxShadow: semeHolding ? `0 0 18px rgba(195,163,95,.3)` : "none",
        }}
      >
        <span style={{ fontSize: 12, color: C.brass, fontWeight: 700 }}>
          {semeHolding ? "⚔ 세메 중..." : "세메 (꾹)"}
        </span>
        <span style={{ fontSize: 9, color: C.paperDim }}>{semeHolding ? "칼끝 교란" : "빈틈 유도"}</span>
      </button>
      <button onClick={() => doAction("retreat")} disabled={dist === "far" || phase !== "fight"}
        style={{ ...btnBase, flex: 1, opacity: dist === "far" ? .4 : 1 }}>
        <span style={{ fontSize: 16 }}>←</span>
        <span style={{ fontSize: 10, color: C.paperDim }}>후퇴</span>
      </button>
      {dist === "tsuba" && (
        <button onClick={() => doAction("push_out")} style={{ ...btnBase, flex: 1 }}>
          <span style={{ fontSize: 10, color: C.paper }}>밀어내기</span>
        </button>
      )}
    </div>
  );

  const kamaeBtns = (
    <div style={{ display: "flex", gap: 6 }}>
      {Object.entries(KAMAE_LABELS).map(([k, v]) => (
        <button key={k} onClick={() => doAction("wait", null, k)} disabled={phase !== "fight"}
          style={{
            ...btnBase, flex: 1, padding: "7px 0",
            background: gameState.player_kamae === k ? "rgba(195,163,95,.12)" : C.surfaceAlt,
            borderColor: gameState.player_kamae === k ? C.brass : C.line,
          }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: gameState.player_kamae === k ? C.brass : C.paperDim }}>{v}</span>
          <span style={{ fontSize: 9, color: C.paperDim }}>{k === "chudan" ? "기본" : k === "jodan" ? "상단" : "하단"}</span>
        </button>
      ))}
    </div>
  );

  const logBox = (
    <div ref={logRef} style={{
      height: 48, overflow: "auto", padding: "2px 4px",
      borderTop: `1px solid ${C.line}`, borderBottom: `1px solid ${C.line}`,
    }}>
      {eventLog.slice(-4).map((e, i) => (
        <p key={i} style={{ fontSize: 11, color: e.side === "player" ? C.paper : C.accentBright, margin: "1px 0" }}>
          {e.side === "player" ? "▸ " : "◂ "}{e.text}
        </p>
      ))}
    </div>
  );

  if (phase === "ready") {
    return (
      <div style={wrapStyle}>
        {canvasBlock}
        <div style={{ padding: 14, borderRadius: 12, background: C.surface, border: `1px solid ${C.line}` }}>
          <p style={{ fontFamily: "serif", fontSize: 22, fontWeight: 900, color: C.brass, textAlign: "center", marginBottom: 8 }}>対決 — 기검체일치</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            {Object.entries(ZONE_META).map(([zk, zm]) => (
              <div key={zk} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, background: C.surfaceAlt, border: `1px solid ${zm.color}33` }}>
                <span style={{ fontFamily: "serif", fontSize: 22, color: zm.color, fontWeight: 900 }}>{zm.kanji}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: zm.color }}>{zm.label}</p>
                  <p style={{ fontSize: 10, color: C.paperDim }}>
                    {zk === "head" ? "면격 — 정수리 타격" : zk === "wrist" ? "소수 — 손목 타격" : zk === "waist" ? "도격 — 허리 타격" : "돌격 — 정면 찌름"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: C.paperDim, display: "flex", flexDirection: "column", gap: 4 }}>
            <span>• 삼본승부 — 2본 선취 승리 (3심제)</span>
            <span>• 세메로 상대 빈틈을 만들고 → 기합 → 타격</span>
            <span>• 기합 후 1.5초 내 타격해야 유효!</span>
          </div>
        </div>
        <button onClick={startBattle} style={{
          width: "100%", padding: "16px 0", borderRadius: 12, fontSize: 16, fontWeight: 800,
          background: `linear-gradient(135deg,${C.accent} 0%,#7A2E22 100%)`,
          color: C.paper, border: "none", cursor: "pointer",
          boxShadow: `0 4px 24px rgba(155,58,44,.4)`,
        }}>
          시합 시작
        </button>
        <style>{GLOBAL_CSS}</style>
      </div>
    );
  }

  if (phase === "result") {
    const won = gameState.result === "win";
    const lost = gameState.result === "lose";
    return (
      <div style={wrapStyle}>
        {canvasBlock}
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontFamily: "serif", fontSize: 56, fontWeight: 900, color: won ? C.brass : lost ? C.accentBright : C.paperDim }}>
            {won ? "勝利" : lost ? "敗北" : "引分"}
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginTop: 6 }}>
            <div>
              <p style={{ fontSize: 11, color: C.paperDim }}>나</p>
              <p style={{ fontFamily: "serif", fontSize: 32, fontWeight: 700, color: C.paper }}>{gameState.score.player}</p>
            </div>
            <span style={{ fontSize: 20, color: C.paperDim }}>—</span>
            <div>
              <p style={{ fontSize: 11, color: C.paperDim }}>상대</p>
              <p style={{ fontFamily: "serif", fontSize: 32, fontWeight: 700, color: C.paper }}>{gameState.score.opponent}</p>
            </div>
          </div>
        </div>
        {logBox}
        <button onClick={() => setPhase("ready")} style={{
          width: "100%", padding: "14px 0", borderRadius: 12, fontSize: 15, fontWeight: 800,
          background: C.accent, color: C.paper, border: "none", cursor: "pointer",
        }}>다시 시합</button>
        <style>{GLOBAL_CSS}</style>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      {hud}
      {semebar}
      {canvasBlock}
      {logBox}
      {zoneBtns}
      {kiaibtn}
      {moveBtns}
      {kamaeBtns}
      <style>{GLOBAL_CSS}</style>
    </div>
  );
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

const btnBase = {
  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  background: C.surfaceAlt, border: `1.5px solid ${C.line}`,
  borderRadius: 10, padding: "10px 0", cursor: "pointer",
  transition: "all .15s", color: C.paper,
};

const GLOBAL_CSS = `
  @keyframes hitPop { 0%{transform:scale(.4);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.35} }
`;
