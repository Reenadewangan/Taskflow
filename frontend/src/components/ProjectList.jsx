
function ProjectList({
  projects,
  projectError,
  handleDeleteProject,
  deletingProjectId,
  handleEditProject,
  handleOpenBoard,
}) {
  return (
    <section className="projects-section">
      {projectError && (
        <p className="login-message" role="alert">
          {projectError}
        </p>
      )}

      {projects.length === 0 && !projectError && (
        <div className="empty-state">
          <p>No projects found.</p>
          <p>Create your first project to get started!</p>
        </div>
      )}

      <div className="project-grid">
        {projects.map((project) => (
          <div className="project-card" key={project._id}>
            <div className="project-card-header">
              <h3>{project.name}</h3>

              <div className="project-actions">
                <button
                  className="edit-button"
                  onClick={() => handleEditProject(project)}
                >
                  Edit
                </button>

                <button
                  className="delete-button"
                  onClick={() =>
                    handleDeleteProject(project._id)
                  }
                  disabled={deletingProjectId === project._id}
                >
                  {deletingProjectId === project._id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </div>

            <p>
              {project.description || "No description provided."}
            </p>

            <button
              className="open-board-button"
              onClick={() => handleOpenBoard(project)}
            >
              Open Board →
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ProjectList;
