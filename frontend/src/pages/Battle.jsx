import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import * as PIXI from "pixi.js";
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
   PixiJS Kendo Fighter Sprite (Programmatic)
   ══════════════════════════════════════════════ */
function drawFighterFrame(g, { pose = "ready", attackZone = null, hit = false, flip = false, semeShake = 0 }) {
  g.clear();
  const s = flip ? -1 : 1;
  const ox = flip ? 120 : 0;

  const tx = (x) => flip ? (120 - x) : x;
  const line = (x1, y1, x2, y2, color, w) => {
    g.lineStyle(w, color, 1); g.moveTo(tx(x1), y1); g.lineTo(tx(x2), y2);
  };
  const rect = (x, y, w, h, color, r = 0) => {
    g.lineStyle(0); g.beginFill(color);
    if (r) g.drawRoundedRect(tx(x) - (flip ? w : 0), y, w, h, r);
    else g.drawRect(tx(x) - (flip ? w : 0), y, w, h);
    g.endFill();
  };
  const ellipse = (x, y, rx, ry, color) => {
    g.lineStyle(0); g.beginFill(color); g.drawEllipse(tx(x), y, rx, ry); g.endFill();
  };

  // Body shift for attack/hit poses
  let bx = 0, by = 0;
  if (pose === "attack") { bx = s * 15; by = -5; }
  if (pose === "hit") { bx = s * -10; by = 3; }

  g.position.x = bx + semeShake;
  g.position.y = by;

  // Hit flash
  if (hit) { g.tint = 0xFFFF88; } else { g.tint = 0xFFFFFF; }

  // ── Feet shadows ──
  ellipse(42, 275, 12, 4, 0x0a0a1a);
  ellipse(62, 278, 12, 4, 0x0a0a1a);

  // ── Hakama (wide pleated skirt) ──
  g.lineStyle(0);
  g.beginFill(0x0d1b3a);
  g.moveTo(tx(25), 148); g.lineTo(tx(18), 272); g.quadraticCurveTo(tx(42), 282, tx(52), 278);
  g.quadraticCurveTo(tx(62), 282, tx(85), 272); g.lineTo(tx(78), 148); g.closePath();
  g.endFill();
  // Pleat lines
  g.lineStyle(1, 0x081428, 0.3);
  for (let px of [33, 42, 52, 62, 71]) {
    g.moveTo(tx(px), 150); g.lineTo(tx(px + (px < 52 ? -2 : 2)), 275);
  }

  // ── Tare (waist protector) ──
  for (let i = 0; i < 5; i++) {
    const tw = i === 2 ? 13 : 10;
    rect(26 + i * 10, 145, tw, 22, 0x1a1535, 2);
    g.lineStyle(0.5, 0x2a2050, 0.5);
    g.drawRoundedRect(tx(26 + i * 10) - (flip ? tw : 0), 145, tw, 22, 2);
  }

  // ── Keikogi (jacket) ──
  g.beginFill(0x0d1b3a); g.lineStyle(0);
  g.moveTo(tx(30), 80); g.lineTo(tx(26), 148); g.lineTo(tx(78), 148); g.lineTo(tx(74), 80);
  g.closePath(); g.endFill();
  // Left sleeve
  g.beginFill(0x0d1b3a);
  g.moveTo(tx(30), 84); g.lineTo(tx(12), 102); g.lineTo(tx(16), 115); g.lineTo(tx(32), 105);
  g.closePath(); g.endFill();
  // Right sleeve
  g.beginFill(0x0d1b3a);
  g.moveTo(tx(74), 84); g.lineTo(tx(92), 102); g.lineTo(tx(88), 115); g.lineTo(tx(72), 105);
  g.closePath(); g.endFill();

  // ── Do (chest armor) ──
  g.lineStyle(1, 0x3a2a5a, 0.8);
  g.beginFill(0x1a1535);
  g.moveTo(tx(30), 82); g.quadraticCurveTo(tx(28), 95, tx(30), 140);
  g.lineTo(tx(74), 140); g.quadraticCurveTo(tx(76), 95, tx(74), 82);
  g.quadraticCurveTo(tx(52), 75, tx(30), 82);
  g.endFill();
  // Lacquer panel
  g.lineStyle(0);
  g.beginFill(0x7a2200, 0.8);
  g.moveTo(tx(34), 88); g.quadraticCurveTo(tx(33), 96, tx(34), 136);
  g.lineTo(tx(70), 136); g.quadraticCurveTo(tx(71), 96, tx(70), 88);
  g.quadraticCurveTo(tx(52), 82, tx(34), 88);
  g.endFill();

  // ── Do himo (ties) ──
  g.lineStyle(1.5, 0x3a2a5a, 0.8);
  g.moveTo(tx(34), 86); g.lineTo(tx(22), 74);
  g.moveTo(tx(70), 86); g.lineTo(tx(82), 74);
  g.lineStyle(0); ellipse(22, 74, 2.5, 2.5, 0x3a2a5a); ellipse(82, 74, 2.5, 2.5, 0x3a2a5a);

  // ── Kote (gloves) ──
  ellipse(14, 108, 8, 11, 0x1a1535);
  ellipse(14, 113, 5, 4, 0x2a2040);
  ellipse(90, 106, 8, 11, 0x1a1535);
  ellipse(90, 111, 5, 4, 0x2a2040);

  // ── Men (helmet) ──
  g.lineStyle(1, 0x3a2a5a, 0.8);
  g.beginFill(0x1a1030);
  g.moveTo(tx(32), 36); g.quadraticCurveTo(tx(30), 48, tx(32), 72);
  g.quadraticCurveTo(tx(42), 78, tx(52), 78);
  g.quadraticCurveTo(tx(62), 78, tx(72), 72);
  g.quadraticCurveTo(tx(74), 48, tx(72), 36);
  g.quadraticCurveTo(tx(62), 28, tx(52), 28);
  g.quadraticCurveTo(tx(42), 28, tx(32), 36);
  g.endFill();
  // Men top
  g.lineStyle(0.5, 0x3a2a5a, 0.5);
  ellipse(52, 32, 20, 7, 0x2a2040);
  // Mengane (face grille)
  g.lineStyle(1.2, 0x4a3a6a, 0.9);
  for (let i = 0; i < 9; i++) {
    g.moveTo(tx(36), 40 + i * 3.5); g.lineTo(tx(68), 40 + i * 3.5);
  }
  // Tsuki-dare
  g.lineStyle(0); g.beginFill(0x1a1535);
  g.moveTo(tx(40), 72); g.lineTo(tx(38), 80);
  g.quadraticCurveTo(tx(52), 84, tx(66), 80); g.lineTo(tx(64), 72);
  g.closePath(); g.endFill();
  // Men-himo (ties)
  g.lineStyle(2, 0x2a2050, 0.7);
  g.moveTo(tx(32), 44); g.quadraticCurveTo(tx(20), 52, tx(14), 68);
  g.moveTo(tx(72), 44); g.quadraticCurveTo(tx(84), 52, tx(90), 68);

  // ── Shinai (bamboo sword) ──
  let shinaiAngle;
  if (pose === "attack") {
    shinaiAngle = attackZone === "head" ? -80 : attackZone === "wrist" ? -30 : attackZone === "waist" ? 35 : -5;
  } else if (pose === "hit") {
    shinaiAngle = -25;
  } else {
    shinaiAngle = -12;
  }

  const pivotX = tx(88);
  const pivotY = 108;
  const rad = (shinaiAngle * Math.PI) / 180 * s;
  const shinaiLen = 85;

  const tipX = pivotX + Math.sin(rad) * shinaiLen * (flip ? -1 : 1);
  const tipY = pivotY - Math.cos(rad) * shinaiLen;

  // Shaft
  g.lineStyle(3.5, 0xc4a050, 1);
  g.moveTo(pivotX, pivotY); g.lineTo(tipX, tipY);
  g.lineStyle(2.5, 0xd4b876, 0.8);
  g.moveTo(pivotX, pivotY); g.lineTo(tipX, tipY);

  // Tsuba (guard)
  const tsubaX = pivotX + Math.sin(rad) * 8 * (flip ? -1 : 1);
  const tsubaY = pivotY - Math.cos(rad) * 8;
  ellipse(flip ? 120 - tsubaX : tsubaX, tsubaY, 5, 5, 0x6b4e1b);

  // Sakigawa (tip)
  const sakiX = pivotX + Math.sin(rad) * (shinaiLen - 4) * (flip ? -1 : 1);
  const sakiY = pivotY - Math.cos(rad) * (shinaiLen - 4);
  ellipse(flip ? 120 - sakiX : sakiX, sakiY, 3, 4, 0xf5f0e0);

  // Handle
  g.lineStyle(4, 0x2a1a0a, 1);
  const hx = pivotX - Math.sin(rad) * 6 * (flip ? -1 : 1);
  const hy = pivotY + Math.cos(rad) * 6;
  g.moveTo(hx, hy); g.lineTo(pivotX, pivotY);
}

/* ══════════════════════════════════════════════
   PixiJS Scene Manager
   ══════════════════════════════════════════════ */
function usePixiScene(canvasRef, sceneState) {
  const appRef = useRef(null);
  const playerGfx = useRef(null);
  const opponentGfx = useRef(null);
  const courtGfx = useRef(null);
  const refGfx = useRef([]);
  const flagSprites = useRef([]);
  const particlesRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

    const app = new PIXI.Application({
      width: 400, height: 320,
      backgroundColor: 0xD4B88C,
      view: canvasRef.current,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    appRef.current = app;

    // Court lines
    const court = new PIXI.Graphics();
    // Green boundary
    court.lineStyle(2.5, 0x2E7D32, 1);
    court.drawRect(16, 16, 368, 288);
    // Blue inner
    court.lineStyle(1, 0x1565C0, 0.3);
    court.drawRect(14, 14, 372, 292);
    // Center circle
    court.lineStyle(1.5, 0xFFFFFF, 0.15);
    court.drawEllipse(200, 160, 50, 30);
    // Cross marks
    court.lineStyle(2.5, 0x2E7D32, 1);
    court.moveTo(140, 160); court.lineTo(162, 160);
    court.moveTo(238, 160); court.lineTo(260, 160);
    // Wood grain
    court.lineStyle(1, 0x8B6B42, 0.18);
    for (let i = 1; i <= 15; i++) {
      court.moveTo(i * 25, 0); court.lineTo(i * 25, 320);
    }
    app.stage.addChild(court);
    courtGfx.current = court;

    // Referees (3)
    for (let i = 0; i < 3; i++) {
      const ref = new PIXI.Graphics();
      refGfx.current.push(ref);
      app.stage.addChild(ref);

      // Flags for each referee
      const flag = new PIXI.Graphics();
      flagSprites.current.push(flag);
      app.stage.addChild(flag);
    }

    // Particles container for effects
    const particles = new PIXI.Container();
    particlesRef.current = particles;
    app.stage.addChild(particles);

    // Player & opponent
    const pg = new PIXI.Graphics();
    const og = new PIXI.Graphics();
    playerGfx.current = pg;
    opponentGfx.current = og;
    app.stage.addChild(pg);
    app.stage.addChild(og);

    return () => {
      app.destroy(true);
      appRef.current = null;
    };
  }, [canvasRef]);

  // Update scene on state change
  useEffect(() => {
    if (!appRef.current || !playerGfx.current) return;
    const { distance, playerPose, opponentPose, playerHit, opponentHit,
            attackZone, opponentZone, flags, semeShake } = sceneState;

    // Distance → position
    const gap = distance === "far" ? 80 : distance === "issoku" ? 30 : 0;
    const playerX = 200 - 60 - gap / 2;
    const opponentX = 200 + gap / 2 - 60;
    const fighterY = 30;

    // Draw player
    const pg = playerGfx.current;
    drawFighterFrame(pg, {
      pose: playerPose, attackZone, hit: playerHit, flip: false, semeShake,
    });
    pg.position.set(playerX, fighterY);

    // Draw opponent
    const og = opponentGfx.current;
    drawFighterFrame(og, {
      pose: opponentPose, attackZone: opponentZone, hit: opponentHit, flip: true, semeShake: -semeShake * 0.6,
    });
    og.position.set(opponentX, fighterY);

    // Draw referees
    const refPositions = [
      { x: 12, y: 130 },   // left
      { x: 365, y: 130 },  // right
      { x: 188, y: 285 },  // main (bottom center)
    ];
    refGfx.current.forEach((ref, i) => {
      ref.clear();
      const rp = refPositions[i];
      const sc = i === 2 ? 1.1 : 0.85;
      // Head
      ref.lineStyle(0); ref.beginFill(0xd4a574);
      ref.drawCircle(rp.x, rp.y - 15 * sc, 5 * sc); ref.endFill();
      // Body (white shirt)
      ref.beginFill(0xf0f0f0);
      ref.drawRect(rp.x - 7 * sc, rp.y - 10 * sc, 14 * sc, 20 * sc);
      ref.endFill();
      // Tie
      ref.beginFill(0x8b1a1a);
      ref.drawRect(rp.x - 1, rp.y - 10 * sc, 2, 12 * sc);
      ref.endFill();
      // Pants
      ref.beginFill(0x2a2a2a);
      ref.drawRect(rp.x - 7 * sc, rp.y + 10 * sc, 14 * sc, 14 * sc);
      ref.endFill();
    });

    // Flags
    flagSprites.current.forEach((fg, i) => {
      fg.clear();
      const rp = refPositions[i];
      const isUp = flags && flags[i];
      // Red flag (left hand)
      fg.lineStyle(1, 0x8b6914, 0.8);
      fg.moveTo(rp.x - 10, rp.y - 5); fg.lineTo(rp.x - 10, rp.y - (isUp ? 30 : 12));
      fg.lineStyle(0); fg.beginFill(isUp ? 0xE53935 : 0x442222, isUp ? 1 : 0.3);
      fg.drawRect(rp.x - 18, rp.y - (isUp ? 38 : 18), 10, 7);
      fg.endFill();
      // White flag (right hand)
      fg.lineStyle(1, 0x8b6914, 0.8);
      fg.moveTo(rp.x + 10, rp.y - 5); fg.lineTo(rp.x + 10, rp.y - (isUp ? 30 : 12));
      fg.lineStyle(0); fg.beginFill(isUp ? 0xf0f0f0 : 0x444444, isUp ? 1 : 0.3);
      fg.drawRect(rp.x + 8, rp.y - (isUp ? 38 : 18), 10, 7);
      fg.endFill();
    });

    // Fumikomi particle effect
    const pc = particlesRef.current;
    while (pc.children.length > 20) pc.removeChildAt(0);

  }, [sceneState]);
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

  // PixiJS scene
  const sceneState = {
    distance: state.distance, playerPose, opponentPose,
    playerHit, opponentHit, attackZone,
    opponentZone: lastResult?.opponent_zone,
    flags, semeShake,
  };
  usePixiScene(canvasRef, sceneState);

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

      {/* PixiJS Canvas */}
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
            {kiai ? `🔥 기합! (${kiaiTimer.toFixed(1)}s) → 지금 타격!` : "기합 (탭 → 1.5초 내 타격!)"}
          </span>
        </button>

        {/* Row 3: Strike zones */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
          {ZONES.map(z => {
            const isOpening = opening === z.key;
            const disabled = !canStrike;
            return (
              <button key={z.key} onClick={() => doAction("strike", z.key)} disabled={disabled}
                style={{ ...btn, opacity: disabled ? .35 : 1, background: isOpening ? "rgba(195,163,95,.12)" : C.surfaceAlt, borderColor: isOpening ? C.brass : C.line, boxShadow: isOpening ? `0 0 12px rgba(195,163,95,.2)` : "none", padding: "14px 0" }}
                onPointerDown={e => { if (!disabled) { e.currentTarget.style.transform = "scale(.93)"; e.currentTarget.style.background = "rgba(155,58,44,.15)"; } }}
                onPointerUp={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = isOpening ? "rgba(195,163,95,.12)" : C.surfaceAlt; }}
                onPointerLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.background = isOpening ? "rgba(195,163,95,.12)" : C.surfaceAlt; }}
              >
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
