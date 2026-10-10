const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

let tasks = [];

const VALID_PRIORITIES = ["low", "medium", "high"];
const MAX_TITLE = 100;
const MAX_DESCRIPTION = 500;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value) {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value);
}

function validateFields(body) {
  const { title, description, priority, dueDate, completed } = body;

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return "title must be a non-empty string";
    }
    if (title.trim().length > MAX_TITLE) {
      return `title must be at most ${MAX_TITLE} characters`;
    }
  }
  if (description !== undefined) {
    if (typeof description !== "string") return "description must be a string";
    if (description.length > MAX_DESCRIPTION) {
      return `description must be at most ${MAX_DESCRIPTION} characters`;
    }
  }
  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return "priority must be one of: low, medium, high";
  }
  if (dueDate !== undefined && dueDate !== null) {
    if (typeof dueDate !== "string" || !isValidDate(dueDate)) {
      return "dueDate must be a valid date in YYYY-MM-DD format or null";
    }
  }
  if (completed !== undefined && typeof completed !== "boolean") {
    return "completed must be a boolean";
  }
  return null;
}

const findTask = (id) => tasks.find((t) => t.id === id);

app.post("/api/tasks", (req, res) => {
  const body = req.body || {};

  if (body.title === undefined) {
    return res.status(400).json({ error: "title is required" });
  }
  const error = validateFields(body);
  if (error) return res.status(400).json({ error });

  const now = new Date().toISOString();
  const task = {
    id: randomUUID(), 
    title: body.title.trim(),
    description: body.description ?? "",
    completed: body.completed ?? false,
    priority: body.priority ?? "medium",
    dueDate: body.dueDate ?? null,
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(task);
  res.status(201).json(task);
});

app.get("/api/tasks", (req, res) => {
  const { completed, priority, search } = req.query;
  let result = tasks;

  if (completed !== undefined) {
    result = result.filter((t) => t.completed === (completed === "true"));
  }
  if (priority) {
    result = result.filter((t) => t.priority === priority);
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }

  res.status(200).json(result);
});

app.delete("/api/tasks/completed", (req, res) => {
  const before = tasks.length;
  tasks = tasks.filter((t) => !t.completed);
  res.status(200).json({ deleted: before - tasks.length });
});

app.get("/api/tasks/:id", (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.status(200).json(task);
});

app.put("/api/tasks/:id", (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const body = req.body || {};
  if (body.title === undefined) {
    return res.status(400).json({ error: "title is required for a full update" });
  }
  const error = validateFields(body);
  if (error) return res.status(400).json({ error });

  task.title = body.title.trim();
  task.description = body.description ?? "";
  task.priority = body.priority ?? "medium";
  task.dueDate = body.dueDate ?? null;
  task.completed = body.completed ?? false;
  task.updatedAt = new Date().toISOString();

  res.status(200).json(task);
});

app.patch("/api/tasks/:id", (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const body = req.body || {};
  const editable = ["title", "description", "priority", "dueDate", "completed"];
  if (!editable.some((field) => body[field] !== undefined)) {
    return res.status(400).json({ error: "Send at least one field to update" });
  }
  const error = validateFields(body);
  if (error) return res.status(400).json({ error });

  if (body.title !== undefined) task.title = body.title.trim();
  if (body.description !== undefined) task.description = body.description;
  if (body.priority !== undefined) task.priority = body.priority;
  if (body.dueDate !== undefined) task.dueDate = body.dueDate;
  if (body.completed !== undefined) task.completed = body.completed;
  task.updatedAt = new Date().toISOString();

  res.status(200).json(task);
});

app.patch("/api/tasks/:id/complete", (req, res) => {
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const body = req.body || {};
  if (body.completed !== undefined && typeof body.completed !== "boolean") {
    return res.status(400).json({ error: "completed must be a boolean" });
  }

  task.completed = body.completed !== undefined ? body.completed : !task.completed;
  task.updatedAt = new Date().toISOString();

  res.status(200).json(task);
});

app.delete("/api/tasks/:id", (req, res) => {
  const index = tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Task not found" });

  tasks.splice(index, 1);
  res.status(200).json({ message: "Task deleted successfully" });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON in request body" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
