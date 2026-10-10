import { useEffect, useState } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  setTaskCompleted,
  deleteTask,
  clearCompletedTasks,
} from "./api/tasks";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import ErrorBanner from "./components/ErrorBanner";

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    setError("");
    try {
      setTasks(await getTasks());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(task) {
    try {
      const created = await createTask(task);
      setTasks((prev) => [...prev, created]);
      setError("");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function handleToggle(task) {
    try {
      const updated = await setTaskCompleted(task.id, !task.completed);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEdit(id, changes) {
    try {
      const updated = await updateTask(id, changes);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setError("");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearCompleted() {
    try {
      await clearCompletedTasks();
      setTasks((prev) => prev.filter((t) => !t.completed));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }

  const visibleTasks = tasks.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <main className="app">
      <h1>To-Do List</h1>

      <ErrorBanner
        message={error}
        onRetry={loadTasks}
        onDismiss={() => setError("")}
      />

      <TaskForm onAdd={handleAdd} />

      <div className="filters">
        {["all", "active", "completed"].map((f) => (
          <button
            key={f}
            className={filter === f ? "active" : ""}
            onClick={() => setFilter(f)}
          >
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading tasks...</p>
      ) : (
        <TaskList
          tasks={visibleTasks}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <footer>
        <span className="muted">
          {tasks.length - completedCount} left · {completedCount} completed
        </span>
        {completedCount > 0 && (
          <button className="link" onClick={handleClearCompleted}>
            Clear completed
          </button>
        )}
      </footer>
    </main>
  );
}
