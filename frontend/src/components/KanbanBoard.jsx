
import { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";

const columns = [
  { id: "Todo", title: "To Do" },
  { id: "In Progress", title: "In Progress" },
  { id: "In Review", title: "In Review" },
  { id: "Done", title: "Done" },
];

function KanbanBoard({
  tasks = [],
  handleTaskStatusChange,
  handleEditTask,
}) {
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;

    if (newStatus === source.droppableId) return;

    setUpdatingTaskId(draggableId);

    try {
      await handleTaskStatusChange(draggableId, newStatus);
    } catch (error) {
      // Parent component handles the error and restores the task.
      console.error("Failed to move task:", error);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {columns.map((column) => {
          const columnTasks = tasks.filter(
            (task) => task.status === column.id
          );

          return (
            <div className="kanban-column" key={column.id}>
              <div className="kanban-column-header">
                <h3>{column.title}</h3>
                <span>{columnTasks.length}</span>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    className={`kanban-task-list ${
                      snapshot.isDraggingOver ? "dragging-over" : ""
                    }`}
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable
                        key={task._id}
                        draggableId={String(task._id)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            className={`kanban-task-card ${
                              snapshot.isDragging ? "dragging" : ""
                            }`}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <h4>{task.title}</h4>

                            <p>
                              {task.description ||
                                "No description provided."}
                            </p>

                            <div className="kanban-task-footer">
                              <span
                                className={`priority-badge priority-${task.priority?.toLowerCase()}`}
                              >
                                {task.priority}
                              </span>

                              {task.assignedTo && (
                                <span className="task-assignee">
                                  {task.assignedTo.name ||
                                    task.assignedTo.email}
                                </span>
                              )}
                            </div>

                            {task.dueDate && (
                              <small className="task-due-date">
                                Due:{" "}
                                {new Date(
                                  task.dueDate
                                ).toLocaleDateString()}
                              </small>
                            )}

                            <div className="task-card-actions">
                              <button
                                type="button"
                                className="task-edit-button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTask(task);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                              >
                                Edit
                              </button>
                            </div>

                            {updatingTaskId === task._id && (
                              <small>Updating status...</small>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}

                    {columnTasks.length === 0 && (
                      <p className="kanban-empty">No tasks yet</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}

export default KanbanBoard;
