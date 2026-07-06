import React, { useState, useEffect } from 'react';
import { quizAPI, sectionAPI } from '../api/api';
import '../styles/quiz.css';

function Quiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [sections, setSections] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    section: '',
    difficulty: 'easy',
    is_published: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchQuizzes();
    fetchSections();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizAPI.getAll();
      
      // Handle different response formats
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        data = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      }
      
      console.log('Fetched quizzes:', data);
      setQuizzes(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch quizzes');
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await sectionAPI.getAll();
      
      // Handle different response formats
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data?.results && Array.isArray(response.data.results)) {
        data = response.data.results;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      }
      
      setSections(data);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.title || !formData.section) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        const response = await quizAPI.update(editingId, formData);
        const updatedQuiz = response.data?.data || response.data;
        setQuizzes(quizzes.map((q) => (q.id === editingId ? updatedQuiz : q)));
        setEditingId(null);
      } else {
        const response = await quizAPI.create(formData);
        const newQuiz = response.data?.data || response.data;
        setQuizzes([newQuiz, ...quizzes]);
      }
      setFormData({
        title: '',
        section: '',
        difficulty: 'easy',
        is_published: true,
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save quiz');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (quiz) => {
    setFormData(quiz);
    setEditingId(quiz.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;

    try {
      await quizAPI.delete(id);
      setQuizzes(quizzes.filter((q) => q.id !== id));
    } catch (err) {
      setError('Failed to delete quiz');
      console.error(err);
    }
  };

  const getDifficultyColor = (difficulty) => {
    if (!difficulty) return '#6c757d';
    
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return '#28a745';
      case 'medium':
        return '#ffc107';
      case 'hard':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const formatDifficulty = (difficulty) => {
    if (!difficulty) return 'Unknown';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <div className="quiz-container">
      <h1>📝 Quiz Management</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="quiz-form">
        <div className="form-group">
          <label htmlFor="title">Quiz Title *</label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Enter quiz title"
            maxLength="300"
          />
        </div>

        <div className="form-group">
          <label htmlFor="section">Section *</label>
          <select
            id="section"
            name="section"
            value={formData.section}
            onChange={handleChange}
            required
          >
            <option value="">Select a section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level</label>
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="form-group checkbox">
            <label htmlFor="is_published">
              <input
                id="is_published"
                type="checkbox"
                name="is_published"
                checked={formData.is_published}
                onChange={handleChange}
              />
              Publish Quiz
            </label>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : editingId ? 'Update Quiz' : 'Create Quiz'}
        </button>
        {editingId && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setEditingId(null);
              setFormData({
                title: '',
                section: '',
                difficulty: 'easy',
                is_published: true,
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="quiz-list">
        <h2>All Quizzes</h2>
        {loading && !quizzes.length ? (
          <p>Loading...</p>
        ) : quizzes.length > 0 ? (
          quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-item">
              <div className="quiz-header">
                <h3>{quiz.title || 'Untitled Quiz'}</h3>
                {quiz.difficulty && (
                  <span
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(quiz.difficulty) }}
                  >
                    {formatDifficulty(quiz.difficulty)}
                  </span>
                )}
              </div>
              <p>
                <strong>Section:</strong> {quiz.section || 'N/A'}
              </p>
              <p>
                <strong>Status:</strong> {quiz.is_published ? '✓ Published' : '✗ Draft'}
              </p>
              {quiz.created_at && (
                <p>
                  <strong>Created:</strong> {new Date(quiz.created_at).toLocaleDateString()}
                </p>
              )}
              <div className="quiz-actions">
                <button onClick={() => handleEdit(quiz)} className="btn btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(quiz.id)} className="btn btn-delete">
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No quizzes available</p>
        )}
      </div>
    </div>
  );
}

export default Quiz;