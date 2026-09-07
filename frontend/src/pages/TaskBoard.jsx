import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import TaskActions from "../components/TaskActions";
import api from "../services/api";

const columns = [
  { id: "todo", label: "To Do" },
  { id: "doing", label: "Doing" },
  { id: "done", label: "Done" },
];

const getUserId = (value) => (typeof value === "string" ? value : value?._id);

function canManageTask(task, user) {
  return (
    user.role === "admin" ||
    getUserId(task.assignedUser) === user.id ||
    (!task.assignedUser && getUserId(task.creator) === user.id)
  );
}

function TaskCard({
  task,
  user,
  users,
  busy,
  onClaim,
  onStatusChange,
  onAction,
}) {
  const [editing, setEditing] = useState(false);
  const canManage = canManageTask(task, user);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task._id,
    disabled: busy || editing || !canManage,
  });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    zIndex: isDragging ? 100 : undefined,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <article ref={setNodeRef} style={style} className="task-card">
      <div className="task-card-heading">
        <h3>{task.title}</h3>

        {canManage && (
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="drag-handle"
            {...attributes}
            {...listeners}
            aria-label={`Drag ${task.title}`}
            disabled={busy || editing}
          >
            Move
          </button>
        )}
      </div>

      <p className="task-description">{task.description}</p>

      <p className="task-meta">
        Created by: {task.creator?.name || "Unknown user"}
      </p>

      <p className="task-meta">
        Assigned to: {task.assignedUser?.name || "Unassigned"}
      </p>

      {!task.assignedUser && (
        <button
          type="button"
          className="secondary-button"
          disabled={busy || editing}
          onClick={() => onClaim(task._id)}
        >
          Assign to me
        </button>
      )}

      {canManage ? (
        <label className="task-status-label">
          Status
          <select
            value={task.status}
            disabled={busy || editing}
            onChange={(event) => onStatusChange(task._id, event.target.value)}
          >
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="task-meta">View only</p>
      )}

      <TaskActions
        task={task}
        user={user}
        users={users}
        canManage={canManage}
        busy={busy}
        editing={editing}
        onEditingChange={setEditing}
        onAction={onAction}
      />
    </article>
  );
}

function BoardColumn({
  column,
  tasks,
  user,
  users,
  busy,
  onClaim,
  onStatusChange,
  onAction,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    disabled: busy,
  });

  return (
    <section
      ref={setNodeRef}
      className={`board-column ${isOver ? "board-column-over" : ""}`}
      aria-label={column.label}
    >
      <div className="column-heading">
        <h2>{column.label}</h2>
        <span className="task-count">{tasks.length}</span>
      </div>

      {tasks.length === 0 && <p className="empty-column">No tasks here yet.</p>}

      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          user={user}
          users={users}
          busy={busy}
          onClaim={onClaim}
          onStatusChange={onStatusChange}
          onAction={onAction}
        />
      ))}
    </section>
  );
}

function RegisteredUsers({ users }) {
  return (
    <section className="panel users-panel" aria-labelledby="users-heading">
      <div className="column-heading">
        <h2 id="users-heading">Registered users</h2>
        <span className="task-count">{users.length}</span>
      </div>

      <p className="muted">
        View all registered accounts and their roles. Use the assignment
        dropdown on a task card to assign or reassign work.
      </p>

      {users.length === 0 ? (
        <p className="muted">No registered users found.</p>
      ) : (
        <div
          className="users-table-wrapper"
          role="region"
          aria-labelledby="users-heading"
          tabIndex={0}
        >
          <table className="users-table">
            <caption className="visually-hidden">
              Registered accounts with their names, email addresses, and roles
            </caption>

            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email address</th>
                <th scope="col">Role</th>
              </tr>
            </thead>

            <tbody>
              {users.map((member) => (
                <tr key={member.id}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>
                    <span
                      className={`role-badge ${
                        member.role === "admin"
                          ? "role-badge-admin"
                          : "role-badge-user"
                      }`}
                    >
                      {member.role === "admin" ? "Administrator" : "User"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function TaskBoard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
  });

  const mutationInProgress = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    let active = true;

    async function loadTasks() {
      try {
        const [taskResponse, userResponse] = await Promise.all([
          api.get("/tasks"),
          user.role === "admin"
            ? api.get("/admin/users")
            : Promise.resolve(null),
        ]);

        if (active) {
          setTasks(taskResponse.data.data.tasks);
          setUsers(userResponse?.data.data.users || []);
        }
      } catch (requestError) {
        if (!active) return;

        if (requestError.response?.status === 401) {
          onLogout();
          return;
        }

        setLoadFailed(true);
        setError("Unable to load the board. Please try refreshing.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, [onLogout, user.role]);

  async function saveTask(
    request,
    successMessage,
    isNew = false,
    deletedId = null,
  ) {
    if (mutationInProgress.current) return false;

    mutationInProgress.current = true;
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const response = await request();

      if (deletedId) {
        setTasks((previous) =>
          previous.filter((task) => task._id !== deletedId),
        );
      } else {
        const savedTask = response.data.data.task;

        setTasks((previous) =>
          isNew
            ? [savedTask, ...previous]
            : previous.map((task) =>
                task._id === savedTask._id ? savedTask : task,
              ),
        );
      }

      if (isNew) {
        setForm({ title: "", description: "" });
      }

      setNotice(successMessage);
      return true;
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        onLogout();
        return false;
      }

      const data = requestError.response?.data;

      setError(
        data?.errors?.map((item) => item.message).join(" ") ||
          data?.message ||
          "The request could not be confirmed. Refresh before retrying.",
      );

      return false;
    } finally {
      mutationInProgress.current = false;
      setBusy(false);
    }
  }

  const handleCreate = (event) => {
    event.preventDefault();

    saveTask(
      () =>
        api.post("/tasks", {
          title: form.title.trim(),
          description: form.description.trim(),
        }),
      "Task created.",
      true,
    );
  };

  const handleClaim = (taskId) => {
    saveTask(
      () => api.patch(`/tasks/${taskId}/claim`),
      "Task assigned to you.",
    );
  };

  const handleStatusChange = (taskId, status) => {
    const task = tasks.find((item) => item._id === taskId);

    if (
      !task ||
      !canManageTask(task, user) ||
      task.status === status ||
      !columns.some((column) => column.id === status)
    ) {
      return;
    }

    saveTask(
      () => api.patch(`/tasks/${taskId}/status`, { status }),
      "Task status saved.",
    );
  };

  const handleDragEnd = ({ active, over }) => {
    if (over) {
      handleStatusChange(active.id, over.id);
    }
  };

  return (
    <main className="workspace">
      <header className="workspace-header">
        <div>
          <p className="brand">LessTaxi · Task Manager</p>
          <h1>{user.role === "admin" ? "Team board" : "My task board"}</h1>
          <p className="muted">Welcome, {user.name}</p>
        </div>

        <div className="board-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={busy || loading}
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>

          <button
            type="button"
            className="secondary-button"
            disabled={busy}
            onClick={onLogout}
          >
            Log out
          </button>
        </div>
      </header>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="success-message" role="status">
          {notice}
        </p>
      )}

      {busy && <p role="status">Saving...</p>}

      {loading ? (
        <p role="status">Loading tasks...</p>
      ) : loadFailed ? (
        <p>Use Refresh to try again.</p>
      ) : (
        <>
          {user.role === "admin" && <RegisteredUsers users={users} />}

          <section className="panel create-task-panel">
            <h2>Create a task</h2>

            <form onSubmit={handleCreate}>
              <fieldset disabled={busy}>
                <label>
                  Title
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm({ ...form, title: event.target.value })
                    }
                    maxLength={120}
                    required
                  />
                </label>

                <label>
                  Description
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        description: event.target.value,
                      })
                    }
                    maxLength={2000}
                    rows={3}
                    required
                  />
                </label>

                <button type="submit" className="primary-button">
                  Create task
                </button>
              </fieldset>
            </form>
          </section>

          <p className="muted">
            Drag a task using Move, or choose its status from the dropdown.
            Unassigned tasks can be claimed by any signed-in user.
          </p>

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="task-board">
              {columns.map((column) => (
                <BoardColumn
                  key={column.id}
                  column={column}
                  tasks={tasks.filter((task) => task.status === column.id)}
                  user={user}
                  users={users}
                  busy={busy}
                  onClaim={handleClaim}
                  onStatusChange={handleStatusChange}
                  onAction={saveTask}
                />
              ))}
            </div>
          </DndContext>
        </>
      )}
    </main>
  );
}
