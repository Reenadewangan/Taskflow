function EditProject({
  editingProject,
  editName,
  setEditName,
  editDescription,
  setEditDescription,
  handleUpdateProject,
  handleCancelEdit,
  updatingProject,
}) {
  if (!editingProject) {
    return null;
  }

  return (
    <div className="edit-project-overlay">
      <div className="edit-project-modal">
        <h2>Edit Project</h2>

        <form onSubmit={handleUpdateProject}>
          <label htmlFor="editName">
            Project Name
          </label>

          <input
            id="editName"
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter project name"
            required
          />

          <label htmlFor="editDescription">
            Project Description
          </label>

          <textarea
            id="editDescription"
            value={editDescription}
            onChange={(e) =>
              setEditDescription(e.target.value)
            }
            placeholder="Enter project description"
            rows={4}
          />

          <div className="edit-project-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={handleCancelEdit}
              disabled={updatingProject}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={updatingProject}
            >
              {updatingProject ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProject;