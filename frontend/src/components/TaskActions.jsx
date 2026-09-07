import { useState } from "react";
import api from "../services/api";

export default function TaskActions({
  task,
  user,
  users,
  canManage,
  busy,
  editing,
  onEditingChange,
  onAction,
}) {
  const [draft, setDraft] = useState({
    title: task.title,
    description: task.description,
  });

  const startEditing = () => {
    setDraft({
      title: task.title,
      description: task.description,
    });
    onEditingChange(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    const successful = await onAction(
      () =>
        api.patch(`/tasks/${task._id}`, {
          title: draft.title.trim(),
          description: draft.description.trim(),
        }),
      "Task updated.",
    );

    // After a successful save:
    if (successful) onEditingChange(false);
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${task.title}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    onAction(
      () => api.delete(`/tasks/${task._id}`),
      "Task deleted.",
      false,
      task._id,
    );
  };

  const handleAssign = (event) => {
    const assignedUser = event.target.value || null;

    onAction(
      () =>
        api.patch(`/admin/tasks/${task._id}/assign`, {
          assignedUser,
        }),
      assignedUser ? "Task assignment saved." : "Task unassigned.",
    );
  };

  return (
    <div className="task-actions">
      {user.role === "admin" && (
        <label className="task-status-label">
          Assign to
          <select
            value={task.assignedUser?._id || ""}
            onChange={handleAssign}
            disabled={busy || editing}
          >
            <option value="">Unassigned</option>
            {users.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        </label>
      )}

      {canManage &&
        (editing ? (
          <form onSubmit={handleSave}>
            <fieldset disabled={busy}>
              <label>
                Title
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft({ ...draft, title: event.target.value })
                  }
                  maxLength={120}
                  required
                />
              </label>

              <label>
                Description
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      description: event.target.value,
                    })
                  }
                  rows={4}
                  maxLength={2000}
                  required
                />
              </label>

              <div className="task-action-buttons">
                <button type="submit" className="primary-button">
                  Save
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onEditingChange(false)}
                >
                  Cancel
                </button>
              </div>
            </fieldset>
          </form>
        ) : (
          <div className="task-action-buttons">
            <button
              type="button"
              className="secondary-button"
              disabled={busy}
              onClick={startEditing}
            >
              Edit
            </button>
            <button
              type="button"
              className="danger-button"
              disabled={busy}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
        ))}
    </div>
  );
}
