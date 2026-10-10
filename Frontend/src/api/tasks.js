const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API = `${BASE_URL}/api/tasks`;

async function request(url, options = {}) {
  let res;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Cannot reach the server. Please check your connection and try again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (status ${res.status})`);
  }
  return res.json();
}

export const getTasks = () => request(API);

export const createTask = (task) =>
  request(API, { method: "POST", body: JSON.stringify(task) });

export const updateTask = (id, changes) =>
  request(`${API}/${id}`, { method: "PATCH", body: JSON.stringify(changes) });

export const setTaskCompleted = (id, completed) =>
  request(`${API}/${id}/complete`, {
    method: "PATCH",
    body: JSON.stringify({ completed }),
  });

export const deleteTask = (id) => request(`${API}/${id}`, { method: "DELETE" });

export const clearCompletedTasks = () =>
  request(`${API}/completed`, { method: "DELETE" });