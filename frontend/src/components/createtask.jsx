
function CreateTask({
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  taskPriority,
  setTaskPriority,
  taskDueDate,
  setTaskDueDate,
  assignedTo,
  setAssignedTo,
  members = [],
  handleCreateTask,
  creatingTask,
}) {
  return (
    <form className="create-task-form" onSubmit={handleCreateTask}>
      <div>
        <label htmlFor="taskTitle">Task Title</label>
        <input
          id="taskTitle"
          type="text"
          placeholder="e.g. Design login page"
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="taskDescription">Description</label>
        <textarea
          id="taskDescription"
          placeholder="Describe the task..."
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="taskPriority">Priority</label>
        <select
          id="taskPriority"
          value={taskPriority}
          onChange={(e) => setTaskPriority(e.target.value)}
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div>
        <label htmlFor="taskDueDate">Due Date</label>
        <input
          id="taskDueDate"
          type="date"
          value={taskDueDate}
          onChange={(e) => setTaskDueDate(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="taskAssignee">Assign To</label>
        <select
          id="taskAssignee"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
        >
          <option value="">Unassigned</option>

          {members.map((member) => (
            <option key={member._id} value={member._id}>
              {member.name} ({member.role})
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={creatingTask}>
        {creatingTask ? "Creating..." : "Create Task"}
      </button>
    </form>
  );
}

export default CreateTask;
