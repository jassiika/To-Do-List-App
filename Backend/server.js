const express = require("express");
const { randomUUID } = require("crypto");

const app = express();

const cors = require("cors");
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));

app.use(express.json());

let tasks = [];

const VALID_PRIORITIES = ["low", "medium", "high"];

// 1 add tasks
app.post("/api/tasks", (req, res) => {
  const { title, description = "", dueDate = null, priority = "medium" } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "title is required" });
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: "priority must be low, medium or high" });
  }

  const now = new Date().toISOString();
  const task = {
    id: randomUUID(), 
    title: title.trim(),
    description,
    completed: false,
    priority,
    dueDate,
    createdAt: now,
    updatedAt: now,
  };

  tasks.push(task);
  res.status(201).json(task);
});

// 2. Get All Tasks 
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
    const q = search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }

  res.status(200).json(result);
});

// 7. Delete All Completed Tasks
app.delete("/api/tasks/completed", (req, res) => {
  const before = tasks.length;
  tasks = tasks.filter((t) => !t.completed);
  res.status(200).json({ deleted: before - tasks.length });
});

// 3. Get a Single Task 
app.get("/api/tasks/:id", (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.status(200).json(task);
});

// 4. Update a Task (PUT = full, PATCH = partial) 
function updateTask(req, res) {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { title, description, completed, priority, dueDate } = req.body;

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({ error: "title cannot be empty" });
    }
    task.title = title.trim();
  }
  if (priority !== undefined) {
    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: "priority must be low, medium or high" });
    }
    task.priority = priority;
  }
  if (description !== undefined) task.description = description;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (completed !== undefined) task.completed = Boolean(completed);

  task.updatedAt = new Date().toISOString();
  res.status(200).json(task);
}
app.put("/api/tasks/:id", updateTask);
app.patch("/api/tasks/:id", updateTask);

//  5. Mark Task Complete / Incomplete 
app.patch("/api/tasks/:id/complete", (req, res) => {
  const task = tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  task.completed =
    typeof req.body.completed === "boolean" ? req.body.completed : !task.completed;
  task.updatedAt = new Date().toISOString();

  res.status(200).json(task);
});

// 6. Delete a Task 
app.delete("/api/tasks/:id", (req, res) => {
  const index = tasks.findIndex((t) => t.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Task not found" });

  tasks.splice(index, 1);
  res.status(200).json({ message: "Task deleted successfully" });
});

// Fallback & error handling
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));