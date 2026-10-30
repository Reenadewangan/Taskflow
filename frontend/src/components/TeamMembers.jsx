
import { useEffect, useState } from "react";
import api from "../api/axios";

function TeamMembers({ currentUser }) {
  const [members, setMembers] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = currentUser?.role === "Admin";

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/organizations/members");
      setMembers(response.data.members || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setAdding(true);
      setError("");
      setMessage("");

      await api.post("/organizations/members", {
        email: email.trim(),
      });

      setEmail("");
      setMessage("Member added successfully.");
      await fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add member.");
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChange = async (memberId, role) => {
    try {
      setError("");
      setMessage("");

      await api.patch(`/organizations/members/${memberId}/role`, {
        role,
      });

      setMessage("Member role updated successfully.");
      await fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role.");
    }
  };

  const handleRemoveMember = async (memberId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this member from the organization?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/organizations/members/${memberId}`);

      setMessage("Member removed successfully.");
      await fetchMembers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove member.");
    }
  };

  if (loading) return <p>Loading team members...</p>;

  return (
    <section className="team-members">
      <h2>Team Members</h2>
      <p>Manage the people in your organization.</p>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      {isAdmin && (
        <form className="add-member-form" onSubmit={handleAddMember}>
          <input
            type="email"
            placeholder="Enter registered user's email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={adding}>
            {adding ? "Adding..." : "Add Member"}
          </button>
        </form>
      )}

      <div className="team-member-list">
        {members.length === 0 ? (
          <p>No team members found.</p>
        ) : (
          members.map((member) => (
            <div className="team-member-card" key={member._id}>
              <div>
                <h3>{member.name}</h3>
                <p>{member.email}</p>
                <span className="member-role">{member.role}</span>
              </div>

              {isAdmin && member._id !== currentUser?._id && (
                <div className="member-actions">
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member._id, e.target.value)
                    }
                    aria-label={`Change role for ${member.name}`}
                  >
                    <option value="Contributor">Contributor</option>
                    <option value="Manager">Manager</option>
                  </select>

                  <button
                    type="button"
                    className="remove-member-button"
                    onClick={() => handleRemoveMember(member._id)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default TeamMembers;
