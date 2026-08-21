import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../hooks/api";

const C = {
  surface: "#1D2433",
  paper: "#ECE4D3",
  paperDim: "#9B9485",
  brass: "#C3A35F",
  accent: "#9B3A2C",
  accentBright: "#E14430",
  line: "rgba(236,228,211,0.10)",
};

export default function History() {
  const { studentId } = useParams();
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    api.getMatches(studentId).then(setMatches);
  }, [studentId]);

  const resultColor = (r) => r === "win" ? C.brass : r === "lose" ? C.accentBright : C.paperDim;
  const resultLabel = (r) => r === "win" ? "승" : r === "lose" ? "패" : "무";

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <p className="font-serif text-lg font-bold mb-4" style={{ color: C.paper }}>대결 기록</p>
      {matches.length === 0 ? (
        <p className="text-sm text-center py-10" style={{ color: C.paperDim }}>아직 대결 기록이 없습니다</p>
      ) : (
        <div className="flex flex-col gap-2">
          {matches.map((m) => (
            <div
              key={m.id}
              className="rounded-xl p-4 flex items-center justify-between"
              style={{ background: C.surface, border: `1px solid ${C.line}` }}
            >
              <div>
                <p className="text-[13px] font-bold" style={{ color: C.paper }}>
                  vs {m.opponent_name}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: C.paperDim }}>{m.date}</p>
              </div>
              <div className="text-right">
                <p className="font-serif text-lg font-bold" style={{ color: resultColor(m.result) }}>
                  {resultLabel(m.result)}
                </p>
                <p className="text-xs font-mono" style={{ color: C.paperDim }}>
                  {m.score_player} - {m.score_opponent}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
