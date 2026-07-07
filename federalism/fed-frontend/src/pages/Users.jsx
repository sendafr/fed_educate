// src/pages/Users.jsx
import React, { useEffect, useState } from "react";
import { userAPI } from "../api/api";
import "../styles/users.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll();
      const data = response.data;

      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data.results && Array.isArray(data.results)) {
        setUsers(data.results);
      } else if (data.data && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
    });
  };

  const handleSave = async (userId) => {
    try {
      await userAPI.updateUser(userId, formData);
      setUsers(users.map(u => u.id === userId ? { ...u, ...formData } : u));
      setEditingId(null);
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userAPI.deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
      } catch (err) {
        setError('Failed to delete user');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="users-page">
      <h1>👥 User Management</h1>
      <p className="intro">Manage and view user accounts.</p>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>
                  {editingId === user.id ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td>
                  {editingId === user.id ? (
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    />
                  ) : (
                    user.first_name
                  )}
                </td>
                <td>
                  {editingId === user.id ? (
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    />
                  ) : (
                    user.last_name
                  )}
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  {editingId === user.id ? (
                    <>
                      <button onClick={() => handleSave(user.id)} className="btn btn-save">
                        Save
                      </button>
                      <button onClick={() => setEditingId(null)} className="btn btn-cancel">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(user)} className="btn btn-edit">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="btn btn-delete">
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Users;