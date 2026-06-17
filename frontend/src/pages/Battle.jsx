import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../hooks/api";

const C = {
  bg: "#0B0E15", surface: "#1D2433", surfaceAlt: "#252E40",
  paper: "#ECE4D3", paperDim: "#9B9485", brass: "#C3A35F",
  accent: "#9B3A2C", accentBright: "#E14430", line: "rgba(236,228,211,0.10)",
  floor: "#D4B88C", floorLine: "#2E7D32", blue: "#1565C0",
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

/* ── Web Audio: 구름발 + 타격음 ── */
const audioCtx = typeof AudioContext !== "undefined" ? new AudioContext() : null;
function playSound(type) {
  if (!audioCtx) return;
  if (audioCtx.state === "suspended") audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  if (type === "fumikomi") {
    osc.type = "square"; osc.frequency.value = 80;
    gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    osc.start(); osc.stop(audioCtx.currentTime + 0.15);
  } else if (type === "hit") {
    osc.type = "sawtooth"; osc.frequency.value = 200;
    gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    osc.start(); osc.stop(audioCtx.currentTime + 0.1);
  } else if (type === "kiai") {
    osc.type = "sawtooth"; osc.frequency.value = 350;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
  } else if (type === "shinai") {
    osc.type = "triangle"; osc.frequency.value = 1200;
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
  }
}

/* ── SVG Kendo Fighter ── */
function Fighter({ facing = "right", pose = "ready", hit = false, attackZone = null, scale = 1 }) {
  const fl = facing === "left" ? -1 : 1;
  const shinaiAngle = pose === "attack"
    ? (attackZone === "head" ? -80 : attackZone === "wrist" ? -30 : attackZone === "waist" ? 35 : -5)
    : pose === "hit" ? -25 : -12;
  const bodyX = pose === "attack" ? fl * 10 : pose === "hit" ? fl * -6 : 0;
  const bodyY = pose === "attack" ? -4 : pose === "hit" ? 3 : 0;

  return (
    <svg viewBox="0 0 120 300" width={90 * scale} height={225 * scale} style={{
      transform: `scaleX(${fl})`,
      filter: hit ? "brightness(2.2) drop-shadow(0 0 18px rgba(255,220,80,0.9))" : "drop-shadow(1px 3px 6px rgba(0,0,0,0.4))",
      transition: "filter 0.12s",
    }}>
      <defs>
        <linearGradient id="hk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d1b3a"/><stop offset="50%" stopColor="#152852"/><stop offset="100%" stopColor="#0d1b3a"/>
        </linearGradient>
        <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a2200"/><stop offset="50%" stopColor="#962c00"/><stop offset="100%" stopColor="#5a1800"/>
        </linearGradient>
        <linearGradient id="sb" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#a08050"/><stop offset="60%" stopColor="#d4b876"/><stop offset="100%" stopColor="#e8d8a8"/>
        </linearGradient>
      </defs>
      <g transform={`translate(${bodyX},${bodyY})`} style={{transition:"transform 0.16s ease-out"}}>
        {/* Feet */}
        <ellipse cx="50" cy="292" rx="11" ry="5" fill="#1a1a2e" opacity=".7"/>
        <ellipse cx="70" cy="295" rx="11" ry="5" fill="#1a1a2e" opacity=".7"/>
        {/* Hakama */}
        <path d="M32,155 Q28,220 24,288 Q45,298 60,295 Q75,298 96,288 Q92,220 88,155Z" fill="url(#hk)"/>
        {[38,46,54,60,68,76].map((x,i)=><line key={i} x1={x} y1="158" x2={x+(i<3?-3:3)} y2="290" stroke="rgba(0,0,0,.15)" strokeWidth=".8"/>)}
        {/* Obi */}
        <rect x="34" y="148" width="52" height="10" rx="2" fill="#1a1535"/>
        {/* Tare */}
        {[0,1,2,3,4].map(i=><rect key={i} x={36+i*9} y="155" width={i===2?12:9} height="23" rx="1" fill="#1a1535" stroke="#2a2050" strokeWidth=".5"/>)}
        {/* Keikogi */}
        <path d="M36,85 L32,150 L88,150 L84,85Z" fill="#0d1b3a"/>
        <path d="M36,88 L18,105 L22,118 L38,108Z" fill="#0d1b3a"/>
        <path d="M84,88 L102,105 L98,118 L82,108Z" fill="#0d1b3a"/>
        {/* Do */}
        <path d="M36,88 Q34,95 36,145 L84,145 Q86,95 84,88 Q72,82 60,82 Q48,82 36,88Z" fill="#1a1535" stroke="#3a2a5a" strokeWidth=".8"/>
        <path d="M40,93 Q39,98 40,140 L80,140 Q81,98 80,93 Q70,88 60,88 Q50,88 40,93Z" fill="url(#dg)" opacity=".85"/>
        <path d="M38,88 Q60,82 82,88 L82,96 Q60,90 38,96Z" fill="#1a1535"/>
        {/* Do himo */}
        <line x1="40" y1="90" x2="28" y2="78" stroke="#3a2a5a" strokeWidth="1.5"/>
        <line x1="80" y1="90" x2="92" y2="78" stroke="#3a2a5a" strokeWidth="1.5"/>
        {/* Kote */}
        <path d="M18,108 Q14,112 16,125 Q18,130 24,130 Q28,128 28,118 L26,108Z" fill="#1a1535"/>
        <path d="M92,108 Q96,112 94,125 Q92,130 86,130 Q82,128 82,118 L84,108Z" fill="#1a1535"/>
        {/* Men */}
        <path d="M38,40 Q36,50 38,78 Q48,84 60,84 Q72,84 82,78 Q84,50 82,40 Q72,32 60,32 Q48,32 38,40Z" fill="#1a1030" stroke="#3a2a5a" strokeWidth=".8"/>
        <ellipse cx="60" cy="36" rx="22" ry="8" fill="#2a2040"/>
        {[0,1,2,3,4,5,6,7,8].map(i=><line key={i} x1="42" y1={44+i*3.5} x2="78" y2={44+i*3.5} stroke="#4a3a6a" strokeWidth="1"/>)}
        <path d="M46,78 L44,86 Q52,90 60,90 Q68,90 76,86 L74,78Z" fill="#1a1535"/>
        <path d="M38,48 Q26,55 18,70 Q16,78 20,82" fill="none" stroke="#2a2050" strokeWidth="2"/>
        <path d="M82,48 Q94,55 102,70 Q104,78 100,82" fill="none" stroke="#2a2050" strokeWidth="2"/>
        {/* Shinai */}
        <g transform={`rotate(${shinaiAngle},90,118)`} style={{transition:"transform .14s ease-out"}}>
          <line x1="90" y1="118" x2="155" y2="58" stroke="url(#sb)" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="95" cy="115" r="4.5" fill="#6b4e1b"/>
          <rect x="150" y="55" width="8" height="4" rx="2" fill="#f5f0e0" transform="rotate(-37,154,57)"/>
          <line x1="85" y1="121" x2="92" y2="117" stroke="#2a1a0a" strokeWidth="4" strokeLinecap="round"/>
        </g>
      </g>
    </svg>
  );
}

/* ── Referee SVG ── */
function Ref({ pos, flagUp, color = "red" }) {
  const styles = {
    left: { position: "absolute", left: 6, top: "42%", transform: "translateY(-50%)" },
    right: { position: "absolute", right: 6, top: "42%", transform: "translateY(-50%)" },
    main: { position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)" },
  };
  return (
    <div style={styles[pos]}>
      <svg viewBox="0 0 40 70" width={pos === "main" ? 26 : 20} height={pos === "main" ? 45 : 35}>
        <circle cx="20" cy="10" r="6" fill="#d4a574"/>
        <path d="M13,8 Q15,3 20,3 Q25,3 27,8" fill="#2a1a0a"/>
        <path d="M10,16 L8,44 L32,44 L30,16 Q25,13 20,13 Q15,13 10,16Z" fill="#f0f0f0"/>
        <rect x="19" y="16" width="2" height="14" rx=".5" fill="#8b1a1a"/>
        <path d="M10,44 L8,66 L18,66 L20,48 L22,66 L32,66 L30,44Z" fill="#2a2a2a"/>
        <line x1="10" y1="19" x2="2" y2="34" stroke="#f0f0f0" strokeWidth="3" strokeLinecap="round"/>
        <line x1="30" y1="19" x2="38" y2="34" stroke="#f0f0f0" strokeWidth="3" strokeLinecap="round"/>
        {/* Red flag */}
        <line x1="2" y1="35" x2="2" y2="14" stroke="#8b6914" strokeWidth="1"/>
        <rect x="-4" y={flagUp && color==="red"? 4 : 16} width="10" height="7" rx=".5"
          fill="#E53935" opacity={flagUp && color==="red"? 1 : .35}
          style={{transition:"all .3s"}}/>
        {/* White flag */}
        <line x1="38" y1="35" x2="38" y2="14" stroke="#8b6914" strokeWidth="1"/>
        <rect x="34" y={flagUp && color==="white"? 4 : 16} width="10" height="7" rx=".5"
          fill="#f0f0f0" stroke="#ccc" strokeWidth=".3"
          opacity={flagUp && color==="white"? 1 : .35}
          style={{transition:"all .3s"}}/>
      </svg>
    </div>
  );
}

/* ── Court ── */
function Court({ children, h = 340 }) {
  return (
    <div style={{
      position: "relative", width: "100%", height: h,
      background: `linear-gradient(180deg,#c8a472 0%,${C.floor} 20%,${C.floor} 80%,#c8a472 100%)`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: "inset 0 0 30px rgba(0,0,0,.2), 0 4px 16px rgba(0,0,0,.3)",
    }}>
      {Array.from({length:16}).map((_,i)=>(
        <div key={i} style={{position:"absolute",top:0,bottom:0,left:`${(i+1)*6}%`,width:1,background:"rgba(139,107,66,.22)"}}/>
      ))}
      <div style={{position:"absolute",top:14,left:14,right:14,bottom:14,border:`2.5px solid ${C.floorLine}`,borderRadius:2}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",width:90,height:55,border:"1.5px solid rgba(255,255,255,.18)",borderRadius:"50%",transform:"translate(-50%,-50%)"}}/>
      <div style={{position:"absolute",top:"50%",left:"33%",width:22,height:2.5,marginTop:-1,background:C.floorLine,borderRadius:1}}/>
      <div style={{position:"absolute",top:"50%",right:"33%",width:22,height:2.5,marginTop:-1,background:C.floorLine,borderRadius:1}}/>
      {children}
    </div>
  );
}

/* ── Seme Pressure Bar ── */
function SemeBar({ value }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 0"}}>
      <span style={{fontSize:9,color:C.accentBright,width:28}}>상대</span>
      <div style={{flex:1,height:6,borderRadius:3,background:C.surfaceAlt,position:"relative",overflow:"hidden"}}>
        <div style={{
          position:"absolute",top:0,bottom:0,left:0,
          width:`${value*100}%`,
          background: value > 0.65 ? C.brass : value < 0.35 ? C.accentBright : C.paperDim,
          borderRadius:3, transition:"width .3s, background .3s",
        }}/>
        <div style={{position:"absolute",top:-2,bottom:-2,left:"50%",width:1,background:"rgba(255,255,255,.3)"}}/>
      </div>
      <span style={{fontSize:9,color:C.brass,width:28,textAlign:"right"}}>나</span>
    </div>
  );
}

export default function Battle() {
  const { studentId } = useParams();
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
  const timerRef = useRef(null);
  const logRef = useRef(null);

  const startBattle = useCallback(async () => {
    setPhase("countdown"); setCountdown(3);
    const info = await api.battleStart({ student_id: Number(studentId), opponent_type: "ai" });
    setState(s => ({ ...s, ...info, score: info.score || { player: 0, opponent: 0 } }));
    setTimeLeft(TIME_LIMIT);
    setLastResult(null);
    setEventLog([]);
    setPlayerPose("ready"); setOpponentPose("ready");
    setFlags(null); setKiai(false);
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

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [eventLog]);

  async function doAction(action, zone = null, kamae = null) {
    if (phase !== "fight") return;

    const res = await api.battleAction(Number(studentId), {
      action, zone, kiai, kamae_change: kamae,
    });

    setState(s => ({ ...s, ...res }));
    setLastResult(res);

    const newEvents = [];
    if (res.player_event) newEvents.push({ side: "player", text: res.player_event });
    if (res.opponent_event) newEvents.push({ side: "opponent", text: res.opponent_event });
    setEventLog(prev => [...prev.slice(-20), ...newEvents]);

    if (action === "strike") {
      playSound("fumikomi");
      setAttackZone(zone);
      setPlayerPose("attack");
      setTimeout(() => setPlayerPose("ready"), 500);

      if (res.player_ippon?.ippon) {
        playSound("hit");
        setOpponentHit(true); setShake(true);
        setFlags(res.flags_player);
        setTimeout(() => { setOpponentHit(false); setShake(false); }, 400);
        setTimeout(() => setFlags(null), 2500);
      }
    }

    if (action === "seme") playSound("shinai");

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
        setTimeout(() => setOpponentPose("ready"), 500);
      }, 300);
    }

    if (res.finished) {
      clearInterval(timerRef.current);
      setTimeout(() => setPhase("result"), 1500);
      await api.battleFinish(Number(studentId)).catch(() => {});
    }

    if (kiai) { playSound("kiai"); setKiai(false); }
  }

  /* ── Countdown ── */
  if (phase === "countdown") {
    const labels = ["始め!", "構え!", "礼!"];
    return (
      <div style={{ padding: "12px 0" }}>
        <Court h={380}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translateY(-55%) translateX(-100px)"}}>
            <Fighter facing="right" scale={1.1}/>
          </div>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translateY(-55%) translateX(10px)"}}>
            <Fighter facing="left" scale={1.1}/>
          </div>
          <Ref pos="left"/> <Ref pos="right"/> <Ref pos="main"/>
          <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.35)"}}>
            <p key={countdown} style={{fontFamily:"serif",fontSize:52,fontWeight:900,color:countdown===0?C.brass:"#fff",textShadow:`0 0 40px ${countdown===0?C.brass:"rgba(255,255,255,.4)"}`,animation:"hitPop .6s ease-out"}}>
              {countdown > 0 ? labels[countdown-1] : "始め!"}
            </p>
          </div>
        </Court>
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
        <Court h={300}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translateY(-55%) translateX(-90px)"}}>
            <Fighter facing="right"/><p style={{textAlign:"center",fontSize:11,color:"#5a4a30",fontWeight:600,marginTop:4}}>나</p>
          </div>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translateY(-55%) translateX(10px)"}}>
            <Fighter facing="left"/><p style={{textAlign:"center",fontSize:11,color:"#5a4a30",fontWeight:600,marginTop:4}}>AI</p>
          </div>
          <Ref pos="left"/> <Ref pos="right"/> <Ref pos="main"/>
        </Court>
        <div style={{marginTop:14,padding:14,borderRadius:12,background:C.surface,border:`1px solid ${C.line}`}}>
          <p style={{fontSize:13,fontWeight:700,color:C.paper,marginBottom:8}}>시합 규칙</p>
          <div style={{display:"flex",flexDirection:"column",gap:5,fontSize:12,color:C.paperDim}}>
            <span>• 삼본승부 (3심제) — 2본 선취 승리</span>
            <span>• 기검체일치: 거리 + 기합 + 잔심 모두 충족해야 유효</span>
            <span>• 세메(칼끝 교란)로 상대 빈틈을 만들어라</span>
            <span>• 심판 2명 이상 깃발 → 한판 인정</span>
          </div>
        </div>
        <button onClick={startBattle} style={{width:"100%",padding:"16px 0",marginTop:14,borderRadius:12,fontSize:15,fontWeight:700,background:`linear-gradient(135deg,${C.accent} 0%,#7A2E22 100%)`,color:C.paper,border:"none",cursor:"pointer",boxShadow:`0 4px 20px rgba(155,58,44,.4)`}}>
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
        <div style={{textAlign:"center",padding:"24px 0",marginBottom:12,borderRadius:16,background:won?"rgba(195,163,95,.08)":lost?"rgba(225,68,48,.06)":"rgba(155,148,133,.06)"}}>
          <p style={{fontFamily:"serif",fontSize:52,fontWeight:900,color:won?C.brass:lost?C.accentBright:C.paperDim,textShadow:won?`0 0 40px rgba(195,163,95,.5)`:"none"}}>
            {won?"勝利":lost?"敗北":"引分"}
          </p>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:20,marginTop:8}}>
            <div><p style={{fontSize:10,color:C.paperDim}}>나</p><p style={{fontFamily:"serif",fontSize:28,fontWeight:700,color:C.paper}}>{state.score.player}</p></div>
            <span style={{fontSize:18,color:C.paperDim}}>—</span>
            <div><p style={{fontSize:10,color:C.paperDim}}>상대</p><p style={{fontFamily:"serif",fontSize:28,fontWeight:700,color:C.paper}}>{state.score.opponent}</p></div>
          </div>
        </div>
        <Court h={260}>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translateY(-55%) translateX(-90px)"}}>
            <Fighter facing="right" pose={won?"attack":"ready"} attackZone="head"/>
          </div>
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translateY(-55%) translateX(10px)"}}>
            <Fighter facing="left" pose={lost?"attack":won?"hit":"ready"} attackZone="head" hit={won}/>
          </div>
          <Ref pos="left" flagUp={won} color="red"/>
          <Ref pos="right" flagUp={won} color="red"/>
          <Ref pos="main" flagUp={won} color="red"/>
        </Court>
        {eventLog.length > 0 && (
          <div style={{marginTop:12,padding:12,borderRadius:12,background:C.surface,border:`1px solid ${C.line}`,maxHeight:150,overflow:"auto"}}>
            <p style={{fontSize:12,fontWeight:700,color:C.paper,marginBottom:6}}>시합 기록</p>
            {eventLog.map((e,i) => (
              <p key={i} style={{fontSize:11,color:e.side==="player"?C.paper:C.accentBright,padding:"2px 0",borderBottom:`1px solid ${C.line}`}}>
                {e.side==="player"?"▸ ":"◂ "}{e.text}
              </p>
            ))}
          </div>
        )}
        <button onClick={() => setPhase("ready")} style={{width:"100%",padding:"16px 0",marginTop:14,borderRadius:12,fontSize:15,fontWeight:700,background:C.accent,color:C.paper,border:"none",cursor:"pointer"}}>
          다시 시합
        </button>
      </div>
    );
  }

  /* ── Fight ── */
  const dist = state.distance;
  const opening = state.opening_zone;
  const canStrike = dist === "issoku" || dist === "tsuba";

  // Fighter gap based on distance
  const gapPx = dist === "far" ? 30 : dist === "issoku" ? -10 : -40;

  return (
    <div style={{transform:shake?`translate(${Math.random()>0.5?4:-4}px,${Math.random()>0.5?2:-2}px)`:"none",transition:"transform .05s"}}>
      {/* HUD */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",marginBottom:2}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <span style={{fontSize:10,color:C.paperDim}}>나</span>
          {[0,1].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:i<state.score.player?C.accent:"transparent",border:`2px solid ${i<state.score.player?C.accent:C.line}`,boxShadow:i<state.score.player?`0 0 6px ${C.accent}`:"none",transition:"all .3s"}}/>)}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:9,color:C.brass,fontWeight:700}}>{DIST_LABELS[dist]}</span>
          <div style={{width:42,height:42,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",border:`2.5px solid ${timeLeft<=10?C.accentBright:C.brass}`,color:timeLeft<=10?C.accentBright:C.brass,fontFamily:"monospace",fontSize:17,fontWeight:800,background:timeLeft<=10?"rgba(225,68,48,.1)":"transparent"}}>
            {timeLeft}
          </div>
          <span style={{fontSize:9,color:C.paperDim}}>{KAMAE_LABELS[state.opponent_kamae]}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          {[0,1].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:i<state.score.opponent?C.accentBright:"transparent",border:`2px solid ${i<state.score.opponent?C.accentBright:C.line}`,boxShadow:i<state.score.opponent?`0 0 6px ${C.accentBright}`:"none",transition:"all .3s"}}/>)}
          <span style={{fontSize:10,color:C.paperDim}}>상대</span>
        </div>
      </div>

      {/* Seme Pressure */}
      <SemeBar value={state.seme_pressure}/>

      {/* Court */}
      <Court h={280}>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:`translateY(-55%) translateX(${-100+gapPx}px)`,transition:"transform .4s ease"}}>
          <Fighter facing="right" pose={playerPose} hit={playerHit} attackZone={attackZone} scale={1.1}/>
        </div>
        <div style={{position:"absolute",top:"50%",left:"50%",transform:`translateY(-55%) translateX(${10-gapPx}px)`,transition:"transform .4s ease"}}>
          <Fighter facing="left" pose={opponentPose} hit={opponentHit} attackZone={lastResult?.opponent_zone} scale={1.1}/>
          {opening && (
            <div style={{position:"absolute",top:opening==="head"?"5%":opening==="wrist"?"42%":opening==="waist"?"55%":"32%",left:"25%",fontSize:20,color:C.accentBright,animation:"pulse .5s ease-in-out infinite",textShadow:`0 0 10px ${C.accentBright}`}}>❗</div>
          )}
        </div>
        <Ref pos="left" flagUp={!!flags} color="red"/>
        <Ref pos="right" flagUp={!!flags && flags[1]} color="red"/>
        <Ref pos="main" flagUp={!!flags && flags[2]} color="red"/>

        {/* Flags overlay */}
        {flags && (
          <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",display:"flex",gap:8,animation:"fadeIn .2s"}}>
            {flags.map((f,i)=>(
              <div key={i} style={{width:20,height:14,borderRadius:2,background:f?"#E53935":"rgba(255,255,255,.2)",border:"1px solid rgba(255,255,255,.3)",transition:"all .3s"}}/>
            ))}
          </div>
        )}
      </Court>

      {/* Event log */}
      <div ref={logRef} style={{height:50,overflow:"auto",padding:"4px 0",marginBottom:4}}>
        {eventLog.slice(-3).map((e,i) => (
          <p key={i} style={{fontSize:11,color:e.side==="player"?C.paper:C.accentBright,margin:"1px 0",animation:"fadeIn .2s"}}>
            {e.side==="player"?"▸ ":"◂ "}{e.text}
          </p>
        ))}
      </div>

      {/* Controls */}
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {/* Row 1: Distance + Seme */}
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>doAction("advance")} disabled={dist==="tsuba"} style={{...btnStyle,flex:1,opacity:dist==="tsuba"?.4:1}}>
            <span style={{fontSize:14}}>⇧</span><span style={{fontSize:10}}>전진</span>
          </button>
          <button onClick={()=>doAction("seme")} disabled={dist==="far"} style={{...btnStyle,flex:2,background:canStrike?"rgba(195,163,95,.1)":C.surfaceAlt,borderColor:canStrike?C.brass:C.line,opacity:dist==="far"?.4:1}}>
            <span style={{fontSize:13,color:C.brass,fontWeight:700}}>세메 (칼끝 교란)</span>
          </button>
          <button onClick={()=>doAction("retreat")} disabled={dist==="far"} style={{...btnStyle,flex:1,opacity:dist==="far"?.4:1}}>
            <span style={{fontSize:14}}>⇩</span><span style={{fontSize:10}}>후퇴</span>
          </button>
        </div>

        {/* Row 2: Kiai toggle */}
        <button onClick={()=>{setKiai(!kiai);if(!kiai)playSound("kiai");}} style={{
          ...btnStyle, width:"100%",
          background: kiai ? "rgba(195,163,95,.15)" : C.surfaceAlt,
          borderColor: kiai ? C.brass : C.line,
        }}>
          <span style={{fontSize:13,fontWeight:700,color:kiai?C.brass:C.paperDim}}>
            {kiai ? "🔥 기합 ON — 격자 시 유효타 조건 충족" : "기합 (탭하여 활성화)"}
          </span>
        </button>

        {/* Row 3: Strike zones */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {ZONES.map(z => {
            const isOpening = opening === z.key;
            const disabled = !canStrike;
            return (
              <button key={z.key} onClick={()=>doAction("strike",z.key)} disabled={disabled}
                style={{
                  ...btnStyle,
                  opacity: disabled ? .35 : 1,
                  background: isOpening ? "rgba(195,163,95,.12)" : C.surfaceAlt,
                  borderColor: isOpening ? C.brass : C.line,
                  boxShadow: isOpening ? `0 0 12px rgba(195,163,95,.2)` : "none",
                  padding: "14px 0",
                }}
                onPointerDown={e=>{if(!disabled){e.currentTarget.style.transform="scale(.93)";e.currentTarget.style.background="rgba(155,58,44,.15)";}}}
                onPointerUp={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background=isOpening?"rgba(195,163,95,.12)":C.surfaceAlt;}}
                onPointerLeave={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.background=isOpening?"rgba(195,163,95,.12)":C.surfaceAlt;}}
              >
                {isOpening && <span style={{position:"absolute",top:3,right:6,fontSize:9,color:C.brass,fontWeight:700,animation:"pulse .5s ease-in-out infinite"}}>빈틈!</span>}
                <span style={{fontFamily:"serif",fontSize:22,fontWeight:800,color:C.brass}}>{z.kanji}</span>
                <span style={{fontSize:10,color:C.paperDim}}>{z.label}</span>
              </button>
            );
          })}
        </div>

        {/* Row 4: Kamae + push_out */}
        <div style={{display:"flex",gap:6}}>
          {Object.entries(KAMAE_LABELS).map(([k,v])=>(
            <button key={k} onClick={()=>doAction("wait",null,k)} style={{
              ...btnStyle, flex:1,
              background: state.player_kamae===k ? "rgba(195,163,95,.1)" : C.surfaceAlt,
              borderColor: state.player_kamae===k ? C.brass : C.line,
            }}>
              <span style={{fontSize:12,fontWeight:600,color:state.player_kamae===k?C.brass:C.paperDim}}>{v}</span>
            </button>
          ))}
          {dist === "tsuba" && (
            <button onClick={()=>doAction("push_out")} style={{...btnStyle,flex:1}}>
              <span style={{fontSize:11,color:C.paper}}>밀어내기</span>
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

const btnStyle = {
  position: "relative",
  background: C.surfaceAlt,
  border: `1.5px solid ${C.line}`,
  borderRadius: 10,
  padding: "10px 0",
  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  cursor: "pointer",
  transition: "all .15s ease",
  color: C.paper,
};
