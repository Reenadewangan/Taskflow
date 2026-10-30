

import { useState, useEffect } from "react";
import api from "./api/axios";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  const [currentUser, setCurrentUser] = useState(null);

  // Theme states
  const [theme, setTheme] = useState(
    localStorage.getItem("taskflow-theme") || "light"
  );

  const toggleTheme = () => {
    setTheme((currentTheme) =>
      currentTheme === "light" ? "dark" : "light"
    );
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("taskflow-theme", theme);
  }, [theme]);

  const [projects, setProjects] = useState([]);
  const [projectError, setProjectError] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  // Edit project states
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updatingProject, setUpdatingProject] = useState(false);

  // Kanban board states
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [taskError, setTaskError] = useState("");
  const [tasksLoading, setTasksLoading] = useState(false);

  // Create task states
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // Edit task states
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editTaskPriority, setEditTaskPriority] = useState("Medium");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [updatingTask, setUpdatingTask] = useState(false);

  // Fetch current user and projects after login
  useEffect(() => {
    if (!isLoggedIn) return;

    const loadUserAndProjects = async () => {
      try {
        // First fetch the logged-in user's details
        const userResponse = await api.get("/auth/me");
        const user = userResponse.data.user;

        setCurrentUser({
          ...user,
          _id: user.id || user._id,
        });

        // Fetch projects separately
        // A project error should not block the dashboard
        try {
          const projectResponse = await api.get("/projects");
          const data = projectResponse.data;

          setProjects(
            Array.isArray(data)
              ? data
              : Array.isArray(data.projects)
              ? data.projects
              : []
          );

          setProjectError("");
        } catch (error) {
          console.error("Project loading error:", error);

          setProjects([]);
          setProjectError(
            error.response?.data?.message ||
              "Unable to load projects. Please check your organization."
          );
        }
      } catch (error) {
        console.error("Account loading error:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          setCurrentUser(null);
          return;
        }

        setProjectError(
          error.response?.data?.message ||
            "Failed to load your account. Please try again."
        );
      }
    };

    loadUserAndProjects();
  }, [isLoggedIn]);

  // Fetch tasks for a selected project
  const fetchTasks = async (projectId) => {
    setTasksLoading(true);
    setTaskError("");
    setTasks([]);

    try {
      const response = await api.get("/tasks", {
        params: { projectId },
      });

      setTasks(response.data.tasks || []);
    } catch (error) {
      setTaskError(
        error.response?.data?.message || "Failed to load tasks."
      );
    } finally {
      setTasksLoading(false);
    }
  };

  // Open a project's Kanban board
  const handleOpenBoard = (project) => {
    setSelectedProject(project);
    fetchTasks(project._id);
  };

  // Create a task
  const handleCreateTask = async (e, assignedTo) => {
    e.preventDefault();

    if (!selectedProject) return false;

    if (!taskTitle.trim()) {
      setTaskError("Task title is required.");
      return false;
    }

    setCreatingTask(true);
    setTaskError("");

    try {
      const response = await api.post("/tasks", {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        projectId: selectedProject._id,
        priority: taskPriority,
        dueDate: taskDueDate || null,
        assignedTo: assignedTo || null,
      });

      setTasks((currentTasks) => [
        response.data.task,
        ...currentTasks,
      ]);

      setTaskTitle("");
      setTaskDescription("");
      setTaskPriority("Medium");
      setTaskDueDate("");

      return true;
    } catch (error) {
      setTaskError(
        error.response?.data?.message || "Failed to create task."
      );
      return false;
    } finally {
      setCreatingTask(false);
    }
  };

  // Open Edit Task popup
  const handleEditTask = (task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDescription(task.description || "");
    setEditTaskPriority(task.priority || "Medium");

    setEditTaskDueDate(
      task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : ""
    );
  };

  // Close Edit Task popup
  const handleCancelEditTask = () => {
    setEditingTask(null);
    setEditTaskTitle("");
    setEditTaskDescription("");
    setEditTaskPriority("Medium");
    setEditTaskDueDate("");
  };

  // Update task
  const handleUpdateTask = async (e) => {
    e.preventDefault();

    if (!editingTask || !editTaskTitle.trim()) {
      setTaskError("Task title is required.");
      return;
    }

    setUpdatingTask(true);
    setTaskError("");

    try {
      const response = await api.patch(
        `/tasks/${editingTask._id}`,
        {
          title: editTaskTitle.trim(),
          description: editTaskDescription.trim(),
          priority: editTaskPriority,
          dueDate: editTaskDueDate || null,
        }
      );

      const updatedTask = response.data.task;

      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task._id === updatedTask._id ? updatedTask : task
        )
      );

      handleCancelEditTask();
    } catch (error) {
      setTaskError(
        error.response?.data?.message || "Failed to update task."
      );
    } finally {
      setUpdatingTask(false);
    }
  };

  // Update task status after drag and drop
  const handleTaskStatusChange = async (taskId, newStatus) => {
    const previousTasks = [...tasks];

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task._id === taskId
          ? { ...task, status: newStatus }
          : task
      )
    );

    setTaskError("");

    try {
      await api.patch(`/tasks/${taskId}`, {
        status: newStatus,
      });
    } catch (error) {
      setTasks(previousTasks);
      setTaskError(
        error.response?.data?.message ||
          "Failed to update task status."
      );
      throw error;
    }
  };

  // Close the Kanban board
  const handleCloseBoard = () => {
    setSelectedProject(null);
    setTasks([]);
    setTaskError("");
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("Medium");
    setTaskDueDate("");
    handleCancelEditTask();
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const token = response.data.token || response.data.accessToken;

      if (token) {
        localStorage.setItem("token", token);
        setCurrentUser(null);
        setProjects([]);
        setProjectError("");
        setIsLoggedIn(true);
      } else {
        setMessage(
          "Login response received, but no token was found."
        );
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Login failed. Please check your credentials and backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // Create project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    setProjectError("");

    try {
      await api.post("/projects", {
        name: projectName,
        description: projectDescription,
      });

      setProjectName("");
      setProjectDescription("");

      const response = await api.get("/projects");
      const data = response.data;

      setProjects(
        Array.isArray(data)
          ? data
          : Array.isArray(data.projects)
          ? data.projects
          : []
      );
    } catch (error) {
      setProjectError(
        error.response?.data?.message || "Failed to create project."
      );
    }
  };

  // Open edit project modal
  const handleEditProject = (project) => {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description || "");
  };

  // Cancel editing project
  const handleCancelEdit = () => {
    setEditingProject(null);
    setEditName("");
    setEditDescription("");
  };

  // Update project
  const handleUpdateProject = async (e) => {
    e.preventDefault();

    if (!editingProject) return;

    if (!editName.trim()) {
      setProjectError("Project name is required.");
      return;
    }

    setUpdatingProject(true);
    setProjectError("");

    try {
      const response = await api.put(
        `/projects/${editingProject._id}`,
        {
          name: editName.trim(),
          description: editDescription.trim(),
        }
      );

      const updatedProject = response.data.project;

      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project._id === editingProject._id
            ? updatedProject
            : project
        )
      );

      if (selectedProject?._id === updatedProject._id) {
        setSelectedProject(updatedProject);
      }

      handleCancelEdit();
    } catch (error) {
      setProjectError(
        error.response?.data?.message || "Failed to update project."
      );
    } finally {
      setUpdatingProject(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    setDeletingProjectId(projectId);
    setProjectError("");

    try {
      await api.delete(`/projects/${projectId}`);

      setProjects((currentProjects) =>
        currentProjects.filter(
          (project) => project._id !== projectId
        )
      );

      if (selectedProject?._id === projectId) {
        handleCloseBoard();
      }
    } catch (error) {
      setProjectError(
        error.response?.data?.message || "Failed to delete project."
      );
    } finally {
      setDeletingProjectId(null);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setProjects([]);
    setTasks([]);
    setSelectedProject(null);
    setProjectError("");
    setTaskError("");
    setMessage("");
    setPassword("");
    setEmail("");
    handleCancelEdit();
    handleCancelEditTask();
  };

  if (isLoggedIn) {
    if (!currentUser) {
      return <p>Loading your account...</p>;
    }

    return (
      <Dashboard
        currentUser={currentUser}
        theme={theme}
        toggleTheme={toggleTheme}
        projects={projects}
        projectError={projectError}
        projectName={projectName}
        setProjectName={setProjectName}
        projectDescription={projectDescription}
        setProjectDescription={setProjectDescription}
        handleCreateProject={handleCreateProject}
        handleDeleteProject={handleDeleteProject}
        deletingProjectId={deletingProjectId}
        handleEditProject={handleEditProject}
        editingProject={editingProject}
        editName={editName}
        setEditName={setEditName}
        editDescription={editDescription}
        setEditDescription={setEditDescription}
        handleUpdateProject={handleUpdateProject}
        handleCancelEdit={handleCancelEdit}
        updatingProject={updatingProject}
        handleLogout={handleLogout}
        selectedProject={selectedProject}
        tasks={tasks}
        taskError={taskError}
        tasksLoading={tasksLoading}
        handleOpenBoard={handleOpenBoard}
        handleCloseBoard={handleCloseBoard}
        handleTaskStatusChange={handleTaskStatusChange}
        taskTitle={taskTitle}
        setTaskTitle={setTaskTitle}
        taskDescription={taskDescription}
        setTaskDescription={setTaskDescription}
        taskPriority={taskPriority}
        setTaskPriority={setTaskPriority}
        taskDueDate={taskDueDate}
        setTaskDueDate={setTaskDueDate}
        handleCreateTask={handleCreateTask}
        creatingTask={creatingTask}
        editingTask={editingTask}
        editTaskTitle={editTaskTitle}
        setEditTaskTitle={setEditTaskTitle}
        editTaskDescription={editTaskDescription}
        setEditTaskDescription={setEditTaskDescription}
        editTaskPriority={editTaskPriority}
        setEditTaskPriority={setEditTaskPriority}
        editTaskDueDate={editTaskDueDate}
        setEditTaskDueDate={setEditTaskDueDate}
        handleEditTask={handleEditTask}
        handleUpdateTask={handleUpdateTask}
        handleCancelEditTask={handleCancelEditTask}
        updatingTask={updatingTask}
      />
    );
  }

  return (
    <Login
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleLogin={handleLogin}
      loading={loading}
      message={message}
    />
  );
}

export default App;
