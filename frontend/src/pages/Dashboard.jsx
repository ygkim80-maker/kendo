import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Flame, MessageCircle, Sparkles, Trophy, ChevronRight } from "lucide-react";
import { api } from "../hooks/api";

const C = {
  surface: "#1D2433",
  surfaceAlt: "#252E40",
  paper: "#ECE4D3",
  paperDim: "#9B9485",
  brass: "#C3A35F",
  accent: "#9B3A2C",
  line: "rgba(236,228,211,0.10)",
};

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

function ZoneCard({ label, score, delta }) {
  const positive = delta >= 0;
  return (
    <div
      className="flex-1 rounded-xl p-3.5"
      style={{ background: C.surfaceAlt, border: `1px solid ${C.line}` }}
    >
      <div className="flex justify-between items-baseline">
        <span className="text-xs" style={{ color: C.paperDim }}>{label}</span>
        <span className="text-[11px] font-bold" style={{ color: positive ? "#7FA876" : C.accent }}>
          {positive ? "+" : ""}{delta}
        </span>
      </div>
      <p className="font-serif text-2xl font-bold my-1.5" style={{ color: C.paper }}>{score}</p>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(236,228,211,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${score}%`, background: C.accent }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [skills, setSkills] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    Promise.all([
      api.getStudent(studentId),
      api.getAttendance(studentId),
      api.getSkills(studentId),
      api.getFeedback(studentId),
      api.getRanking(),
    ]).then(([s, a, sk, fb, rk]) => {
      setStudent(s);
      setAttendance(a);
      setSkills(sk);
      setFeedback(fb);
      setRanking(rk);
    });
  }, [studentId]);

  if (!student) return <div className="text-center py-10" style={{ color: C.paperDim }}>로딩중...</div>;

  const attendMap = {};
  attendance.forEach((a) => {
    const dow = new Date(a.date).getDay();
    const idx = dow === 0 ? 6 : dow - 1;
    attendMap[idx] = a.present;
  });
  const streakCount = Object.values(attendMap).filter(Boolean).length;

  const zoneMap = { head: "머리", wrist: "손목", waist: "허리", thrust: "찌르기" };
  const zoneOrder = ["head", "wrist", "waist", "thrust"];
  const skillMap = {};
  skills.forEach((s) => { skillMap[s.zone] = s; });

  const monthsJoined = Math.round((Date.now() - new Date(student.join_date).getTime()) / (1000 * 60 * 60 * 24 * 30));

  return (
    <div className="flex flex-col gap-4" style={{ animation: "fadeIn 0.3s ease" }}>
      {/* 등급 헤더 */}
      <div
        className="rounded-xl p-5 flex items-center justify-between"
        style={{ background: C.surface, border: `1px solid ${C.line}` }}
      >
        <div>
          <p className="text-xs" style={{ color: C.paperDim }}>청라도장 · 가입 {monthsJoined}개월</p>
          <p className="font-serif text-lg font-bold mt-1" style={{ color: C.paper }}>{student.name}</p>
        </div>
        <div className="text-center">
          <p className="font-serif font-black text-3xl leading-none" style={{ color: C.brass }}>{student.grade}</p>
        </div>
      </div>

      {/* 출석 */}
      <div>
        <div className="flex justify-between items-baseline mb-2.5">
          <p className="text-[13px] font-bold" style={{ color: C.paper }}>이번 주 출석</p>
          <p className="text-xs font-bold flex items-center gap-1" style={{ color: C.accent }}>
            <Flame size={14} />
            {streakCount}일 출석
          </p>
        </div>
        <div className="flex gap-1.5">
          {DAYS.map((d, i) => (
            <div key={d} className="flex-1 text-center">
              <div
                className="h-8 rounded-md mb-1"
                style={{
                  background: attendMap[i] ? C.accent : C.surfaceAlt,
                  border: attendMap[i] ? "none" : `1px solid ${C.line}`,
                }}
              />
              <p className="text-[10px]" style={{ color: C.paperDim }}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 기술 스탯 */}
      <div>
        <p className="text-[13px] font-bold mb-2.5" style={{ color: C.paper }}>이번 달 기술 스탯</p>
        <div className="flex flex-col gap-2">
          {skillMap[zoneOrder[0]] && (
            <ZoneCard label={zoneMap[zoneOrder[0]]} score={skillMap[zoneOrder[0]].score} delta={5} />
          )}
          <div className="flex gap-2">
            {[1, 2].map((i) =>
              skillMap[zoneOrder[i]] ? (
                <ZoneCard key={i} label={zoneMap[zoneOrder[i]]} score={skillMap[zoneOrder[i]].score} delta={i === 1 ? -2 : 3} />
              ) : null
            )}
          </div>
          {skillMap[zoneOrder[3]] && (
            <ZoneCard label={zoneMap[zoneOrder[3]]} score={skillMap[zoneOrder[3]].score} delta={8} />
          )}
        </div>
      </div>

      {/* 사범 피드백 */}
      {feedback.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex gap-2 items-center">
              <MessageCircle size={16} color={C.brass} />
              <p className="text-xs" style={{ color: C.paperDim }}>{feedback[0].coach_name} · 오늘</p>
            </div>
            {feedback[0].ai_drafted && (
              <span
                className="flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5"
                style={{ color: C.brass, border: `1px solid ${C.brass}` }}
              >
                <Sparkles size={10} /> AI 초안 · 사범 확인
              </span>
            )}
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: C.paper }}>{feedback[0].text}</p>
        </div>
      )}

      {/* 도장 랭킹 */}
      <div>
        <div className="flex items-center gap-1.5 mb-2.5">
          <Trophy size={14} color={C.brass} />
          <p className="text-[13px] font-bold" style={{ color: C.paper }}>도장 랭킹</p>
        </div>
        <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
          {ranking.map((r, i) => {
            const isSelf = r.id === Number(studentId);
            return (
              <div
                key={r.rank}
                className="flex items-center justify-between px-4 py-3"
                style={{
                  background: isSelf ? "rgba(195,163,95,0.10)" : "transparent",
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{
                      background: r.rank <= 3 ? C.brass : "transparent",
                      color: r.rank <= 3 ? "#171313" : C.paperDim,
                      border: r.rank <= 3 ? "none" : `1px solid ${C.line}`,
                    }}
                  >
                    {r.rank}
                  </span>
                  <span className="text-[13px]" style={{ color: C.paper, fontWeight: isSelf ? 700 : 400 }}>
                    {r.name}{isSelf ? " (나)" : ""}
                  </span>
                </div>
                <span className="text-xs font-mono" style={{ color: C.paperDim }}>{r.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => navigate(`/battle/${studentId}`)}
        className="w-full py-4 rounded-xl flex items-center justify-center gap-1.5 text-sm font-bold"
        style={{ background: C.accent, color: C.paper, border: "none" }}
      >
        대결 시작하기 <ChevronRight size={16} />
      </button>
    </div>
  );
}
