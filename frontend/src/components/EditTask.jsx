function EditTask({
  editingTask,
  editTaskTitle,
  setEditTaskTitle,
  editTaskDescription,
  setEditTaskDescription,
  editTaskPriority,
  setEditTaskPriority,
  editTaskDueDate,
  setEditTaskDueDate,
  handleUpdateTask,
  handleCancelEditTask,
  updatingTask,
}) {
  if (!editingTask) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Task</h2>

        <form onSubmit={handleUpdateTask}>
          <div>
            <label>Task Title</label>
            <input
              type="text"
              value={editTaskTitle}
              onChange={(e) => setEditTaskTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label>Description</label>
            <textarea
              value={editTaskDescription}
              onChange={(e) => setEditTaskDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label>Priority</label>
            <select
              value={editTaskPriority}
              onChange={(e) => setEditTaskPriority(e.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label>Due Date</label>
            <input
              type="date"
              value={editTaskDueDate}
              onChange={(e) => setEditTaskDueDate(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="submit" disabled={updatingTask}>
              {updatingTask ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              className="cancel-button"
              onClick={handleCancelEditTask}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditTask;