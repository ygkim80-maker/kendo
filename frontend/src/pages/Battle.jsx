import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

const API = "http://localhost:8000";

const ZONE_META = {
  head:   { kanji: "面",   label: "머리",  color: "#4FC3F7" },
  wrist:  { kanji: "小手", label: "손목",  color: "#81C784" },
  waist:  { kanji: "胴",   label: "허리",  color: "#FFB74D" },
  thrust: { kanji: "突",   label: "찌름",  color: "#F06292" },
};

// ── Chibi Kendo Fighter ────────────────────────────────────────────────────
// origin (0,0) = feet level. character height ~220px upward.
function drawChibi(ctx, opts = {}) {
  const {
    flip = false,
    strike = null,   // "head"|"wrist"|"waist"|"thrust"
    hitZone = null,
    activeZone = null,
    shakeX = 0,
    isHit = false,
    kamae = "chudan",
  } = opts;

  ctx.save();
  if (flip) ctx.scale(-1, 1);
  ctx.translate(shakeX, 0);

  const hitGlow = isHit ? (hitZone ? ZONE_META[hitZone]?.color : "#FF5252") : null;
  if (hitGlow) { ctx.shadowColor = hitGlow; ctx.shadowBlur = 40; }

  // ── palette ──
  const gi      = "#4A5568";        // keikogi body
  const hakama  = "#1A237E";        // dark navy hakama
  const skin    = "#FFCCBC";
  const men_col = "#37474F";        // helmet dark
  const do_base = "#E65100";        // do amber/orange
  const kote_col= "#2E7D32";        // kote green
  const shinaiC = "#A1887F";

  // ── FEET / TABI ──
  ctx.fillStyle = "#eee";
  ctx.beginPath();
  ctx.ellipse(-13, 0, 10, 5, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(13, 0, 10, 5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // ── HAKAMA ──
  {
    const hg = ctx.createLinearGradient(-25, -45, 25, -10);
    hg.addColorStop(0, "#0D47A1");
    hg.addColorStop(0.5, hakama);
    hg.addColorStop(1, "#0D47A1");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(-18, -50);
    ctx.lineTo(18, -50);
    ctx.bezierCurveTo(22, -30, 28, -15, 28, 0);
    ctx.lineTo(-28, 0);
    ctx.bezierCurveTo(-28, -15, -22, -30, -18, -50);
    ctx.closePath();
    ctx.fill();
    // center kise
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(0, 0); ctx.stroke();
    for (let i = -12; i <= 12; i += 12) {
      ctx.beginPath(); ctx.moveTo(i, -48); ctx.lineTo(i + 4, 0); ctx.stroke();
    }
  }

  // ── BODY (keikogi) ──
  {
    const bg = ctx.createLinearGradient(-16, -100, 16, -50);
    bg.addColorStop(0, "#616161");
    bg.addColorStop(1, gi);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-16, -52);
    ctx.bezierCurveTo(-18, -70, -15, -95, -10, -105);
    ctx.lineTo(10, -105);
    ctx.bezierCurveTo(15, -95, 18, -70, 16, -52);
    ctx.closePath();
    ctx.fill();
  }

  // ── DO (chest armor) — lacquered amber ──
  {
    const waistHL = hitZone === "waist" || activeZone === "waist";
    const dg = ctx.createLinearGradient(-20, -95, 20, -55);
    if (waistHL) {
      dg.addColorStop(0, "#FFE082");
      dg.addColorStop(0.5, ZONE_META.waist.color);
      dg.addColorStop(1, "#FF8F00");
    } else {
      dg.addColorStop(0, "#FF8F00");
      dg.addColorStop(0.5, do_base);
      dg.addColorStop(1, "#BF360C");
    }
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.roundRect(-20, -95, 40, 42, 6);
    ctx.fill();
    // horizontal armor ridges
    ctx.strokeStyle = waistHL ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.25)";
    ctx.lineWidth = 2;
    for (let y = -88; y <= -62; y += 10) {
      ctx.beginPath();
      ctx.moveTo(-19, y); ctx.lineTo(19, y);
      ctx.stroke();
    }
    if (waistHL) {
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(-20, -95, 40, 42, 6); ctx.stroke();
    }
    // do side strings
    ctx.strokeStyle = "#FFB74D"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-20, -90); ctx.lineTo(-28, -80); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20, -90); ctx.lineTo(28, -80); ctx.stroke();
  }

  // ── ARMS & KOTE based on strike pose ──
  {
    const wristHL = hitZone === "wrist" || activeZone === "wrist";
    const kg = (x1, y1, x2, y2) => {
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, wristHL ? "#A5D6A7" : "#43A047");
      g.addColorStop(1, wristHL ? ZONE_META.wrist.color : kote_col);
      return g;
    };

    const drawArm = (x1, y1, x2, y2, r = 6) => {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(angle);
      ctx.fillStyle = kg(0, 0, len, 0);
      ctx.beginPath();
      ctx.roundRect(0, -r, len, r * 2, r);
      ctx.fill();
      if (wristHL) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.stroke(); }
      ctx.restore();
    };

    if (strike === "head") {
      // 面: arms extended FORWARD at head height, shinai horizontal toward opponent's men
      drawArm(-6, -100, 16, -138, 7);
      drawArm(8, -100, 28, -136, 7);
    } else if (strike === "wrist") {
      // 小手: arms raised HIGH, shinai goes forward-DOWN onto opponent's kote
      drawArm(-8, -102, 18, -152, 7);
      drawArm(8, -102, 30, -150, 7);
    } else if (strike === "waist") {
      // 胴: arms raised HIGH above head, shinai sweeps diagonally down to opponent's do
      drawArm(-8, -100, 16, -148, 7);
      drawArm(8, -100, 28, -146, 7);
    } else if (strike === "thrust") {
      // 突: both arms thrust straight forward
      drawArm(-6, -92, 50, -90, 7);
      drawArm(10, -90, 54, -88, 7);
    } else {
      // guard — hands up in front, both arms
      drawArm(-18, -96, -32, -82, 7);
      drawArm(16, -96, 32, -80, 7);
    }
  }

  // ── HEAD / MEN (helmet) ── big chibi head!
  {
    const headHL = hitZone === "head" || activeZone === "head";
    const HR = 34; // head radius
    const HY = -145; // head center Y

    // neck
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.roundRect(-8, -112, 16, 14, 4);
    ctx.fill();

    // cheeks (skin showing through men)
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, HY + 6, HR - 6, 0, Math.PI * 2); ctx.fill();

    // anime eyes
    ctx.fillStyle = "#1a1a2e";
    ctx.beginPath(); ctx.ellipse(-10, HY + 4, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10, HY + 4, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-8, HY + 1, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, HY + 1, 2.5, 0, Math.PI * 2); ctx.fill();

    // men-dare (face curtain) behind
    ctx.fillStyle = "#263238";
    ctx.beginPath();
    ctx.ellipse(0, HY + HR + 4, HR - 4, 16, 0, 0, Math.PI);
    ctx.fill();

    // men dome
    const dg = ctx.createRadialGradient(-8, HY - 12, 4, 0, HY, HR);
    dg.addColorStop(0, headHL ? "#80D8FF" : "#546E7A");
    dg.addColorStop(0.6, headHL ? ZONE_META.head.color : men_col);
    dg.addColorStop(1, headHL ? "#01579B" : "#102027");
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(0, HY, HR, 0, Math.PI * 2); ctx.fill();

    // men bars (face guard vertical bars)
    ctx.strokeStyle = headHL ? "rgba(255,255,255,0.9)" : "rgba(144,164,174,0.7)";
    ctx.lineWidth = headHL ? 3 : 2.5;
    ctx.lineCap = "round";
    for (let bx = -20; bx <= 20; bx += 10) {
      ctx.beginPath();
      ctx.moveTo(bx, HY - 6);
      ctx.lineTo(bx, HY + HR - 4);
      ctx.stroke();
    }

    // men horizontal ring
    ctx.strokeStyle = headHL ? "rgba(255,255,255,0.8)" : "#37474F";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, HY, HR, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, HY, HR, 0.15, Math.PI - 0.15);
    ctx.stroke();

    // headHL glow ring
    if (headHL) {
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(0, HY, HR + 6, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── SHINAI (bamboo sword — long!) ──
  {
    const thrustHL = hitZone === "thrust" || activeZone === "thrust";
    ctx.lineCap = "round";

    let sx, sy, ex, ey, tX, tY;

    if (strike === "head") {
      // 面: shinai horizontal aimed at opponent's men (head)
      sx = 24; sy = -137; ex = 118; ey = -145;
      tX = 20; tY = -141;
    } else if (strike === "wrist") {
      // 小手: shinai from HIGH position going forward-DOWN onto opponent's kote
      sx = 26; sy = -150; ex = 112; ey = -108;
      tX = 22; tY = -154;
    } else if (strike === "waist") {
      // 胴: shinai from HIGH above, sweeping forward-diagonal-down to opponent's do
      sx = 24; sy = -147; ex = 128; ey = -55;
      tX = 20; tY = -151;
    } else if (strike === "thrust") {
      // 突: shinai horizontal, straight at opponent
      sx = 50; sy = -89; ex = 140; ey = -89;
      tX = 46; tY = -95;
    } else if (kamae === "jodan") {
      sx = 10; sy = -108; ex = 46; ey = -195;
      tX = 6; tY = -112;
    } else {
      const endY = kamae === "gedan" ? -55 : -195;
      sx = 14; sy = -80; ex = 48; ey = endY;
      tX = 10; tY = -84;
    }

    // shinai bamboo gradient
    const sg = ctx.createLinearGradient(sx, sy, ex, ey);
    sg.addColorStop(0, "#6D4C41");
    sg.addColorStop(0.3, thrustHL ? ZONE_META.thrust.color : "#A1887F");
    sg.addColorStop(0.7, "#BCAAA4");
    sg.addColorStop(1, "#FFF9C4");  // tip (sakigawa)
    ctx.strokeStyle = sg;
    ctx.lineWidth = thrustHL ? 6 : 5;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();

    // bamboo nodes
    ctx.strokeStyle = "rgba(80,50,40,0.5)";
    ctx.lineWidth = 2;
    const steps = 3;
    for (let i = 1; i <= steps; i++) {
      const t = i / (steps + 1);
      const nx = sx + (ex - sx) * t;
      const ny = sy + (ey - sy) * t;
      const angle = Math.atan2(ey - sy, ex - sx) + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(nx - Math.cos(angle) * 4, ny - Math.sin(angle) * 4);
      ctx.lineTo(nx + Math.cos(angle) * 4, ny + Math.sin(angle) * 4);
      ctx.stroke();
    }

    // tsuba (guard)
    const angle = Math.atan2(ey - sy, ex - sx);
    ctx.save();
    ctx.translate(tX + 5, tY + 5);
    ctx.rotate(angle);
    const tg = ctx.createLinearGradient(-2, -8, 2, 8);
    tg.addColorStop(0, "#5D4037"); tg.addColorStop(1, "#3E2723");
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // tip (sakigawa) white cap
    ctx.fillStyle = "#FFF9C4";
    ctx.strokeStyle = "#F9A825"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ex, ey, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  ctx.restore();
}

// ── Hit Flash ──────────────────────────────────────────────────────────────
function drawHitFlash(ctx, x, y, zone, alpha) {
  if (!zone || alpha <= 0) return;
  const col = ZONE_META[zone]?.color || "#fff";
  const kanji = ZONE_META[zone]?.kanji || "";

  // head:-145(helmet), wrist:-108(kote high), waist:-78(do center), thrust:-89(thrust)
  const offsets = { head: [0, -145], wrist: [55, -108], waist: [0, -78], thrust: [60, -89] };
  const [dx, dy] = offsets[zone] || [0, -100];
  const hx = x + dx, hy = y + dy;
  const t = 1 - alpha; // 0→1 as effect fades

  ctx.save();

  // screen edge glow (early phase)
  if (alpha > 0.6) {
    const edgeGlow = ctx.createRadialGradient(hx, hy, 0, hx, hy, 220);
    edgeGlow.addColorStop(0, col + "55");
    edgeGlow.addColorStop(1, col + "00");
    ctx.globalAlpha = (alpha - 0.6) * 2.5;
    ctx.fillStyle = edgeGlow;
    ctx.beginPath(); ctx.arc(hx, hy, 220, 0, Math.PI * 2); ctx.fill();
  }

  // white hot core flash
  ctx.globalAlpha = alpha * alpha;
  const core = ctx.createRadialGradient(hx, hy, 0, hx, hy, 28);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.4, col);
  core.addColorStop(1, col + "00");
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(hx, hy, 28, 0, Math.PI * 2); ctx.fill();

  // 16 burst rays
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = col;
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const r1 = 10, r2 = 36 + t * 42;
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(a - 0.10) * r1, hy + Math.sin(a - 0.10) * r1);
    ctx.lineTo(hx + Math.cos(a) * r2, hy + Math.sin(a) * r2);
    ctx.lineTo(hx + Math.cos(a + 0.10) * r1, hy + Math.sin(a + 0.10) * r1);
    ctx.closePath(); ctx.fill();
  }

  // 3 expanding rings
  for (let ri = 0; ri < 3; ri++) {
    const delay = ri * 0.15;
    const at = Math.max(0, alpha - delay);
    if (at <= 0) continue;
    const ringR = (24 + ri * 18) + t * (30 + ri * 15);
    ctx.globalAlpha = at * 0.8;
    ctx.strokeStyle = ri === 0 ? "#ffffff" : col;
    ctx.lineWidth = ri === 0 ? 5 : 2.5;
    ctx.beginPath(); ctx.arc(hx, hy, ringR, 0, Math.PI * 2); ctx.stroke();
  }

  // large floating kanji
  const floatY = hy - 60 - t * 40;
  const fontSize = 52 + Math.round(t * 12);
  ctx.globalAlpha = alpha;
  ctx.font = `bold ${fontSize}px "Noto Serif", serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.strokeStyle = "#000"; ctx.lineWidth = 8;
  ctx.strokeText(kanji, hx, floatY);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(kanji, hx, floatY);
  // color shadow beneath
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = col;
  ctx.fillText(kanji, hx + 3, floatY + 3);

  ctx.restore();
}

// ── Referee ────────────────────────────────────────────────────────────────
// flagUp: false=down, "red"=scored, "white"=no-score
function drawReferee(ctx, x, y, scale = 0.7, flagUp = false, isCenter = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const scoring = flagUp === "red";

  // white shirt
  ctx.fillStyle = "#f5f5f5";
  ctx.beginPath(); ctx.roundRect(-13, -32, 26, 44, 3); ctx.fill();
  // dark trousers
  ctx.fillStyle = "#37474F";
  ctx.beginPath(); ctx.roundRect(-11, 10, 10, 22, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(1, 10, 10, 22, 2); ctx.fill();
  // necktie (center ref has tie)
  if (isCenter) {
    ctx.fillStyle = "#c62828";
    ctx.beginPath(); ctx.moveTo(-2, -28); ctx.lineTo(2, -28); ctx.lineTo(4, -6); ctx.lineTo(0, 0); ctx.lineTo(-4, -6); ctx.closePath(); ctx.fill();
  }
  // head
  ctx.fillStyle = "#FFCCBC";
  ctx.beginPath(); ctx.arc(0, -42, 13, 0, Math.PI * 2); ctx.fill();
  // hair
  ctx.fillStyle = "#212121";
  ctx.beginPath(); ctx.arc(0, -48, 13, Math.PI, 0); ctx.fill();

  // raised arm (flag arm)
  ctx.strokeStyle = "#FFCCBC"; ctx.lineWidth = 8; ctx.lineCap = "round";
  if (scoring) {
    // arm raised high — elbow at side, forearm up
    ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(28, -40); ctx.lineTo(22, -70); ctx.stroke();
  } else if (isCenter && !flagUp) {
    // center ref: both arms slightly out during normal play
    ctx.beginPath(); ctx.moveTo(-12, -20); ctx.lineTo(-22, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(22, 0); ctx.stroke();
  } else {
    // arm down at side
    ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(14, 8); ctx.stroke();
  }

  // flag
  if (!isCenter || scoring) {
    const flagColor = scoring ? "#ef5350" : "#eeeeee";
    ctx.strokeStyle = flagColor; ctx.lineWidth = 3; ctx.lineCap = "round";
    if (scoring) {
      // flag pole: raised high
      ctx.beginPath(); ctx.moveTo(22, -70); ctx.lineTo(22, -105); ctx.stroke();
      // flag waving
      ctx.fillStyle = flagColor;
      ctx.shadowColor = "#ef5350"; ctx.shadowBlur = scoring ? 18 : 0;
      ctx.beginPath();
      ctx.moveTo(22, -105); ctx.bezierCurveTo(50, -110, 58, -90, 52, -78);
      ctx.bezierCurveTo(42, -88, 32, -95, 22, -90);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      // flag pole down
      ctx.beginPath(); ctx.moveTo(14, 8); ctx.lineTo(14, 36); ctx.stroke();
      ctx.fillStyle = flagColor;
      ctx.beginPath(); ctx.moveTo(14, 36); ctx.lineTo(30, 42); ctx.lineTo(14, 48); ctx.closePath(); ctx.fill();
    }
  }

  ctx.restore();
}

// ── Scene Render ────────────────────────────────────────────────────────────
function renderScene(canvas, state) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.58);
  sky.addColorStop(0, "#050510");
  sky.addColorStop(0.6, "#0a1040");
  sky.addColorStop(1, "#152060");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.58);

  // stars
  ctx.fillStyle = "#fff";
  for (const [sx, sy, r] of [[60,22,1.3],[180,40,1],[320,18,1.5],[480,35,1.1],[640,14,1.4],[800,42,1],[920,24,1.3],[1100,38,1]]) {
    ctx.globalAlpha = 0.5 + Math.sin(sx * 0.3) * 0.3;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // moon
  ctx.fillStyle = "#FFF9C4"; ctx.shadowColor = "#FFF59D"; ctx.shadowBlur = 28;
  ctx.beginPath(); ctx.arc(W - 100, 55, 26, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#0a1040";
  ctx.beginPath(); ctx.arc(W - 88, 47, 21, 0, Math.PI * 2); ctx.fill();

  // floor
  const floor = ctx.createLinearGradient(0, H * 0.58, 0, H);
  floor.addColorStop(0, "#8D6E63");
  floor.addColorStop(0.3, "#6D4C41");
  floor.addColorStop(1, "#3E2723");
  ctx.fillStyle = floor; ctx.fillRect(0, H * 0.58, W, H * 0.42);

  // court lines
  ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, H * 0.58); ctx.lineTo(W, H * 0.58); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W * 0.08, H * 0.58); ctx.lineTo(W * 0.5, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.92, H * 0.58); ctx.lineTo(W * 0.5, H); ctx.stroke();
  ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(W / 2, H * 0.58); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.setLineDash([]);

  // referees — all raise red flags on ippon
  const allFlag = state.refereeFlash ? "red" : false;
  drawReferee(ctx, 80, H * 0.82, 0.75, allFlag, false);
  drawReferee(ctx, W / 2, H * 0.74, 0.65, allFlag, true);
  drawReferee(ctx, W - 80, H * 0.82, 0.75, allFlag, false);

  const gap = state.distance === "far" ? 240 : state.distance === "issoku" ? 135 : 80;
  const feetY = Math.round(H * 0.6);
  const playerX = W / 2 - gap;
  const oppX = W / 2 + gap;

  // shadows
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(playerX, feetY + 2, 28, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(oppX, feetY + 2, 28, 7, 0, 0, Math.PI * 2); ctx.fill();

  // player
  ctx.save(); ctx.translate(playerX, feetY);
  drawChibi(ctx, {
    flip: false,
    strike: state.playerStrike,
    hitZone: state.hitTarget === "player" ? state.hitZone : null,
    activeZone: state.activeZone,
    shakeX: state.playerSeme ? (Math.random() - 0.5) * 5 : 0,
    isHit: state.hitTarget === "player",
    kamae: state.playerKamae,
  });
  ctx.restore();

  // opponent
  ctx.save(); ctx.translate(oppX, feetY);
  drawChibi(ctx, {
    flip: true,
    strike: state.oppStrike,
    hitZone: state.hitTarget === "opponent" ? state.hitZone : null,
    isHit: state.hitTarget === "opponent",
    kamae: "chudan",
  });
  ctx.restore();

  // hit flash — for opponent (flip=true) mirror the x-offset
  if (state.flashAlpha > 0 && state.hitZone) {
    const fx = state.hitTarget === "player" ? playerX : oppX;
    const flip = state.hitTarget === "opponent";
    drawHitFlash(ctx, fx, feetY, state.hitZone, state.flashAlpha, flip);
  }

  // distance label
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
  ctx.fillText({ far: "원거리", issoku: "일족일도", tsuba: "코등이" }[state.distance] || "", W / 2, H * 0.65);
}

function useScene(canvasRef, sceneState) {
  useEffect(() => {
    const c = canvasRef.current;
    if (c) renderScene(c, sceneState);
  });
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function Battle() {
  const { studentId } = useParams();
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 960, h: 440 });

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

  const [flashAlpha, setFlashAlpha] = useState(0);
  const [flashZone, setFlashZone] = useState(null);
  const [flashTarget, setFlashTarget] = useState(null);
  const [playerStrike, setPlayerStrike] = useState(null);
  const [oppStrike, setOppStrike] = useState(null);
  const flashRef = useRef(null);
  const [defending, setDefending] = useState(false);
  const [defendWindow, setDefendWindow] = useState(false);
  const defendRef = useRef(null);
  const [refereeFlash, setRefereeFlash] = useState(false);

  // responsive canvas
  useEffect(() => {
    const resize = () => {
      if (!wrapRef.current) return;
      const { width, height } = wrapRef.current.getBoundingClientRect();
      setCanvasSize({ w: Math.round(width), h: Math.round(height) });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  useEffect(() => {
    fetch(`${API}/api/students`).then(r => r.json()).then(setStudents).catch(() => {});
  }, []);

  useEffect(() => {
    if (phase !== "fighting") return;
    const id = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(id); handleTimeout(); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  function triggerFlash(zone, target) {
    setFlashZone(zone); setFlashTarget(target); setFlashAlpha(1);
    // 3심 깃발 올리기 (2.2초)
    setRefereeFlash(true);
    setTimeout(() => setRefereeFlash(false), 2200);
    if (flashRef.current) clearInterval(flashRef.current);
    flashRef.current = setInterval(() => {
      setFlashAlpha(a => { if (a <= 0.05) { clearInterval(flashRef.current); return 0; } return a - 0.055; });
    }, 28);
  }

  const sceneState = {
    playerScore: battle?.player_score ?? 0,
    oppScore: battle?.opponent_score ?? 0,
    distance: battle?.distance ?? "far",
    playerStrike, oppStrike,
    hitZone: flashZone, hitTarget: flashTarget, flashAlpha,
    activeZone, playerSeme: holding === "seme", playerKamae: kamae, refereeFlash,
  };
  useScene(canvasRef, sceneState);

  async function startBattle() {
    const body = {
      student_id: parseInt(studentId), opponent_type: oppType,
      opponent_student_id: oppType === "ghost" && oppId ? parseInt(oppId) : null,
    };
    const r = await fetch(`${API}/api/battle/start`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    if (!r.ok) { alert("시합 시작 실패"); return; }
    const data = await r.json();
    setOppName(data.opponent_name); setBattle(data);
    setPhase("fighting"); setTimer(180); setLog([]);
  }

  const sendAction = useCallback(async (action, zone) => {
    const r = await fetch(`${API}/api/battle/action/${studentId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, zone: zone || null, kiai, kamae_change: null }),
    });
    if (!r.ok) return;
    const data = await r.json();
    if (data.scored) triggerFlash(data.scored_zone || zone || "head", data.scored_by === "player" ? "opponent" : "player");
    if (data.opp_scored) triggerFlash(data.opp_scored_zone || "head", "player");
    if (data.opp_action_zone) {
      setOppStrike(data.opp_action_zone); setTimeout(() => setOppStrike(null), 500);
      openDefendWindow();
    }
    setBattle(data);
    if (data.log) setLog(prev => [data.log, ...prev].slice(0, 8));
    if (data.finished) {
      const res = await fetch(`${API}/api/battle/finish/${studentId}`, { method: "POST" });
      const fin = await res.json();
      setResult(fin); setPhase("result");
    }
  }, [studentId, kiai]);

  async function handleTimeout() {
    const r = await fetch(`${API}/api/battle/timeout/${studentId}`, { method: "POST" });
    const fin = await r.json();
    setResult(fin); setPhase("result");
  }

  useEffect(() => {
    if (holding !== "seme") return;
    const id = setInterval(() => sendAction("seme"), 800);
    return () => clearInterval(id);
  }, [holding, sendAction]);

  // opponent auto-animation (periodic attack poses independent of server)
  useEffect(() => {
    if (phase !== "fighting") return;
    const zones = ["head", "wrist", "waist", "thrust"];
    let timerId;
    function scheduleNext() {
      const delay = 1800 + (zones.length * 400); // ~3.4s average
      timerId = setTimeout(() => {
        const z = zones[Math.floor(Date.now() % zones.length)];
        setOppStrike(z);
        setTimeout(() => setOppStrike(null), 500);
        scheduleNext();
      }, delay);
    }
    scheduleNext();
    return () => clearTimeout(timerId);
  }, [phase]);

  function openDefendWindow() {
    setDefendWindow(true);
    if (defendRef.current) clearTimeout(defendRef.current);
    defendRef.current = setTimeout(() => setDefendWindow(false), 800);
  }

  function handleDefend() {
    if (!defendWindow) return;
    setDefending(true);
    sendAction("block");
    setTimeout(() => setDefending(false), 400);
  }

  function strikeZone(z) {
    setPlayerStrike(z); sendAction("strike", z);
    setTimeout(() => setPlayerStrike(null), 380);
  }

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  if (phase === "setup") return (
    <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold text-yellow-400">⚔️ 시합 설정</h1>
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg flex flex-col gap-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">상대 유형</label>
          <div className="flex gap-3">
            <button onClick={() => setOppType("ai")} className={`flex-1 py-3 rounded-xl font-bold text-lg ${oppType === "ai" ? "bg-blue-600" : "bg-gray-700"}`}>AI 대전</button>
            <button onClick={() => setOppType("ghost")} className={`flex-1 py-3 rounded-xl font-bold text-lg ${oppType === "ghost" ? "bg-purple-600" : "bg-gray-700"}`}>유령 대전</button>
          </div>
        </div>
        {oppType === "ghost" && (
          <select value={oppId} onChange={e => setOppId(e.target.value)} className="w-full bg-gray-700 rounded-xl p-3 text-lg">
            <option value="">-- 선수 선택 --</option>
            {students.filter(s => s.id !== parseInt(studentId)).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <button onClick={startBattle} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl text-2xl mt-2">始 め ！</button>
      </div>
    </div>
  );

  if (phase === "result") {
    const won = result?.result === "win", draw = result?.result === "draw";
    return (
      <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
        <div className={`text-8xl font-black ${won ? "text-yellow-400" : draw ? "text-gray-300" : "text-red-400"}`}>
          {won ? "勝！" : draw ? "引分" : "負"}
        </div>
        <div className="text-3xl font-bold">{won ? "승리!" : draw ? "무승부" : "패배..."}</div>
        <div className="text-xl text-gray-300">{result?.score?.player ?? 0} 본 : {result?.score?.opponent ?? 0} 본</div>
        <button onClick={() => { setPhase("setup"); setBattle(null); setResult(null); setTimer(180); }}
          className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-bold text-xl mt-4">다시 하기</button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* score bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-gray-900 border-b border-gray-800 flex-shrink-0" style={{ minHeight: 60 }}>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm font-semibold">나</span>
          <span className="text-5xl font-black text-yellow-400">{battle?.player_score ?? 0}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-mono font-bold text-red-400">{fmtTime(timer)}</span>
          <span className="text-xs text-gray-500">
            {battle?.distance === "far" ? "원거리" : battle?.distance === "issoku" ? "일족일도" : "코등이"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-5xl font-black text-red-400">{battle?.opponent_score ?? 0}</span>
          <span className="text-gray-400 text-sm font-semibold">{oppName}</span>
        </div>
      </div>

      {/* canvas */}
      <div ref={wrapRef} className="flex-1 relative" style={{ minHeight: 0 }}>
        <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h}
          style={{ width: "100%", height: "100%", display: "block" }} />
        {log.length > 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/65 rounded-lg px-5 py-1 text-sm text-yellow-200 whitespace-nowrap pointer-events-none">
            {log[0]}
          </div>
        )}
      </div>

      {/* controls */}
      <div className="bg-gray-900 border-t border-gray-800 px-3 py-2 flex gap-2 flex-shrink-0" style={{ height: 140 }}>

        {/* move + seme */}
        <div className="flex flex-col gap-1.5 w-24">
          <button onPointerDown={() => sendAction("step_in")}
            className="flex-1 bg-gray-700 active:bg-gray-500 rounded-lg font-bold text-xs active:scale-95 transition-transform select-none">앞으로 ▶</button>
          <button onPointerDown={() => sendAction("step_back")}
            className="flex-1 bg-gray-700 active:bg-gray-500 rounded-lg font-bold text-xs active:scale-95 transition-transform select-none">◀ 뒤로</button>
          <button
            onPointerDown={() => setHolding("seme")}
            onPointerUp={() => setHolding(null)}
            onPointerLeave={() => setHolding(null)}
            className={`flex-1 rounded-lg font-bold text-xs active:scale-95 transition-transform select-none ${holding === "seme" ? "bg-orange-500" : "bg-orange-800 active:bg-orange-600"}`}
          >세메 꾹</button>
        </div>

        {/* zone buttons */}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {Object.entries(ZONE_META).map(([z, m]) => (
            <button key={z}
              onPointerEnter={() => setActiveZone(z)}
              onPointerLeave={() => setActiveZone(null)}
              onPointerDown={() => strikeZone(z)}
              className="rounded-xl font-bold flex flex-col items-center justify-center gap-0.5 active:scale-90 transition-transform select-none"
              style={{ backgroundColor: m.color + "22", border: `2px solid ${m.color}`, color: m.color }}
            >
              <span className="text-2xl">{m.kanji}</span>
              <span className="text-xs opacity-80">{m.label}</span>
            </button>
          ))}
        </div>

        {/* kiai + defend + kamae */}
        <div className="flex flex-col gap-1.5 w-24">
          <button
            onPointerDown={() => { setKiai(true); sendAction("kiai"); }}
            onPointerUp={() => setKiai(false)}
            className="flex-1 bg-red-800 active:bg-red-600 rounded-lg font-black text-sm active:scale-95 transition-transform select-none"
          >기합！！</button>
          <button
            onPointerDown={handleDefend}
            className={`flex-1 rounded-lg font-black text-sm active:scale-95 transition-all select-none border-2
              ${defendWindow ? "bg-cyan-500 border-cyan-300 animate-pulse text-white" : "bg-gray-700 border-gray-600 text-gray-300"}
              ${defending ? "scale-95" : ""}`}
          >방어！</button>
          {["chudan", "jodan"].map(k => (
            <button key={k} onClick={() => { setKamae(k); sendAction("kamae"); }}
              className={`flex-1 rounded-lg text-xs font-bold active:scale-95 transition-transform ${kamae === k ? "bg-indigo-600" : "bg-gray-700"}`}>
              {k === "chudan" ? "中段" : "上段"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
