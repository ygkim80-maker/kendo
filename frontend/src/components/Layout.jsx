import { Outlet, NavLink, useParams, useLocation } from "react-router-dom";
import { Home, Swords, Clock, Trophy } from "lucide-react";

const C = {
  bg: "#0B0E15",
  surface: "#1D2433",
  paper: "#ECE4D3",
  paperDim: "#9B9485",
  brass: "#C3A35F",
  line: "rgba(236,228,211,0.10)",
};

export default function Layout() {
  const { studentId } = useParams();
  const id = studentId || "4";
  const location = useLocation();
  const isBattle = location.pathname.startsWith("/battle");

  const nav = [
    { to: `/dashboard/${id}`, icon: Home, label: "홈" },
    { to: `/battle/${id}`, icon: Swords, label: "대결" },
    { to: `/history/${id}`, icon: Clock, label: "기록" },
    { to: "/ranking", icon: Trophy, label: "랭킹" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center" style={{ background: C.bg }}>
      {isBattle ? (
        <div className="w-full flex-1" style={{height:"100dvh"}}>
          <Outlet />
        </div>
      ) : (
        <div className="w-full max-w-[420px] flex-1 pb-20">
          <div className="text-center pt-6 pb-2">
            <p className="font-serif font-black text-xl tracking-wide" style={{ color: C.paper }}>
              정진
            </p>
            <p className="text-[10px] tracking-[3px]" style={{ color: C.paperDim }}>
              KENDO TRAINING LOG
            </p>
          </div>
          <div className="px-4">
            <Outlet />
          </div>
        </div>
      )}
      {!isBattle && (
        <nav
          className="fixed bottom-0 w-full max-w-[420px] flex border-t"
          style={{ background: C.surface, borderColor: C.line }}
        >
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className="flex-1 flex flex-col items-center py-3 gap-1"
              style={({ isActive }) => ({ color: isActive ? C.brass : C.paperDim })}
            >
              <n.icon size={18} />
              <span className="text-[10px] font-medium">{n.label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}
