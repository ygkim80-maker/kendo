import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

const API = "http://localhost:8000";

const ZONE_META = {
  head:   { kanji: "面",   label: "머리",  color: "#4FC3F7" },
  wrist:  { kanji: "小手", label: "손목",  color: "#81C784" },
  waist:  { kanji: "胴",   label: "허리",  color: "#FFB74D" },
  thrust: { kanji: "突",   label: "찌름",  color: "#F06292" },
};

const ZONE_HIT_POS = { head:[0,-70], wrist:[30,-18], waist:[0,10], thrust:[35,-14] };

// ─── improved chibi (scale ~1.5x bigger) ─────────────────────────────────
function drawChibi(ctx, cx, cy, opts) {
  const { flip=false, strikeZone=null, hitZone=null, activeZone=null,
          semeShake=0, isHit=false, kamae="chudan" } = opts;

  ctx.save();
  if (flip) { ctx.translate(cx*2,0); ctx.scale(-1,1); }
  ctx.translate(cx + semeShake*(Math.random()-0.5)*7, cy);

  // glow on hit
  if (isHit) { ctx.shadowColor = hitZone ? ZONE_META[hitZone].color : "#FF5252"; ctx.shadowBlur=40; }

  const bodyBase = isHit ? "#FF5252" : "#5C6BC0";
  const dark = isHit ? "#B71C1C" : "#1A237E";

  // ── LEGS ──
  ctx.fillStyle = "#2a2a2a";
  // left leg
  ctx.beginPath();
  ctx.roundRect(-16, 44, 13, 40, 4);
  ctx.fill();
  // right leg
  ctx.beginPath();
  ctx.roundRect(3, 44, 13, 40, 4);
  ctx.fill();
  // tabi (foot)
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.ellipse(-10, 84, 9, 5, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(10, 84, 9, 5, 0, 0, Math.PI*2); ctx.fill();

  // ── HAKAMA (skirt) ──
  const hg = ctx.createLinearGradient(-20,24,20,24);
  hg.addColorStop(0, dark); hg.addColorStop(0.5,"#283593"); hg.addColorStop(1,dark);
  ctx.fillStyle = hg;
  ctx.beginPath();
  ctx.moveTo(-20,24); ctx.lineTo(20,24);
  ctx.lineTo(26,84); ctx.lineTo(-26,84); ctx.closePath();
  ctx.fill();
  // hakama center pleat line
  ctx.strokeStyle="rgba(255,255,255,0.15)"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,24); ctx.lineTo(0,84); ctx.stroke();

  // ── DO (chest armor) ──
  const waistHL = hitZone==="waist"||activeZone==="waist";
  const doG = ctx.createLinearGradient(-18,4,18,4);
  if (waistHL) { doG.addColorStop(0,ZONE_META.waist.color); doG.addColorStop(1,"#fff"); }
  else { doG.addColorStop(0,"#E65100"); doG.addColorStop(0.5,"#FF8F00"); doG.addColorStop(1,"#E65100"); }
  ctx.fillStyle = doG;
  ctx.beginPath(); ctx.roundRect(-18, 4, 36, 22, 3); ctx.fill();
  // do horizontal lines
  ctx.strokeStyle = waistHL ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1.5;
  for (let y=8; y<=20; y+=6) {
    ctx.beginPath(); ctx.moveTo(-17,y); ctx.lineTo(17,y); ctx.stroke();
  }
  if (waistHL) {
    ctx.strokeStyle="#fff"; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.roundRect(-18,4,36,22,3); ctx.stroke();
  }

  // ── BODY ──
  const bodyG = ctx.createLinearGradient(-16,-28,16,-28);
  bodyG.addColorStop(0, bodyBase); bodyG.addColorStop(1, "#3949AB");
  ctx.fillStyle = bodyG;
  ctx.beginPath(); ctx.roundRect(-16,-28,32,34,3); ctx.fill();

  // ── KOTE (wrist armor) based on pose ──
  const wristHL = hitZone==="wrist"||activeZone==="wrist";
  const koteCol = wristHL ? ZONE_META.wrist.color : "#388E3C";
  const koteHL  = wristHL ? "#fff" : "#2E7D32";

  function drawKote(ax,ay,w,h) {
    const kg = ctx.createLinearGradient(ax,ay,ax+w,ay);
    kg.addColorStop(0,koteHL); kg.addColorStop(1,koteCol);
    ctx.fillStyle=kg;
    ctx.beginPath(); ctx.roundRect(ax,ay,w,h,3); ctx.fill();
    if(wristHL){ctx.strokeStyle="#fff";ctx.lineWidth=2;ctx.strokeRect(ax,ay,w,h);}
  }

  if (strikeZone==="head") {
    drawKote(-8,-80,16,52);  // arms raised high
    drawKote(-16,-84,20,12);
  } else if (strikeZone==="wrist") {
    drawKote(12,-22,38,10);  // arm forward-down
    drawKote(44,-16,12,14);
  } else if (strikeZone==="waist") {
    drawKote(12,-8,36,10);   // arm swings to side
    drawKote(42,-4,12,14);
  } else if (strikeZone==="thrust") {
    drawKote(14,-20,46,10);  // straight forward
    drawKote(54,-22,12,14);
  } else {
    drawKote(-30,-20,13,10); // guard position
    drawKote(17,-20,13,10);
  }

  // ── HEAD / MEN (helmet) ──
  const headHL = hitZone==="head"||activeZone==="head";
  // neck
  ctx.fillStyle="#FFCCBC"; ctx.fillRect(-7,-30,14,8);
  // helmet dome
  const domeG = ctx.createRadialGradient(-4,-52,2,0,-44,22);
  domeG.addColorStop(0, headHL?ZONE_META.head.color:"#546E7A");
  domeG.addColorStop(1, headHL?"#01579B":"#263238");
  ctx.fillStyle = domeG;
  ctx.beginPath(); ctx.arc(0,-48,22,Math.PI,0); ctx.fill();
  // helmet base
  ctx.fillStyle = headHL ? ZONE_META.head.color : "#37474F";
  ctx.fillRect(-22,-48,44,20);
  // menbu (face guard bars)
  ctx.strokeStyle = headHL?"#fff":"#90A4AE";
  ctx.lineWidth = headHL?2.5:2;
  for(let i=-14; i<=14; i+=7) {
    ctx.beginPath(); ctx.moveTo(i,-48); ctx.lineTo(i,-28); ctx.stroke();
  }
  // bottom of men
  ctx.fillStyle = headHL?"rgba(79,195,247,0.3)":"rgba(0,0,0,0.2)";
  ctx.fillRect(-22,-30,44,2);
  // helmet outline
  ctx.strokeStyle = headHL?"#fff":"#1C313A"; ctx.lineWidth=2.5;
  ctx.beginPath(); ctx.arc(0,-48,22,Math.PI,0); ctx.stroke();
  ctx.strokeRect(-22,-48,44,20);

  // ── SHINAI (longer, with tsuba) ──
  const thrustHL = hitZone==="thrust"||activeZone==="thrust";
  const shinaiCol = thrustHL ? ZONE_META.thrust.color : "#8D6E63";
  ctx.lineCap="round";

  let sx1,sy1,sx2,sy2, tsubaX,tsubaY;
  if (strikeZone==="head") {
    sx1=0; sy1=-82; sx2=0; sy2=-150; tsubaX=-5; tsubaY=-86;
  } else if (strikeZone==="wrist") {
    sx1=46; sy1=-14; sx2=110; sy2=24; tsubaX=42; tsubaY=-18;
  } else if (strikeZone==="waist") {
    sx1=44; sy1=0; sx2=108; sy2=34; tsubaX=40; tsubaY=-4;
  } else if (strikeZone==="thrust") {
    sx1=56; sy1=-14; sx2=126; sy2=-14; tsubaX=52; tsubaY=-18;
  } else if (kamae==="jodan") {
    sx1=10; sy1=-30; sx2=50; sy2=-110; tsubaX=6; tsubaY=-33;
  } else {
    const ey = kamae==="gedan"?-10:-75;
    sx1=14; sy1=-14; sx2=58; sy2=ey; tsubaX=10; tsubaY=-17;
  }

  // shinai body (gradient from tsuba to tip)
  const sg = ctx.createLinearGradient(sx1,sy1,sx2,sy2);
  sg.addColorStop(0,"#6D4C41"); sg.addColorStop(0.5,thrustHL?ZONE_META.thrust.color:"#A1887F"); sg.addColorStop(1,"#D7CCC8");
  ctx.strokeStyle = sg; ctx.lineWidth = thrustHL?6:5;
  ctx.beginPath(); ctx.moveTo(sx1,sy1); ctx.lineTo(sx2,sy2); ctx.stroke();
  // tsuba (guard circle)
  ctx.fillStyle="#5D4037"; ctx.strokeStyle="#3E2723"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.ellipse(tsubaX+5,tsubaY+5,7,5,Math.atan2(sy2-sy1,sx2-sx1),0,Math.PI*2); ctx.fill(); ctx.stroke();
  // tip highlight
  ctx.fillStyle="#fffde7"; ctx.strokeStyle="#F9A825"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(sx2,sy2,4,0,Math.PI*2); ctx.fill(); ctx.stroke();

  ctx.restore();
}

// ── hit flash ──
function drawHitFlash(ctx, cx, cy, zone, alpha) {
  if (!zone||alpha<=0) return;
  const [dx,dy]=ZONE_HIT_POS[zone]||[0,0];
  const x=cx+dx, y=cy+dy;
  const col=ZONE_META[zone]?.color||"#fff";
  ctx.save();
  const r = 28 + (1-alpha)*22;
  // outer glow ring
  const grad = ctx.createRadialGradient(x,y,r*0.3,x,y,r*1.5);
  grad.addColorStop(0, col+"cc"); grad.addColorStop(1, col+"00");
  ctx.globalAlpha = alpha*0.6;
  ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(x,y,r*1.5,0,Math.PI*2); ctx.fill();
  // burst rays
  ctx.globalAlpha=alpha;
  ctx.fillStyle=col;
  for(let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2, r1=10, r2=r+(1-alpha)*16;
    ctx.beginPath();
    ctx.moveTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);
    ctx.lineTo(x+Math.cos(a+0.18)*r2,y+Math.sin(a+0.18)*r2);
    ctx.lineTo(x+Math.cos(a-0.18)*r2,y+Math.sin(a-0.18)*r2);
    ctx.closePath(); ctx.fill();
  }
  // kanji pop
  ctx.globalAlpha = alpha;
  ctx.fillStyle="#fff";
  ctx.strokeStyle=col; ctx.lineWidth=3;
  ctx.font=`bold ${22+Math.round((1-alpha)*10)}px serif`;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  const ty = y - 44 - (1-alpha)*18;
  ctx.strokeText(ZONE_META[zone]?.kanji||"", x, ty);
  ctx.fillText(ZONE_META[zone]?.kanji||"", x, ty);
  ctx.restore();
}

// ── referee ──
function drawReferee(ctx, x, y, scale=0.7, flagUp=false) {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  // body
  const bg = ctx.createLinearGradient(-10,-24,10,-24);
  bg.addColorStop(0,"#1a1a2e"); bg.addColorStop(1,"#16213e");
  ctx.fillStyle=bg; ctx.fillRect(-10,-24,20,34);
  // head
  ctx.fillStyle="#FFCCBC"; ctx.beginPath(); ctx.arc(0,-32,11,0,Math.PI*2); ctx.fill();
  // hat
  ctx.fillStyle="#111"; ctx.fillRect(-11,-44,22,14); ctx.fillRect(-6,-50,12,8);
  // flag arm
  ctx.strokeStyle=flagUp?"#ef5350":"#fff"; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(8,-18);
  ctx.lineTo(flagUp?28:-4, flagUp?-54:4); ctx.stroke();
  // flag
  ctx.fillStyle=flagUp?"#ef5350":"#fff";
  ctx.beginPath();
  if(flagUp){ctx.moveTo(28,-54);ctx.lineTo(50,-44);ctx.lineTo(30,-32);}
  else{ctx.moveTo(-4,4);ctx.lineTo(16,10);ctx.lineTo(-2,20);}
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ── background elements ──
function drawBg(ctx, W, H) {
  // sky gradient
  const sky = ctx.createLinearGradient(0,0,0,H*0.6);
  sky.addColorStop(0,"#060618"); sky.addColorStop(0.6,"#0d1b4e"); sky.addColorStop(1,"#1a2a6c");
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H*0.6);

  // stars
  ctx.fillStyle="#fff";
  const stars=[[80,30],[160,55],[250,20],[380,45],[500,15],[600,40],[720,25],[850,50],[950,18],[1050,38]];
  for(const [sx,sy] of stars){
    ctx.globalAlpha=0.7+Math.sin(sx)*0.3;
    ctx.beginPath(); ctx.arc(sx,sy,1.2,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  // moon
  ctx.fillStyle="#FFF9C4"; ctx.shadowColor="#FFF176"; ctx.shadowBlur=20;
  ctx.beginPath(); ctx.arc(W-120,50,22,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#0d1b4e"; ctx.shadowBlur=0;
  ctx.beginPath(); ctx.arc(W-110,44,18,0,Math.PI*2); ctx.fill();

  // floor gradient
  const floor=ctx.createLinearGradient(0,H*0.6,0,H);
  floor.addColorStop(0,"#6D4C41"); floor.addColorStop(0.4,"#5D4037"); floor.addColorStop(1,"#3E2723");
  ctx.fillStyle=floor; ctx.fillRect(0,H*0.6,W,H*0.4);

  // wood grain lines
  ctx.strokeStyle="rgba(255,255,255,0.06)"; ctx.lineWidth=1;
  for(let i=0;i<8;i++){
    ctx.beginPath();
    ctx.moveTo(i*(W/7),H*0.6);
    ctx.lineTo(W/2, H*1.1);
    ctx.stroke();
  }

  // court boundary lines
  ctx.strokeStyle="rgba(255,255,255,0.3)"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(0,H*0.6); ctx.lineTo(W,H*0.6); ctx.stroke();
  ctx.strokeStyle="rgba(255,255,255,0.15)";
  ctx.beginPath(); ctx.moveTo(W*0.08,H*0.6); ctx.lineTo(W*0.5,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W*0.92,H*0.6); ctx.lineTo(W*0.5,H); ctx.stroke();

  // center line
  ctx.strokeStyle="rgba(255,255,255,0.2)"; ctx.lineWidth=1; ctx.setLineDash([8,8]);
  ctx.beginPath(); ctx.moveTo(W/2,H*0.6); ctx.lineTo(W/2,H); ctx.stroke();
  ctx.setLineDash([]);
}

function renderScene(canvas, state) {
  const ctx=canvas.getContext("2d");
  const W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);

  drawBg(ctx,W,H);

  // referees
  drawReferee(ctx, 90, H*0.82, 0.75, state.playerScore>0);
  drawReferee(ctx, W/2, H*0.7, 0.65, false);
  drawReferee(ctx, W-90, H*0.82, 0.75, state.oppScore>0);

  // fighters
  const gap = state.distance==="far"?260:state.distance==="issoku"?140:80;
  const baseY = H*0.62;
  const playerX = W/2-gap, oppX = W/2+gap;

  drawChibi(ctx,playerX,baseY,{flip:false,strikeZone:state.playerStrikeZone,
    hitZone:state.hitTarget==="player"?state.hitZone:null,activeZone:state.activeZone,
    semeShake:state.playerSeme?1:0,isHit:state.hitTarget==="player",kamae:state.playerKamae||"chudan"});
  drawChibi(ctx,oppX,baseY,{flip:true,strikeZone:state.oppStrikeZone,
    hitZone:state.hitTarget==="opponent"?state.hitZone:null,
    semeShake:0,isHit:state.hitTarget==="opponent",kamae:"chudan"});

  // shadows under fighters
  ctx.fillStyle="rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(playerX,baseY+86,26,7,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(oppX,baseY+86,26,7,0,0,Math.PI*2); ctx.fill();

  // hit flash
  if(state.flashAlpha>0&&state.hitZone){
    const fx=state.hitTarget==="player"?playerX:oppX;
    drawHitFlash(ctx,fx,baseY,state.hitZone,state.flashAlpha);
  }

  // distance label
  ctx.fillStyle="rgba(255,255,255,0.5)";
  ctx.font="bold 14px sans-serif"; ctx.textAlign="center";
  ctx.fillText({far:"원거리",issoku:"일족일도",tsuba:"코등이"}[state.distance]||"", W/2, H*0.67);
}

function useScene(canvasRef, sceneState) {
  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    renderScene(canvas,sceneState);
  });
}

// ── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function Battle() {
  const { studentId } = useParams();
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({w:960,h:480});

  const [phase,setPhase]=useState("setup");
  const [oppType,setOppType]=useState("ai");
  const [oppId,setOppId]=useState("");
  const [students,setStudents]=useState([]);
  const [oppName,setOppName]=useState("AI 상대");
  const [battle,setBattle]=useState(null);
  const [log,setLog]=useState([]);
  const [holding,setHolding]=useState(null);
  const [activeZone,setActiveZone]=useState(null);
  const [timer,setTimer]=useState(180);
  const [result,setResult]=useState(null);
  const [kiai,setKiai]=useState(false);
  const [kamae,setKamae]=useState("chudan");
  const [flashAlpha,setFlashAlpha]=useState(0);
  const [flashZone,setFlashZone]=useState(null);
  const [flashTarget,setFlashTarget]=useState(null);
  const [playerStrikeZone,setPlayerStrikeZone]=useState(null);
  const [oppStrikeZone,setOppStrikeZone]=useState(null);
  const flashRef=useRef(null);

  // canvas responsive size
  useEffect(()=>{
    function resize(){
      if(!wrapRef.current) return;
      const {width,height}=wrapRef.current.getBoundingClientRect();
      setCanvasSize({w:Math.round(width), h:Math.round(height)});
    }
    resize();
    window.addEventListener("resize",resize);
    return ()=>window.removeEventListener("resize",resize);
  },[]);

  useEffect(()=>{
    fetch(`${API}/api/students`).then(r=>r.json()).then(setStudents).catch(()=>{});
  },[]);

  useEffect(()=>{
    if(phase!=="fighting") return;
    const id=setInterval(()=>{
      setTimer(t=>{if(t<=1){clearInterval(id);handleTimeout();return 0;}return t-1;});
    },1000);
    return ()=>clearInterval(id);
  },[phase]);

  function triggerFlash(zone,target){
    setFlashZone(zone); setFlashTarget(target); setFlashAlpha(1);
    if(flashRef.current) clearInterval(flashRef.current);
    flashRef.current=setInterval(()=>{
      setFlashAlpha(a=>{if(a<=0.06){clearInterval(flashRef.current);return 0;}return a-0.06;});
    },30);
  }

  const sceneState={
    playerScore:battle?.player_score??0, oppScore:battle?.opponent_score??0,
    distance:battle?.distance??"far",
    playerStrikeZone, oppStrikeZone,
    hitZone:flashZone, hitTarget:flashTarget, flashAlpha,
    activeZone, playerSeme:holding==="seme", playerKamae:kamae,
  };
  useScene(canvasRef,sceneState);

  async function startBattle(){
    const body={student_id:parseInt(studentId),opponent_type:oppType,
      opponent_student_id:oppType==="ghost"&&oppId?parseInt(oppId):null};
    const r=await fetch(`${API}/api/battle/start`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    if(!r.ok){alert("시합 시작 실패");return;}
    const data=await r.json();
    setOppName(data.opponent_name); setBattle(data);
    setPhase("fighting"); setTimer(180); setLog([]);
  }

  const sendAction=useCallback(async(action,zone)=>{
    const r=await fetch(`${API}/api/battle/action/${studentId}`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action,zone:zone||null,kiai,kamae_change:null}),
    });
    if(!r.ok) return;
    const data=await r.json();
    if(data.scored) triggerFlash(data.scored_zone||zone||"head", data.scored_by==="player"?"opponent":"player");
    if(data.opp_scored) triggerFlash(data.opp_scored_zone||"head","player");
    if(data.opp_action_zone){ setOppStrikeZone(data.opp_action_zone); setTimeout(()=>setOppStrikeZone(null),400); }
    setBattle(data);
    if(data.log) setLog(prev=>[data.log,...prev].slice(0,10));
    if(data.finished){
      const res=await fetch(`${API}/api/battle/finish/${studentId}`,{method:"POST"});
      const fin=await res.json();
      setResult(fin); setPhase("result");
    }
  },[studentId,kiai]);

  async function handleTimeout(){
    const r=await fetch(`${API}/api/battle/timeout/${studentId}`,{method:"POST"});
    const fin=await r.json();
    setResult(fin); setPhase("result");
  }

  useEffect(()=>{
    if(holding!=="seme") return;
    const id=setInterval(()=>sendAction("seme"),800);
    return ()=>clearInterval(id);
  },[holding,sendAction]);

  function strikeZone(z){
    setPlayerStrikeZone(z); sendAction("strike",z);
    setTimeout(()=>setPlayerStrikeZone(null),380);
  }

  const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const zoneKeys=Object.keys(ZONE_META);

  // ── setup ──
  if(phase==="setup") return(
    <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-4xl font-bold text-yellow-400">⚔️ 시합 설정</h1>
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-lg flex flex-col gap-5">
        <div>
          <label className="block text-sm text-gray-400 mb-2">상대 유형</label>
          <div className="flex gap-3">
            <button onClick={()=>setOppType("ai")} className={`flex-1 py-3 rounded-xl font-bold text-lg ${oppType==="ai"?"bg-blue-600":"bg-gray-700"}`}>AI 대전</button>
            <button onClick={()=>setOppType("ghost")} className={`flex-1 py-3 rounded-xl font-bold text-lg ${oppType==="ghost"?"bg-purple-600":"bg-gray-700"}`}>유령 대전</button>
          </div>
        </div>
        {oppType==="ghost"&&(
          <div>
            <label className="block text-sm text-gray-400 mb-2">상대 선택</label>
            <select value={oppId} onChange={e=>setOppId(e.target.value)} className="w-full bg-gray-700 rounded-xl p-3 text-lg">
              <option value="">-- 선수 선택 --</option>
              {students.filter(s=>s.id!==parseInt(studentId)).map(s=>(
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={startBattle} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl text-2xl mt-2">始 め ！</button>
      </div>
    </div>
  );

  // ── result ──
  if(phase==="result"){
    const won=result?.result==="win", draw=result?.result==="draw";
    return(
      <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
        <div className={`text-8xl font-black ${won?"text-yellow-400":draw?"text-gray-300":"text-red-400"}`}>
          {won?"勝！":draw?"引分":"負"}
        </div>
        <div className="text-3xl font-bold">{won?"승리!":draw?"무승부":"패배..."}</div>
        <div className="text-xl text-gray-300">{result?.score?.player??0} 본 : {result?.score?.opponent??0} 본</div>
        <button onClick={()=>{setPhase("setup");setBattle(null);setResult(null);setTimer(180);}}
          className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl font-bold text-xl mt-4">다시 하기</button>
      </div>
    );
  }

  // ── battle: full-screen landscape layout ──
  return(
    <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">

      {/* ── score bar ── */}
      <div className="flex items-center justify-between px-6 py-2 bg-gray-900 border-b border-gray-800" style={{minHeight:"64px"}}>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm font-semibold">나</span>
          <span className="text-5xl font-black text-yellow-400">{battle?.player_score??0}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-mono font-bold text-red-400">{fmtTime(timer)}</span>
          <span className="text-xs text-gray-500">{battle?.distance==="far"?"원거리":battle?.distance==="issoku"?"일족일도":"코등이"}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-5xl font-black text-red-400">{battle?.opponent_score??0}</span>
          <span className="text-gray-400 text-sm font-semibold">{oppName}</span>
        </div>
      </div>

      {/* ── canvas area ── */}
      <div ref={wrapRef} className="flex-1 relative" style={{minHeight:0}}>
        <canvas ref={canvasRef}
          width={canvasSize.w} height={canvasSize.h}
          style={{width:"100%",height:"100%",display:"block"}}
        />
        {/* log overlay */}
        {log.length>0&&(
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 rounded-lg px-4 py-1 text-xs text-yellow-200 text-center whitespace-nowrap">
            {log[0]}
          </div>
        )}
      </div>

      {/* ── controls bar ── */}
      <div className="bg-gray-900 border-t border-gray-800 px-4 py-3 flex gap-3 items-stretch" style={{height:"160px"}}>

        {/* movement + seme */}
        <div className="flex flex-col gap-2 w-32 flex-shrink-0">
          <button onPointerDown={()=>sendAction("step_in")}
            className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-sm active:scale-95 transition-transform">앞으로 ▶</button>
          <button onPointerDown={()=>sendAction("step_back")}
            className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-sm active:scale-95 transition-transform">◀ 뒤로</button>
          <button onPointerDown={()=>setHolding("seme")} onPointerUp={()=>setHolding(null)} onPointerLeave={()=>setHolding(null)}
            className={`flex-1 rounded-xl font-bold text-sm active:scale-95 transition-transform ${holding==="seme"?"bg-orange-500":"bg-orange-800"}`}>세메 꾹</button>
        </div>

        {/* zone strike buttons — big 2x2 */}
        <div className="flex-1 grid grid-cols-4 gap-2">
          {zoneKeys.map(z=>(
            <button key={z}
              onPointerEnter={()=>setActiveZone(z)}
              onPointerLeave={()=>setActiveZone(null)}
              onPointerDown={()=>strikeZone(z)}
              className="rounded-xl font-bold text-2xl flex flex-col items-center justify-center gap-1 active:scale-90 transition-transform select-none"
              style={{backgroundColor:ZONE_META[z].color+"22",border:`2px solid ${ZONE_META[z].color}`,color:ZONE_META[z].color}}
            >
              <span>{ZONE_META[z].kanji}</span>
              <span className="text-xs font-normal opacity-80">{ZONE_META[z].label}</span>
            </button>
          ))}
        </div>

        {/* kiai + kamae */}
        <div className="flex flex-col gap-2 w-32 flex-shrink-0">
          <button onPointerDown={()=>{setKiai(true);sendAction("kiai");}} onPointerUp={()=>setKiai(false)}
            className="flex-1 bg-red-800 hover:bg-red-700 rounded-xl font-black text-lg active:scale-95 transition-transform">기합！！</button>
          {["chudan","jodan","gedan"].map(k=>(
            <button key={k} onClick={()=>{setKamae(k);sendAction("kamae");}}
              className={`flex-1 rounded-xl text-xs font-bold active:scale-95 transition-transform ${kamae===k?"bg-indigo-600":"bg-gray-700"}`}>
              {k==="chudan"?"中段":k==="jodan"?"上段":"下段"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
