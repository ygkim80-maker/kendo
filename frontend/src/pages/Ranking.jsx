import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { api } from "../hooks/api";

const C = {
  surface: "#1D2433",
  paper: "#ECE4D3",
  paperDim: "#9B9485",
  brass: "#C3A35F",
  line: "rgba(236,228,211,0.10)",
};

export default function Ranking() {
  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    api.getRanking().then(setRanking);
  }, []);

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} color={C.brass} />
        <p className="font-serif text-lg font-bold" style={{ color: C.paper }}>도장 랭킹</p>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
        {ranking.map((r, i) => (
          <div
            key={r.rank}
            className="flex items-center justify-between px-4 py-4"
            style={{ borderTop: i === 0 ? "none" : `1px solid ${C.line}` }}
          >
            <div className="flex items-center gap-3">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: r.rank <= 3 ? C.brass : "transparent",
                  color: r.rank <= 3 ? "#171313" : C.paperDim,
                  border: r.rank <= 3 ? "none" : `1px solid ${C.line}`,
                }}
              >
                {r.rank}
              </span>
              <div>
                <p className="text-sm font-medium" style={{ color: C.paper }}>{r.name}</p>
              </div>
            </div>
            <span className="text-sm font-mono font-bold" style={{ color: C.brass }}>{r.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
