const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export const api = {
  getStudents: () => request("/students"),
  getStudent: (id) => request(`/students/${id}`),
  getAttendance: (id) => request(`/students/${id}/attendance`),
  getSkills: (id) => request(`/students/${id}/skills`),
  getRanking: () => request("/ranking"),
  getFeedback: (id) => request(`/students/${id}/feedback`),
  getMatches: (id) => request(`/students/${id}/matches`),
  logAttendance: (data) => request("/attendance", { method: "POST", body: JSON.stringify(data) }),
  battleStart: (data) => request("/battle/start", { method: "POST", body: JSON.stringify(data) }),
  battleAction: (studentId, data) => request(`/battle/action/${studentId}`, { method: "POST", body: JSON.stringify(data) }),
  battleTimeout: (studentId) => request(`/battle/timeout/${studentId}`, { method: "POST" }),
  battleFinish: (studentId) => request(`/battle/finish/${studentId}`, { method: "POST" }),
};
