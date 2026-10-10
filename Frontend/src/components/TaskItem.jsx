import { useState } from "react";

export default function TaskItem({ task, onToggle, onEdit, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  async function save() {
    if (!draft.trim()) return;
    const ok = await onEdit(task.id, { title: draft });
    if (ok) setEditing(false);
  }

  function cancel() {
    setDraft(task.title);
    setEditing(false);
  }

  return (
    <li className={`task ${task.completed ? "done" : ""}`}>
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task)}
        aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
      />

      {editing ? (
        <input
          className="edit-input"
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") cancel();
          }}
        />
      ) : (
        <span className="title">{task.title}</span>
      )}

      <span className={`badge ${task.priority}`}>{task.priority}</span>

      <div className="actions">
        {editing ? (
          <>
            <button className="link" onClick={save}>Save</button>
            <button className="link" onClick={cancel}>Cancel</button>
          </>
        ) : (
          <>
            <button className="link" onClick={() => setEditing(true)}>Edit</button>
            <button className="link danger" onClick={() => onDelete(task.id)}>Delete</button>
          </>
        )}
      </div>
    </li>
  );
}