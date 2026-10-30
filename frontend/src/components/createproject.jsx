
function CreateProject({
  projectName,
  setProjectName,
  projectDescription,
  setProjectDescription,
  handleCreateProject,
}) {
  return (
    <form onSubmit={handleCreateProject}>
      <label htmlFor="projectName">Project name</label>
      <input
        id="projectName"
        type="text"
        placeholder="Enter project name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        required
      />

      <label htmlFor="projectDescription">
        Project description
      </label>
      <textarea
        id="projectDescription"
        placeholder="Describe your project"
        value={projectDescription}
        onChange={(e) =>
          setProjectDescription(e.target.value)
        }
        rows={3}
      />

      <button type="submit">Create Project</button>
    </form>
  );
}

export default CreateProject;
