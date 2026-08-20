import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";

const API = "http://localhost:8000";

const ZONE_META = {
  head:   { kanji: "面",   label: "머리",  color: "#4FC3F7" },
  wrist:  { kanji: "小手", label: "손목",  color: "#81C784" },
  waist:  { kanji: "胴",   label: "허리",  color: "#FFB74D" },
  thrust: { kanji: "突",   label: "찌름",  color: "#F06292" },
};

const ZONE_HIT_POS = {
  head:   [0,   -52],
  wrist:  [22,  -14],
  waist:  [0,    8],
  thrust: [28,  -10],
};

function drawChibi(ctx, cx, cy, opts) {
  const { flip=false, strikeZone=null, hitZone=null, activeZone=null,
          semeShake=0, isHit=false, kamae="chudan" } = opts;
  ctx.save();
  if (flip) { ctx.translate(cx*2,0); ctx.scale(-1,1); }
  const shake = semeShake*(Math.random()-0.5)*6;
  ctx.translate(cx+shake, cy);
  if (isHit) { ctx.shadowColor=hitZone?ZONE_META[hitZone]?.color:"#FF5252"; ctx.shadowBlur=35; }

  const bodyCol=isHit?"#FF5252":"#5C6BC0";
  const armorCol=isHit?"#B71C1C":"#1A237E";

  // legs
  ctx.fillStyle="#333";
  ctx.fillRect(-11,30,9,30); ctx.fillRect(2,30,9,30);

  // hakama
  ctx.fillStyle=armorCol;
  ctx.beginPath();
  ctx.moveTo(-15,18); ctx.lineTo(15,18); ctx.lineTo(20,60); ctx.lineTo(-20,60); ctx.closePath();
  ctx.fill();

  // do
  const waistHL=hitZone==="waist"||activeZone==="waist";
  ctx.fillStyle=waistHL?ZONE_META.waist.color:"#FF8F00";
  ctx.fillRect(-14,2,28,18);
  ctx.strokeStyle=waistHL?"#fff":"#E65100"; ctx.lineWidth=waistHL?2.5:1;
  ctx.strokeRect(-14,2,28,18);

  // body
  ctx.fillStyle=bodyCol; ctx.fillRect(-13,-20,26,24);

  // arms & kote
  const wristHL=hitZone==="wrist"||activeZone==="wrist";
  const koteCol=wristHL?ZONE_META.wrist.color:"#558B2F";
  if (strikeZone==="head") {
    ctx.fillStyle=koteCol;
    ctx.fillRect(-6,-58,12,38);
    ctx.fillRect(-14,-62,18,10);
  } else if (strikeZone==="wrist") {
    ctx.fillStyle=koteCol;
    ctx.fillRect(10,-18,30,8); ctx.fillRect(35,-12,10,10);
  } else if (strikeZone==="waist") {
    ctx.fillStyle=koteCol;
    ctx.fillRect(10,-5,28,8); ctx.fillRect(32,0,10,10);
  } else if (strikeZone==="thrust") {
    ctx.fillStyle=koteCol;
    ctx.fillRect(12,-16,36,8); ctx.fillRect(43,-18,10,12);
  } else {
    ctx.fillStyle=koteCol;
    ctx.fillRect(-24,-16,11,8); ctx.fillRect(13,-16,11,8);
  }
  if (wristHL&&!strikeZone) { ctx.strokeStyle="#fff"; ctx.lineWidth=2; ctx.strokeRect(13,-16,11,8); }

  // head/men
  const headHL=hitZone==="head"||activeZone==="head";
  ctx.fillStyle="#FFCCBC"; ctx.fillRect(-6,-24,12,6);
  ctx.fillStyle=headHL?ZONE_META.head.color:"#37474F";
  ctx.beginPath(); ctx.arc(0,-38,18,Math.PI,0); ctx.fillRect(-18,-38,36,16); ctx.fill();
  ctx.strokeStyle=headHL?"#fff":"#90A4AE"; ctx.lineWidth=headHL?2.5:1.5;
  for(let i=-12;i<=12;i+=6){ctx.beginPath();ctx.moveTo(i,-38);ctx.lineTo(i,-22);ctx.stroke();}
  ctx.strokeStyle=headHL?"#fff":"#263238"; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(0,-38,18,Math.PI,0); ctx.stroke();
  ctx.strokeRect(-18,-38,36,16);

  // shinai
  const thrustHL=hitZone==="thrust"||activeZone==="thrust";
  ctx.strokeStyle=thrustHL?ZONE_META.thrust.color:"#8D6E63";
  ctx.lineWidth=thrustHL?5:4; ctx.lineCap="round";
  if (strikeZone==="head") {
    ctx.beginPath(); ctx.moveTo(0,-60); ctx.lineTo(0,-120); ctx.stroke();
    ctx.fillStyle="#5D4037"; ctx.fillRect(-5,-64,10,6);
  } else if (strikeZone==="wrist") {
    ctx.beginPath(); ctx.moveTo(36,-10); ctx.lineTo(95,22); ctx.stroke();
    ctx.fillStyle="#5D4037"; ctx.fillRect(31,-14,8,6);
  } else if (strikeZone==="waist") {
    ctx.beginPath(); ctx.moveTo(34,3); ctx.lineTo(92,32); ctx.stroke();
    ctx.fillStyle="#5D4037"; ctx.fillRect(29,-2,8,6);
  } else if (strikeZone==="thrust") {
    ctx.beginPath(); ctx.moveTo(45,-10); ctx.lineTo(110,-10); ctx.stroke();
    ctx.fillStyle="#5D4037"; ctx.fillRect(40,-14,8,6);
  } else if (kamae==="jodan") {
    ctx.beginPath(); ctx.moveTo(8,-24); ctx.lineTo(44,-98); ctx.stroke();
    ctx.fillStyle="#5D4037"; ctx.fillRect(4,-28,8,6);
  } else {
    const endY=kamae==="gedan"?-8:-65;
    ctx.beginPath(); ctx.moveTo(12,-12); ctx.lineTo(56,endY); ctx.stroke();
    ctx.fillStyle="#5D4037"; ctx.fillRect(8,-16,8,6);
  }
  ctx.restore();
}

function drawHitFlash(ctx, cx, cy, zone, alpha) {
  if (!zone||alpha<=0) return;
  const [dx,dy]=ZONE_HIT_POS[zone]||[0,0];
  const x=cx+dx, y=cy+dy;
  const col=ZONE_META[zone]?.color||"#fff";
  ctx.save();
  ctx.globalAlpha=alpha;
  ctx.strokeStyle=col; ctx.lineWidth=3;
  ctx.beginPath(); ctx.arc(x,y,22+(1-alpha)*20,0,Math.PI*2); ctx.stroke();
  ctx.fillStyle=col;
  for(let i=0;i<8;i++){
    const a2=(i/8)*Math.PI*2;
    const r1=8, r2=22+(1-alpha)*14;
    ctx.beginPath();
    ctx.moveTo(x+Math.cos(a2)*r1, y+Math.sin(a2)*r1);
    ctx.lineTo(x+Math.cos(a2+0.22)*r2, y+Math.sin(a2+0.22)*r2);
    ctx.lineTo(x+Math.cos(a2-0.22)*r2, y+Math.sin(a2-0.22)*r2);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle="#fff";
  ctx.font=`bold ${16+Math.round((1-alpha)*8)}px sans-serif`;
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillText(ZONE_META[zone]?.kanji||"", x, y-36-(1-alpha)*12);
  ctx.restore();
}

function drawReferee(ctx, x, y, scale=0.55, flagUp=false) {
  ctx.save(); ctx.translate(x,y); ctx.scale(scale,scale);
  ctx.fillStyle="#1a1a2e"; ctx.fillRect(-8,-20,16,28);
  ctx.fillStyle="#FFCCBC"; ctx.beginPath(); ctx.arc(0,-28,9,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle=flagUp?"#ef5350":"#eee"; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(0,-15); ctx.lineTo(flagUp?22:20,flagUp?-48:2); ctx.stroke();
  ctx.fillStyle=flagUp?"#ef5350":"#eee";
  ctx.beginPath();
  if(flagUp){ctx.moveTo(22,-48);ctx.lineTo(40,-40);ctx.lineTo(24,-30);}
  else{ctx.moveTo(20,2);ctx.lineTo(36,8);ctx.lineTo(22,16);}
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function renderScene(canvas, state) {
  const ctx=canvas.getContext("2d");
  const W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  const sky=ctx.createLinearGradient(0,0,0,H*0.65);
  sky.addColorStop(0,"#0d0d2b"); sky.addColorStop(1,"#1a1a4e");
  ctx.fillStyle=sky; ctx.fillRect(0,0,W,H*0.65);
  const floor=ctx.createLinearGradient(0,H*0.65,0,H);
  floor.addColorStop(0,"#5D4037"); floor.addColorStop(1,"#3E2723");
  ctx.fillStyle=floor; ctx.fillRect(0,H*0.65,W,H*0.35);
  ctx.strokeStyle="rgba(255,255,255,0.18)"; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(W*0.1,H*0.65); ctx.lineTo(W*0.5,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W*0.9,H*0.65); ctx.lineTo(W*0.5,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,H*0.65); ctx.lineTo(W,H*0.65); ctx.stroke();

  drawReferee(ctx,70,H*0.84,0.55,state.playerScore>0);
  drawReferee(ctx,W/2,H*0.73,0.55,false);
  drawReferee(ctx,W-70,H*0.84,0.55,state.oppScore>0);

  const gap=state.distance==="far"?210:state.distance==="issoku"?110:65;
  const baseY=H*0.63;
  const playerX=W/2-gap, oppX=W/2+gap;

  drawChibi(ctx,playerX,baseY,{flip:false,strikeZone:state.playerStrikeZone,
    hitZone:state.hitTarget==="player"?state.hitZone:null,activeZone:state.activeZone,
    semeShake:state.playerSeme?1:0,isHit:state.hitTarget==="player",kamae:state.playerKamae||"chudan"});
  drawChibi(ctx,oppX,baseY,{flip:true,strikeZone:state.oppStrikeZone,
    hitZone:state.hitTarget==="opponent"?state.hitZone:null,
    semeShake:0,isHit:state.hitTarget==="opponent",kamae:"chudan"});

  if (state.flashAlpha>0&&state.hitZone) {
    const fx=state.hitTarget==="player"?playerX:oppX;
    drawHitFlash(ctx,fx,baseY,state.hitZone,state.flashAlpha);
  }

  ctx.fillStyle="rgba(255,255,255,0.4)";
  ctx.font="12px sans-serif"; ctx.textAlign="center";
  ctx.fillText({far:"원거리",issoku:"일족일도",tsuba:"코등이"}[state.distance]||"",W/2,H*0.69);
}

function useScene(canvasRef, sceneState) {
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas) return;
    renderScene(canvas,sceneState);
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
  const [flashAlpha, setFlashAlpha] = useState(0);
  const [flashZone, setFlashZone] = useState(null);
  const [flashTarget, setFlashTarget] = useState(null);
  const [playerStrikeZone, setPlayerStrikeZone] = useState(null);
  const [oppStrikeZone, setOppStrikeZone] = useState(null);
  const flashRef = useRef(null);

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

  function triggerFlash(zone, target) {
    setFlashZone(zone); setFlashTarget(target); setFlashAlpha(1);
    if(flashRef.current) clearInterval(flashRef.current);
    flashRef.current=setInterval(()=>{
      setFlashAlpha(a=>{if(a<=0.06){clearInterval(flashRef.current);return 0;}return a-0.07;});
    },30);
  }

  const sceneState={
    playerScore:battle?.player_score??0, oppScore:battle?.opponent_score??0,
    distance:battle?.distance??"far",
    playerStrikeZone, oppStrikeZone,
    hitZone:flashZone, hitTarget:flashTarget, flashAlpha,
    activeZone, playerSeme:holding==="seme", playerKamae:kamae,
  };
  useScene(canvasRef, sceneState);

  async function startBattle() {
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
    // flash on score
    if(data.scored){
      triggerFlash(data.scored_zone||zone||"head", data.scored_by==="player"?"opponent":"player");
    }
    if(data.opp_scored){
      triggerFlash(data.opp_scored_zone||"head","player");
    }
    if(data.opp_action_zone){
      setOppStrikeZone(data.opp_action_zone);
      setTimeout(()=>setOppStrikeZone(null),400);
    }
    setBattle(data);
    if(data.log) setLog(prev=>[data.log,...prev].slice(0,12));
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
    setPlayerStrikeZone(z);
    sendAction("strike",z);
    setTimeout(()=>setPlayerStrikeZone(null),380);
  }

  const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const zoneKeys=Object.keys(ZONE_META);

  if(phase==="setup") return(
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold text-yellow-400">⚔️ 시합 설정</h1>
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">상대 유형</label>
          <div className="flex gap-3">
            <button onClick={()=>setOppType("ai")} className={`flex-1 py-2 rounded-lg font-bold ${oppType==="ai"?"bg-blue-600":"bg-gray-700"}`}>AI</button>
            <button onClick={()=>setOppType("ghost")} className={`flex-1 py-2 rounded-lg font-bold ${oppType==="ghost"?"bg-purple-600":"bg-gray-700"}`}>유령 대전</button>
          </div>
        </div>
        {oppType==="ghost"&&(
          <div>
            <label className="block text-sm text-gray-400 mb-1">상대 선택</label>
            <select value={oppId} onChange={e=>setOppId(e.target.value)} className="w-full bg-gray-700 rounded-lg p-2">
              <option value="">-- 선수 선택 --</option>
              {students.filter(s=>s.id!==parseInt(studentId)).map(s=>(
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={startBattle} className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl text-lg mt-2">시작 ！</button>
      </div>
    </div>
  );

  if(phase==="result"){
    const won=result?.result==="win", draw=result?.result==="draw";
    return(
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-6">
        <div className={`text-6xl font-black ${won?"text-yellow-400":draw?"text-gray-300":"text-red-400"}`}>
          {won?"勝！":draw?"引分":"負"}
        </div>
        <div className="text-2xl">{won?"승리!":draw?"무승부":"패배..."}</div>
        <div className="text-lg text-gray-300">{result?.score?.player??0} 본 : {result?.score?.opponent??0} 본</div>
        <button onClick={()=>{setPhase("setup");setBattle(null);setResult(null);setTimer(180);}} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-bold mt-4">다시 하기</button>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-3 gap-3">
      <div className="flex items-center justify-between w-full max-w-3xl bg-gray-800 rounded-xl px-4 py-2">
        <div className="text-center">
          <div className="text-xs text-gray-400">나</div>
          <div className="text-4xl font-black text-yellow-400">{battle?.player_score??0}</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-2xl font-mono font-bold text-red-400">{fmtTime(timer)}</div>
          <div className="text-xs text-gray-400">{battle?.distance==="far"?"원거리":battle?.distance==="issoku"?"일족일도":"코등이"}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400">{oppName}</div>
          <div className="text-4xl font-black text-red-400">{battle?.opponent_score??0}</div>
        </div>
      </div>

      <canvas ref={canvasRef} width={750} height={320}
        className="rounded-xl border border-gray-700 max-w-full"/>

      {log.length>0&&(
        <div className="w-full max-w-3xl bg-gray-800 rounded-xl px-3 py-1 text-xs text-gray-300 h-10 overflow-hidden">
          {log.map((l,i)=><div key={i}>{l}</div>)}
        </div>
      )}

      <div className="w-full max-w-3xl grid grid-cols-2 gap-3">
        <div className="col-span-2 grid grid-cols-4 gap-2">
          {zoneKeys.map(z=>(
            <button key={z}
              onPointerEnter={()=>setActiveZone(z)}
              onPointerLeave={()=>setActiveZone(null)}
              onPointerDown={()=>strikeZone(z)}
              className="py-4 rounded-xl font-bold text-xl active:scale-90 transition-transform select-none"
              style={{backgroundColor:ZONE_META[z].color+"28",border:`2px solid ${ZONE_META[z].color}`,color:ZONE_META[z].color}}
            >
              {ZONE_META[z].kanji}<br/><span className="text-xs font-normal">{ZONE_META[z].label}</span>
            </button>
          ))}
        </div>
        <button onPointerDown={()=>sendAction("step_in")} className="bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold">앞으로 ▶</button>
        <button onPointerDown={()=>sendAction("step_back")} className="bg-gray-700 hover:bg-gray-600 py-3 rounded-xl font-bold">◀ 뒤로</button>
        <button onPointerDown={()=>setHolding("seme")} onPointerUp={()=>setHolding(null)} onPointerLeave={()=>setHolding(null)}
          className={`py-3 rounded-xl font-bold ${holding==="seme"?"bg-orange-500":"bg-orange-800 hover:bg-orange-700"}`}>세메 (꾹)</button>
        <button onPointerDown={()=>{setKiai(true);sendAction("kiai");}} onPointerUp={()=>setKiai(false)}
          className="bg-red-800 hover:bg-red-700 py-3 rounded-xl font-bold">기합 ！！</button>
        <div className="col-span-2 flex gap-2 justify-center">
          {["chudan","jodan","gedan"].map(k=>(
            <button key={k} onClick={()=>{setKamae(k);sendAction("kamae");}}
              className={`px-5 py-2 rounded-lg text-sm font-bold ${kamae===k?"bg-indigo-600":"bg-gray-700"}`}>
              {k==="chudan"?"中段":k==="jodan"?"上段":"下段"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
