
import { useEffect, useState } from "react";
import api from "../api/axios";

import ProjectList from "./ProjectList";
import CreateProject from "./createproject";
import EditProject from "./EditProject";
import KanbanBoard from "./KanbanBoard";
import CreateTask from "./createtask";
import EditTask from "./EditTask";
import TeamMembers from "./TeamMembers";

function Dashboard({
  currentUser,
  theme,
  toggleTheme,

  // Project props
  projects,
  projectError,
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  handleCreateProject,
  handleDeleteProject,
  deletingProjectId,
  handleEditProject,
  editingProject,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  handleUpdateProject,
  handleCancelEdit,
  updatingProject,

  // General
  handleLogout,

  // Kanban props
  selectedProject,
  tasks,
  taskError,
  tasksLoading,
  handleOpenBoard,
  handleCloseBoard,
  handleTaskStatusChange,

  // Create task props
  taskTitle,
  setTaskTitle,
  taskDescription,
  setTaskDescription,
  taskPriority,
  setTaskPriority,
  taskDueDate,
  setTaskDueDate,
  handleCreateTask,
  creatingTask,

  // Edit task props
  editingTask,
  editTaskTitle,
  setEditTaskTitle,
  editTaskDescription,
  setEditTaskDescription,
  editTaskPriority,
  setEditTaskPriority,
  editTaskDueDate,
  setEditTaskDueDate,
  handleEditTask,
  handleUpdateTask,
  handleCancelEditTask,
  updatingTask,
}) {
  const [activeTab, setActiveTab] = useState("projects");

  // Team members and task assignment states
  const [members, setMembers] = useState([]);
  const [assignedTo, setAssignedTo] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  // Fetch organization members when a project board is opened
  useEffect(() => {
    if (!selectedProject) {
      setMembers([]);
      setAssignedTo("");
      setMembersError("");
      return;
    }

    const fetchMembers = async () => {
      setMembersLoading(true);
      setMembersError("");

      try {
        const response = await api.get("/organizations/members");
        setMembers(response.data.members || []);
      } catch (error) {
        setMembersError(
          error.response?.data?.message ||
            "Failed to load team members."
        );
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [selectedProject]);

  // Clear assignee selection when switching projects
  useEffect(() => {
    setAssignedTo("");
  }, [selectedProject]);

  // Handle task creation and pass selected assignee to App.jsx
  const handleCreateTaskWithAssignee = async (e) => {
    const success = await handleCreateTask(e, assignedTo);

    if (success) {
      setAssignedTo("");
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-logo">TaskFlow</h1>
          <p>Manage your projects and collaborate with your team.</p>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
          >
            {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
          </button>

          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-welcome">
        <h2>Welcome, {currentUser?.name}!</h2>
        <p>
          Your role: <strong>{currentUser?.role}</strong>
        </p>
      </div>

      {/* Dashboard navigation */}
      {!selectedProject && (
        <div className="dashboard-navigation">
          <button
            className={activeTab === "projects" ? "active" : ""}
            onClick={() => setActiveTab("projects")}
          >
            Projects
          </button>

          <button
            className={activeTab === "team" ? "active" : ""}
            onClick={() => setActiveTab("team")}
          >
            Team Members
          </button>
        </div>
      )}

      {/* Project board */}
      {selectedProject ? (
        <div className="project-board-container">
          <button
            className="back-button"
            onClick={handleCloseBoard}
          >
            Back to Projects
          </button>

          <h2>{selectedProject.name}</h2>

          {taskError && (
            <p className="error-message">{taskError}</p>
          )}

          {membersError && (
            <p className="error-message">{membersError}</p>
          )}

          {/* Create task form */}
          {membersLoading ? (
            <p>Loading team members...</p>
          ) : (
            <CreateTask
              taskTitle={taskTitle}
              setTaskTitle={setTaskTitle}
              taskDescription={taskDescription}
              setTaskDescription={setTaskDescription}
              taskPriority={taskPriority}
              setTaskPriority={setTaskPriority}
              taskDueDate={taskDueDate}
              setTaskDueDate={setTaskDueDate}
              handleCreateTask={handleCreateTaskWithAssignee}
              creatingTask={creatingTask}
              assignedTo={assignedTo}
              setAssignedTo={setAssignedTo}
              members={members}
            />
          )}

          {/* Kanban board */}
          {tasksLoading ? (
            <p>Loading tasks...</p>
          ) : (
            <KanbanBoard
              tasks={tasks}
              handleTaskStatusChange={handleTaskStatusChange}
              handleEditTask={handleEditTask}
            />
          )}

          {/* Edit task modal */}
          {editingTask && (
            <EditTask
              editingTask={editingTask}
              editTaskTitle={editTaskTitle}
              setEditTaskTitle={setEditTaskTitle}
              editTaskDescription={editTaskDescription}
              setEditTaskDescription={setEditTaskDescription}
              editTaskPriority={editTaskPriority}
              setEditTaskPriority={setEditTaskPriority}
              editTaskDueDate={editTaskDueDate}
              setEditTaskDueDate={setEditTaskDueDate}
              handleUpdateTask={handleUpdateTask}
              handleCancelEditTask={handleCancelEditTask}
              updatingTask={updatingTask}
            />
          )}
        </div>
      ) : (
        <>
          {/* Projects tab */}
          {activeTab === "projects" && (
            <div className="projects-section">
              {projectError && (
                <p className="error-message">{projectError}</p>
              )}

              <CreateProject
                projectName={projectName}
                setProjectName={setProjectName}
                projectDescription={projectDescription}
                setProjectDescription={setProjectDescription}
                handleCreateProject={handleCreateProject}
              />

              <ProjectList
                projects={projects}
                handleOpenBoard={handleOpenBoard}
                handleEditProject={handleEditProject}
                handleDeleteProject={handleDeleteProject}
                deletingProjectId={deletingProjectId}
              />

              {editingProject && (
                <EditProject
                  editingProject={editingProject}
                  editName={editName}
                  setEditName={setEditName}
                  editDescription={editDescription}
                  setEditDescription={setEditDescription}
                  handleUpdateProject={handleUpdateProject}
                  handleCancelEdit={handleCancelEdit}
                  updatingProject={updatingProject}
                />
              )}
            </div>
          )}

          {/* Team members tab */}
          {activeTab === "team" && (
            <TeamMembers currentUser={currentUser} />
          )}
        </>
      )}
    </div>
  );
}

export default Dashboard;

