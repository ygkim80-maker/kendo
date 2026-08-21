import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";

const ZONE_META = {
  head:   { kanji: "面",   label: "머리",  color: "#4FC3F7" },
  wrist:  { kanji: "小手", label: "손목",  color: "#81C784" },
  waist:  { kanji: "胴",   label: "허리",  color: "#FFB74D" },
  thrust: { kanji: "突",   label: "찌름",  color: "#F06292" },
};

// ── Kendo Fighter ──────────────────────────────────────────────────────────
// origin (0,0) = feet. More realistic proportions — head radius 26, head center y=-222
function drawFighter(ctx, opts = {}) {
  const {
    flip = false,
    strike = null,
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
  if (hitGlow) { ctx.shadowColor = hitGlow; ctx.shadowBlur = 55; }

  // palette
  const gi       = "#2D3748";
  const hakama   = "#1A237E";
  const skin     = "#FFCCBC";
  const men_col  = "#37474F";
  const do_base  = "#E65100";
  const kote_col = "#2E7D32";

  // ── TABI (feet) ──
  ctx.fillStyle = "#ddd";
  ctx.beginPath(); ctx.ellipse(-15, 0, 12, 5, -0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(15, 0, 12, 5, 0.12, 0, Math.PI * 2); ctx.fill();

  // ── HAKAMA ──
  {
    const hg = ctx.createLinearGradient(-30, -72, 30, 0);
    hg.addColorStop(0, "#1565C0");
    hg.addColorStop(0.45, hakama);
    hg.addColorStop(1, "#0D47A1");
    ctx.fillStyle = hg;
    ctx.beginPath();
    ctx.moveTo(-22, -72);
    ctx.bezierCurveTo(-26, -48, -32, -24, -32, 0);
    ctx.lineTo(32, 0);
    ctx.bezierCurveTo(32, -24, 26, -48, 22, -72);
    ctx.closePath();
    ctx.fill();
    // pleats
    ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
    for (let px = -16; px <= 16; px += 8) {
      ctx.beginPath(); ctx.moveTo(px, -70); ctx.lineTo(px + 3.5, 0); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -72); ctx.lineTo(0, 0); ctx.stroke();
  }

  // ── TARE (5-flap waist protector) ──
  {
    for (let i = -2; i <= 2; i++) {
      const tx = i * 11;
      const tg = ctx.createLinearGradient(0, -85, 0, -58);
      tg.addColorStop(0, "#1A237E"); tg.addColorStop(1, "#0D47A1");
      ctx.fillStyle = tg;
      ctx.beginPath(); ctx.roundRect(tx - 4.5, -85, 9, 26, 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // ── BODY (keikogi) ──
  {
    const bg = ctx.createLinearGradient(-18, -148, 18, -72);
    bg.addColorStop(0, "#4A5568");
    bg.addColorStop(0.5, gi);
    bg.addColorStop(1, "#1A202C");
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.moveTo(-20, -74);
    ctx.bezierCurveTo(-24, -95, -20, -130, -14, -148);
    ctx.lineTo(14, -148);
    ctx.bezierCurveTo(20, -130, 24, -95, 20, -74);
    ctx.closePath();
    ctx.fill();
    // lapel V
    ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -145); ctx.lineTo(-9, -74); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -145); ctx.lineTo(9, -74); ctx.stroke();
  }

  // ── DO (chest armor — lacquered) ──
  {
    const waistHL = hitZone === "waist" || activeZone === "waist";
    const dg = ctx.createLinearGradient(-23, -144, 23, -86);
    if (waistHL) {
      dg.addColorStop(0, "#FFD54F"); dg.addColorStop(0.5, ZONE_META.waist.color); dg.addColorStop(1, "#E65100");
    } else {
      dg.addColorStop(0, "#FF6D00"); dg.addColorStop(0.35, do_base);
      dg.addColorStop(0.7, "#BF360C"); dg.addColorStop(1, "#7F2700");
    }
    ctx.fillStyle = dg;
    ctx.beginPath();
    ctx.moveTo(-23, -144);
    ctx.bezierCurveTo(-26, -136, -26, -94, -23, -88);
    ctx.bezierCurveTo(-14, -80, 14, -80, 23, -88);
    ctx.bezierCurveTo(26, -94, 26, -136, 23, -144);
    ctx.closePath();
    ctx.fill();
    // horizontal lacquer ridges
    ctx.strokeStyle = waistHL ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.28)";
    ctx.lineWidth = 1.5;
    for (let dy = -136; dy <= -94; dy += 10) {
      const hw = 21 - Math.abs(dy + 115) * 0.08;
      ctx.beginPath(); ctx.moveTo(-hw, dy); ctx.lineTo(hw, dy); ctx.stroke();
    }
    // edge highlight
    ctx.strokeStyle = waistHL ? "#FFE082" : "rgba(255,140,40,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-23, -144);
    ctx.bezierCurveTo(-26, -136, -26, -94, -23, -88);
    ctx.stroke();
    // do strings
    ctx.strokeStyle = "#FFB74D"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-23, -130); ctx.quadraticCurveTo(-34, -118, -32, -103); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(23, -130); ctx.quadraticCurveTo(34, -118, 32, -103); ctx.stroke();
  }

  // ── ARMS & KOTE ──
  {
    const wristHL = hitZone === "wrist" || activeZone === "wrist";
    const kg = (x1, y1, x2, y2) => {
      const g = ctx.createLinearGradient(x1, y1, x2, y2);
      g.addColorStop(0, wristHL ? "#A5D6A7" : "#388E3C");
      g.addColorStop(1, wristHL ? ZONE_META.wrist.color : kote_col);
      return g;
    };
    const drawArm = (x1, y1, x2, y2, r = 7) => {
      const len = Math.hypot(x2 - x1, y2 - y1);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.save();
      ctx.translate(x1, y1); ctx.rotate(angle);
      ctx.fillStyle = kg(0, 0, len, 0);
      ctx.beginPath(); ctx.roundRect(0, -r, len, r * 2, r); ctx.fill();
      // kote texture ridges
      ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineWidth = 1.5;
      for (let ri = 0.2; ri < 1; ri += 0.2) {
        ctx.beginPath(); ctx.moveTo(len * ri, -r + 2); ctx.lineTo(len * ri, r - 2); ctx.stroke();
      }
      if (wristHL) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(0, -r, len, r * 2, r); ctx.stroke(); }
      ctx.restore();
    };

    if (strike === "head") {
      drawArm(-6, -138, 20, -168, 8);
      drawArm(8, -138, 32, -166, 8);
    } else if (strike === "wrist") {
      drawArm(-8, -138, 22, -190, 8);
      drawArm(8, -138, 34, -188, 8);
    } else if (strike === "waist") {
      drawArm(-8, -138, 20, -188, 8);
      drawArm(8, -138, 32, -186, 8);
    } else if (strike === "thrust") {
      drawArm(-6, -128, 58, -126, 8);
      drawArm(10, -126, 62, -124, 8);
    } else {
      drawArm(-18, -132, -36, -112, 8);
      drawArm(16, -132, 36, -110, 8);
    }
  }

  // ── HEAD / MEN ──
  {
    const headHL = hitZone === "head" || activeZone === "head";
    const HR = 26;
    const HY = -222;

    // neck
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.roundRect(-7, -152, 14, 18, 4); ctx.fill();

    // skin under men
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(0, HY + 6, HR - 3, 0, Math.PI * 2); ctx.fill();

    // eyes
    ctx.fillStyle = "#0a0a1e";
    ctx.beginPath(); ctx.ellipse(-8, HY + 4, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(8, HY + 4, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(-6, HY + 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(10, HY + 1, 2, 0, Math.PI * 2); ctx.fill();

    // shikoro (neck guard — layered)
    ctx.fillStyle = "#1B2838";
    ctx.beginPath(); ctx.ellipse(0, HY + HR + 8, HR + 4, 22, 0, 0, Math.PI); ctx.fill();
    ctx.strokeStyle = "rgba(80,110,130,0.45)"; ctx.lineWidth = 1;
    for (let ri = 0; ri < 3; ri++) {
      ctx.beginPath(); ctx.ellipse(0, HY + HR + 8, HR + 4 - ri * 4, 22 - ri * 5, 0, 0, Math.PI); ctx.stroke();
    }

    // men dome
    const dg = ctx.createRadialGradient(-5, HY - 10, 2, 0, HY, HR);
    dg.addColorStop(0, headHL ? "#90CAF9" : "#607D8B");
    dg.addColorStop(0.5, headHL ? ZONE_META.head.color : men_col);
    dg.addColorStop(1, headHL ? "#0D47A1" : "#102027");
    ctx.fillStyle = dg;
    ctx.beginPath(); ctx.arc(0, HY, HR, 0, Math.PI * 2); ctx.fill();

    // face bar shadow (lower half fill)
    ctx.fillStyle = headHL ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.arc(0, HY, HR, 0.15, Math.PI - 0.15);
    ctx.lineTo(0, HY); ctx.closePath(); ctx.fill();

    // men bars
    ctx.strokeStyle = headHL ? "rgba(210,240,255,0.95)" : "rgba(150,170,180,0.72)";
    ctx.lineWidth = headHL ? 3 : 2.5; ctx.lineCap = "round";
    for (let bx = -18; bx <= 18; bx += 9) {
      ctx.beginPath(); ctx.moveTo(bx, HY - 2); ctx.lineTo(bx, HY + HR - 2); ctx.stroke();
    }
    // horizontal ring
    ctx.strokeStyle = headHL ? "#fff" : "#37474F"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, HY, HR, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = headHL ? "rgba(180,230,255,0.7)" : "rgba(80,100,110,0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, HY, HR, 0.18, Math.PI - 0.18); ctx.stroke();

    // headHL glow ring
    if (headHL) {
      ctx.strokeStyle = ZONE_META.head.color; ctx.lineWidth = 3;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.arc(0, HY, HR + 8, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // ── SHINAI ──
  {
    const thrustHL = hitZone === "thrust" || activeZone === "thrust";
    ctx.lineCap = "round";

    let sx, sy, ex, ey, tX, tY;
    if (strike === "head") {
      sx = 28; sy = -167; ex = 126; ey = -180; tX = 24; tY = -171;
    } else if (strike === "wrist") {
      sx = 30; sy = -188; ex = 118; ey = -140; tX = 26; tY = -192;
    } else if (strike === "waist") {
      sx = 28; sy = -187; ex = 136; ey = -78; tX = 24; tY = -191;
    } else if (strike === "thrust") {
      sx = 58; sy = -125; ex = 155; ey = -125; tX = 54; tY = -131;
    } else if (kamae === "jodan") {
      sx = 10; sy = -148; ex = 48; ey = -230; tX = 6; tY = -152;
    } else {
      const endY = kamae === "gedan" ? -65 : -230;
      sx = 14; sy = -110; ex = 50; ey = endY; tX = 10; tY = -114;
    }

    // motion blur ghost copies during strike
    if (strike) {
      const angle = Math.atan2(ey - sy, ex - sx);
      const perpX = Math.cos(angle + Math.PI / 2);
      const perpY = Math.sin(angle + Math.PI / 2);
      for (let mb = 1; mb <= 4; mb++) {
        const off = mb * 6;
        ctx.globalAlpha = 0.12 - mb * 0.025;
        ctx.strokeStyle = "#D4A017";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx + perpX * off, sy + perpY * off);
        ctx.lineTo(ex + perpX * off, ey + perpY * off);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // speed lines alongside shinai
      ctx.strokeStyle = "rgba(255,240,160,0.35)"; ctx.lineWidth = 1;
      for (let sl = 0; sl < 5; sl++) {
        const sOff = (sl - 2) * 7;
        const px = perpX * sOff, py = perpY * sOff;
        const backX = -Math.cos(angle) * 22, backY = -Math.sin(angle) * 22;
        ctx.beginPath();
        ctx.moveTo(sx + px + backX, sy + py + backY);
        ctx.lineTo(sx + px + backX * 3.2, sy + py + backY * 3.2);
        ctx.stroke();
      }
    }

    // main shinai
    const sg = ctx.createLinearGradient(sx, sy, ex, ey);
    sg.addColorStop(0, "#5D4037");
    sg.addColorStop(0.25, thrustHL ? ZONE_META.thrust.color : "#8D6E63");
    sg.addColorStop(0.65, "#BCAAA4");
    sg.addColorStop(1, "#FFF9C4");
    ctx.strokeStyle = sg;
    ctx.lineWidth = thrustHL ? 6 : 5;
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();

    // bamboo nodes
    ctx.strokeStyle = "rgba(55,35,25,0.5)"; ctx.lineWidth = 2;
    for (let i = 1; i <= 3; i++) {
      const t = i / 4;
      const nx = sx + (ex - sx) * t, ny = sy + (ey - sy) * t;
      const na = Math.atan2(ey - sy, ex - sx) + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(nx - Math.cos(na) * 4.5, ny - Math.sin(na) * 4.5);
      ctx.lineTo(nx + Math.cos(na) * 4.5, ny + Math.sin(na) * 4.5);
      ctx.stroke();
    }

    // tsuba
    const tAngle = Math.atan2(ey - sy, ex - sx);
    ctx.save();
    ctx.translate(tX + 5, tY + 5); ctx.rotate(tAngle);
    const tg = ctx.createLinearGradient(-2, -9, 2, 9);
    tg.addColorStop(0, "#5D4037"); tg.addColorStop(1, "#3E2723");
    ctx.fillStyle = tg;
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#8D6E63"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // tip (sakigawa)
    ctx.fillStyle = "#FFF9C4"; ctx.strokeStyle = "#F9A825"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ex, ey, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (thrustHL) {
      ctx.fillStyle = ZONE_META.thrust.color; ctx.globalAlpha = 0.6;
      ctx.beginPath(); ctx.arc(ex, ey, 12, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
}

// ── Hit Flash — Dramatic ────────────────────────────────────────────────────
function drawHitFlash(ctx, x, y, zone, alpha, flip = false) {
  if (!zone || alpha <= 0) return;
  const col = ZONE_META[zone]?.color || "#fff";
  const kanji = ZONE_META[zone]?.kanji || "";

  const offsets = { head: [0, -222], wrist: [62, -140], waist: [0, -100], thrust: [75, -125] };
  const [dx, dy] = offsets[zone] || [0, -140];
  const hx = x + (flip ? -dx : dx), hy = y + dy;
  const t = 1 - alpha;

  ctx.save();

  // large radial glow halo
  if (alpha > 0.3) {
    const r = 75 + t * 130;
    const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, r);
    glow.addColorStop(0, col + "77");
    glow.addColorStop(0.5, col + "33");
    glow.addColorStop(1, col + "00");
    ctx.globalAlpha = (alpha - 0.3) * 1.3;
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill();
  }

  // white-hot core burst
  ctx.globalAlpha = alpha * alpha;
  const core = ctx.createRadialGradient(hx, hy, 0, hx, hy, 35);
  core.addColorStop(0, "#ffffff");
  core.addColorStop(0.25, "#fffde7");
  core.addColorStop(0.55, col);
  core.addColorStop(1, col + "00");
  ctx.fillStyle = core;
  ctx.beginPath(); ctx.arc(hx, hy, 35, 0, Math.PI * 2); ctx.fill();

  // 22 burst rays
  ctx.globalAlpha = alpha * 0.95;
  ctx.fillStyle = col;
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const r1 = 8, r2 = 42 + t * 60;
    const spread = 0.07 + (i % 3) * 0.03;
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(a - spread) * r1, hy + Math.sin(a - spread) * r1);
    ctx.lineTo(hx + Math.cos(a) * r2, hy + Math.sin(a) * r2);
    ctx.lineTo(hx + Math.cos(a + spread) * r1, hy + Math.sin(a + spread) * r1);
    ctx.closePath(); ctx.fill();
  }

  // alternating white inner rays
  ctx.globalAlpha = alpha * 0.6;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2 + 0.14;
    const r1 = 6, r2 = 22 + t * 28;
    ctx.beginPath();
    ctx.moveTo(hx + Math.cos(a - 0.05) * r1, hy + Math.sin(a - 0.05) * r1);
    ctx.lineTo(hx + Math.cos(a) * r2, hy + Math.sin(a) * r2);
    ctx.lineTo(hx + Math.cos(a + 0.05) * r1, hy + Math.sin(a + 0.05) * r1);
    ctx.closePath(); ctx.fill();
  }

  // flying sparks with gravity + trails
  const sparkCount = 24;
  for (let i = 0; i < sparkCount; i++) {
    const angle = (i / sparkCount) * Math.PI * 2 + (i % 4) * 0.38;
    const speed = 38 + (i % 6) * 16;
    const dist = speed * t * 2.8;
    const grav = dist * 0.25;
    const px = hx + Math.cos(angle) * dist;
    const py = hy + Math.sin(angle) * dist + grav;
    const sa = Math.max(0, alpha * (1 - dist / (speed * 2.2)));
    if (sa <= 0) continue;
    const sparkColor = i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? col : "#FFD700";
    ctx.globalAlpha = sa;
    ctx.fillStyle = sparkColor;
    const sparkR = Math.max(0.4, 3 - t * 2.2);
    ctx.beginPath(); ctx.arc(px, py, sparkR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = sparkColor; ctx.lineWidth = sparkR * 0.9;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - Math.cos(angle) * 16 * alpha, py - Math.sin(angle) * 16 * alpha - grav * 0.4);
    ctx.stroke();
  }

  // 4 expanding shockwave rings
  for (let ri = 0; ri < 4; ri++) {
    const delay = ri * 0.11;
    const at = Math.max(0, alpha - delay);
    if (at <= 0) continue;
    const rt = 1 - at;
    const ringR = (16 + ri * 16) + rt * (44 + ri * 22);
    ctx.strokeStyle = ri === 0 ? "#ffffff" : col;
    ctx.lineWidth = ri === 0 ? 6 : ri === 1 ? 3.5 : 2;
    ctx.globalAlpha = at * (ri === 0 ? 0.9 : 0.6 - ri * 0.1);
    ctx.beginPath(); ctx.arc(hx, hy, ringR, 0, Math.PI * 2); ctx.stroke();
  }

  // large floating kanji
  const floatY = hy - 78 - t * 55;
  const fontSize = 64 + Math.round(t * 18);
  ctx.globalAlpha = alpha;
  ctx.font = `900 ${fontSize}px "Noto Serif", serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.strokeStyle = "#000"; ctx.lineWidth = 12;
  ctx.strokeText(kanji, hx, floatY);
  ctx.fillStyle = "#ffffff"; ctx.fillText(kanji, hx, floatY);
  ctx.globalAlpha = alpha * 0.65;
  ctx.fillStyle = col; ctx.fillText(kanji, hx + 5, floatY + 5);

  ctx.restore();
}

// ── Referee ────────────────────────────────────────────────────────────────
function drawReferee(ctx, x, y, scale = 0.7, flagUp = false, isCenter = false) {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  const scoring = flagUp === "red";

  ctx.fillStyle = "#f5f5f5";
  ctx.beginPath(); ctx.roundRect(-13, -32, 26, 44, 3); ctx.fill();
  ctx.fillStyle = "#37474F";
  ctx.beginPath(); ctx.roundRect(-11, 10, 10, 22, 2); ctx.fill();
  ctx.beginPath(); ctx.roundRect(1, 10, 10, 22, 2); ctx.fill();
  if (isCenter) {
    ctx.fillStyle = "#c62828";
    ctx.beginPath(); ctx.moveTo(-2, -28); ctx.lineTo(2, -28); ctx.lineTo(4, -6); ctx.lineTo(0, 0); ctx.lineTo(-4, -6); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = "#FFCCBC";
  ctx.beginPath(); ctx.arc(0, -42, 13, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#212121";
  ctx.beginPath(); ctx.arc(0, -48, 13, Math.PI, 0); ctx.fill();

  ctx.strokeStyle = "#FFCCBC"; ctx.lineWidth = 8; ctx.lineCap = "round";
  if (scoring) {
    ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(28, -42); ctx.lineTo(22, -72); ctx.stroke();
  } else if (isCenter && !flagUp) {
    ctx.beginPath(); ctx.moveTo(-12, -20); ctx.lineTo(-22, 0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(22, 0); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(12, -20); ctx.lineTo(14, 8); ctx.stroke();
  }

  if (!isCenter || scoring) {
    const flagColor = scoring ? "#ef5350" : "#eeeeee";
    ctx.strokeStyle = flagColor; ctx.lineWidth = 3; ctx.lineCap = "round";
    if (scoring) {
      ctx.beginPath(); ctx.moveTo(22, -72); ctx.lineTo(22, -108); ctx.stroke();
      ctx.fillStyle = flagColor;
      ctx.shadowColor = "#ef5350"; ctx.shadowBlur = scoring ? 20 : 0;
      ctx.beginPath();
      ctx.moveTo(22, -108); ctx.bezierCurveTo(52, -114, 60, -92, 54, -80);
      ctx.bezierCurveTo(44, -90, 34, -98, 22, -92);
      ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
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

  // Screen shake on high-alpha flash
  const shakeActive = state.flashAlpha > 0.55;
  if (shakeActive) {
    const shakeAmt = (state.flashAlpha - 0.55) * 2.2 * 16;
    const t = Date.now();
    ctx.save();
    ctx.translate(Math.sin(t * 0.68) * shakeAmt, Math.cos(t * 0.51) * shakeAmt * 0.65);
  }

  // ── Background — dark dramatic dojo ──
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.60);
  sky.addColorStop(0, "#020208");
  sky.addColorStop(0.5, "#080820");
  sky.addColorStop(1, "#0d1535");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H * 0.60);

  // stars
  ctx.fillStyle = "#fff";
  for (const [sx, sy, r] of [[55,18,1.2],[175,38,0.9],[310,14,1.4],[470,32,1],[630,12,1.3],[790,38,0.8],[915,22,1.2],[1080,35,0.9]]) {
    ctx.globalAlpha = 0.35 + Math.sin(sx * 0.31) * 0.2;
    ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // moon — dramatic crescent
  ctx.fillStyle = "#FFF9C4"; ctx.shadowColor = "#FFF59D"; ctx.shadowBlur = 40;
  ctx.beginPath(); ctx.arc(W - 90, 52, 28, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#060616";
  ctx.beginPath(); ctx.arc(W - 76, 43, 22, 0, Math.PI * 2); ctx.fill();

  // floor — dark wood
  const floor = ctx.createLinearGradient(0, H * 0.60, 0, H);
  floor.addColorStop(0, "#5D4037");
  floor.addColorStop(0.25, "#4E342E");
  floor.addColorStop(0.7, "#3E2723");
  floor.addColorStop(1, "#1A0F0A");
  ctx.fillStyle = floor; ctx.fillRect(0, H * 0.60, W, H * 0.40);

  // wood grain
  ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const gx = (i / 11) * W;
    ctx.beginPath(); ctx.moveTo(gx, H * 0.60); ctx.lineTo(gx + 30, H); ctx.stroke();
  }

  // court lines
  ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, H * 0.60); ctx.lineTo(W, H * 0.60); ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W * 0.10, H * 0.60); ctx.lineTo(W * 0.5, H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.90, H * 0.60); ctx.lineTo(W * 0.5, H); ctx.stroke();
  ctx.setLineDash([8, 8]);
  ctx.beginPath(); ctx.moveTo(W / 2, H * 0.60); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.setLineDash([]);

  // fog at floor
  const fog = ctx.createLinearGradient(0, H * 0.60, 0, H * 0.72);
  fog.addColorStop(0, "rgba(80,60,50,0.18)");
  fog.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = fog; ctx.fillRect(0, H * 0.60, W, H * 0.12);

  // spotlight on center
  const gap = state.distance === "far" ? 240 : state.distance === "issoku" ? 135 : 80;
  const feetY = Math.round(H * 0.60);
  const playerX = W / 2 - gap;
  const oppX = W / 2 + gap;
  const centerX = (playerX + oppX) / 2;

  const spotlight = ctx.createRadialGradient(centerX, feetY - 30, 0, centerX, feetY + 20, 320);
  spotlight.addColorStop(0, "rgba(255,240,200,0.12)");
  spotlight.addColorStop(0.6, "rgba(255,220,160,0.04)");
  spotlight.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spotlight;
  ctx.fillRect(0, 0, W, H);

  // hit zone color tint
  if (state.flashAlpha > 0 && state.hitZone) {
    const col = ZONE_META[state.hitZone]?.color || "#fff";
    const tintAlpha = Math.pow(Math.max(0, state.flashAlpha - 0.4) / 0.6, 2) * 0.18;
    if (tintAlpha > 0) {
      ctx.fillStyle = col; ctx.globalAlpha = tintAlpha;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  }

  // referees
  const allFlag = state.refereeFlash ? "red" : false;
  drawReferee(ctx, 78, H * 0.82, 0.75, allFlag, false);
  drawReferee(ctx, W / 2, H * 0.74, 0.65, allFlag, true);
  drawReferee(ctx, W - 78, H * 0.82, 0.75, allFlag, false);

  // shadows
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.beginPath(); ctx.ellipse(playerX, feetY + 3, 32, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(oppX, feetY + 3, 32, 8, 0, 0, Math.PI * 2); ctx.fill();

  // player
  ctx.save(); ctx.translate(playerX, feetY);
  drawFighter(ctx, {
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
  drawFighter(ctx, {
    flip: true,
    strike: state.oppStrike,
    hitZone: state.hitTarget === "opponent" ? state.hitZone : null,
    isHit: state.hitTarget === "opponent",
    kamae: "chudan",
  });
  ctx.restore();

  // hit flash
  if (state.flashAlpha > 0 && state.hitZone) {
    const fx = state.hitTarget === "player" ? playerX : oppX;
    drawHitFlash(ctx, fx, feetY, state.hitZone, state.flashAlpha, state.hitTarget === "opponent");
  }

  // distance label
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "bold 13px sans-serif"; ctx.textAlign = "center";
  ctx.fillText({ far: "원거리", issoku: "일족일도", tsuba: "코등이" }[state.distance] || "", W / 2, H * 0.65);

  // vignette
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.88);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(0,0,0,0.72)");
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

  // restore screen shake
  if (shakeActive) ctx.restore();

  // full-screen white flash at peak impact
  if (state.flashAlpha > 0.80) {
    ctx.globalAlpha = Math.pow((state.flashAlpha - 0.80) / 0.20, 2) * 0.75;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
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
    setRefereeFlash(true);
    setTimeout(() => setRefereeFlash(false), 2200);
    if (flashRef.current) clearInterval(flashRef.current);
    flashRef.current = setInterval(() => {
      setFlashAlpha(a => { if (a <= 0.05) { clearInterval(flashRef.current); return 0; } return a - 0.052; });
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

  useEffect(() => {
    if (phase !== "fighting") return;
    const zones = ["head", "wrist", "waist", "thrust"];
    let timerId;
    function scheduleNext() {
      const delay = 1800 + (zones.length * 400);
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
