import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Battle from "./pages/Battle";
import History from "./pages/History";
import Ranking from "./pages/Ranking";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard/4" replace />} />
        <Route path="/dashboard/:studentId" element={<Dashboard />} />
        <Route path="/battle/:studentId" element={<Battle />} />
        <Route path="/history/:studentId" element={<History />} />
        <Route path="/ranking" element={<Ranking />} />
      </Route>
    </Routes>
  );
}
