import React, { useState, useEffect } from 'react';
import { userQuizResponseAPI, quizAPI } from '../api/api';


function UserQuizResponse() {
  const [responses, setResponses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('attempts');
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [filterCorrect, setFilterCorrect] = useState('');

  useEffect(() => {
    fetchAttempts();
    fetchQuizzes();
  }, []);

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      const response = await userQuizResponseAPI.getAttempts();
      setAttempts(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch attempts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await quizAPI.getAll();
      setQuizzes(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    }
  };

  const fetchResponses = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await userQuizResponseAPI.getAll(filters);
      setResponses(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch responses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async (quizId) => {
    try {
      setLoading(true);
      const response = await userQuizResponseAPI.getStatistics(quizId);
      setStatistics(response.data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStatistics = (quizId) => {
    setSelectedQuizId(quizId);
    fetchStatistics(quizId);
    setActiveTab('statistics');
  };

  const handleViewResponses = (quizId) => {
    setSelectedQuizId(quizId);
    fetchResponses({ quiz_id: quizId });
    setActiveTab('responses');
  };

  const handleFilterResponses = async () => {
    const filters = {};
    if (selectedQuizId) filters.quiz_id = selectedQuizId;
    if (filterCorrect) filters.is_correct = filterCorrect;
    await fetchResponses(filters);
  };

  const handleDeleteResponse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this response?')) return;

    try {
      await userQuizResponseAPI.delete(id);
      setResponses(responses.filter((r) => r.id !== id));
      setSuccess('Response deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete response');
      console.error(err);
    }
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  return (
    <div className="user-quiz-response-container">
      <h1>📊 My Quiz Results</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Tabs */}
      <div className="response-tabs">
        <button
          className={`tab-button ${activeTab === 'attempts' ? 'active' : ''}`}
          onClick={() => setActiveTab('attempts')}
        >
          Quiz Attempts
        </button>
        <button
          className={`tab-button ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          Statistics
        </button>
        <button
          className={`tab-button ${activeTab === 'responses' ? 'active' : ''}`}
          onClick={() => setActiveTab('responses')}
        >
          Detailed Responses
        </button>
      </div>

      {/* Quiz Attempts Tab */}
      {activeTab === 'attempts' && (
        <div className="response-section">
          <h2>Quiz Attempts</h2>
          {loading && !attempts.length ? (
            <p className="loading">Loading attempts...</p>
          ) : attempts.length > 0 ? (
            <div className="attempts-grid">
              {attempts.map((attempt) => {
                const scorePercentage = (attempt.correct / attempt.total_responses) * 100;
                return (
                  <div key={attempt.quiz_id} className="attempt-card">
                    <div className="attempt-header">
                      <h3>{attempt.quiz_title}</h3>
                      <div
                        className="score-badge"
                        style={{ backgroundColor: getScoreColor(scorePercentage) }}
                      >
                        {scorePercentage.toFixed(0)}%
                      </div>
                    </div>

                    <div className="attempt-stats">
                      <div className="stat">
                        <span className="stat-label">Total Questions:</span>
                        <span className="stat-value">{attempt.total_responses}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Correct:</span>
                        <span className="stat-value correct">{attempt.correct}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Incorrect:</span>
                        <span className="stat-value incorrect">{attempt.incorrect}</span>
                      </div>
                      <div className="stat">
                        <span className="stat-label">Last Attempted:</span>
                        <span className="stat-value">
                          {new Date(attempt.last_attempted).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="attempt-actions">
                      <button
                        onClick={() => handleViewStatistics(attempt.quiz_id)}
                        className="btn btn-primary"
                      >
                        View Statistics
                      </button>
                      <button
                        onClick={() => handleViewResponses(attempt.quiz_id)}
                        className="btn btn-secondary"
                      >
                        View Responses
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="no-attempts">No quiz attempts yet. Take a quiz to get started!</p>
          )}
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && statistics && (
        <div className="response-section">
          <h2>Statistics - {statistics.quiz_title}</h2>
          <div className="statistics-container">
            <div className="stat-card">
              <h3>Score</h3>
              <div
                className="score-display"
                style={{ backgroundColor: getScoreColor(statistics.score_percentage) }}
              >
                {statistics.score_percentage.toFixed(1)}%
              </div>
            </div>

            <div className="stat-card">
              <h3>Correct Answers</h3>
              <p className="stat-number correct">{statistics.correct_answers}</p>
              <p className="stat-label">out of {statistics.total_questions}</p>
            </div>

            <div className="stat-card">
              <h3>Incorrect Answers</h3>
              <p className="stat-number incorrect">{statistics.incorrect_answers}</p>
              <p className="stat-label">out of {statistics.total_questions}</p>
            </div>

            <div className="stat-card">
              <h3>Status</h3>
              <p className={`status ${statistics.passed ? 'passed' : 'failed'}`}>
                {statistics.passed ? '✓ PASSED' : '✗ FAILED'}
              </p>
              <p className="stat-label">Passing Score: {statistics.passing_score}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Responses Tab */}
      {activeTab === 'responses' && (
        <div className="response-section">
          <h2>Detailed Responses</h2>

          {/* Filters */}
          <div className="filters-section">
            <div className="filters">
              <div className="filter-group">
                <label htmlFor="filterCorrect">Filter by Result</label>
                <select
                  id="filterCorrect"
                  value={filterCorrect}
                  onChange={(e) => setFilterCorrect(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Correct</option>
                  <option value="false">Incorrect</option>
                </select>
              </div>

              <button onClick={handleFilterResponses} className="btn btn-filter">
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setFilterCorrect('');
                  fetchResponses({ quiz_id: selectedQuizId });
                }}
                className="btn btn-filter-clear"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {loading && !responses.length ? (
            <p className="loading">Loading responses...</p>
          ) : responses.length > 0 ? (
            <div className="responses-list">
              {responses.map((response) => (
                <div
                  key={response.id}
                  className={`response-item ${response.is_correct ? 'correct' : 'incorrect'}`}
                >
                  <div className="response-header">
                    <span className="result-badge">
                      {response.is_correct ? '✓ Correct' : '✗ Incorrect'}
                    </span>
                    <span className="question-number">Q{response.question_details?.id}</span>
                  </div>

                  <div className="response-body">
                    <p className="question">
                      <strong>Question:</strong> {response.question_text}
                    </p>
                    <p className="user-answer">
                      <strong>Your Answer:</strong> {response.user_answer}
                    </p>
                    <p className="correct-answer">
                      <strong>Correct Answer:</strong> {response.question_details?.correct_answer}
                    </p>
                    {response.question_details?.explanation && (
                      <p className="explanation">
                        <strong>Explanation:</strong> {response.question_details.explanation}
                      </p>
                    )}
                  </div>

                  <div className="response-footer">
                    <small>Answered: {new Date(response.timestamp).toLocaleString()}</small>
                    <button
                      onClick={() => handleDeleteResponse(response.id)}
                      className="btn btn-delete-small"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-responses">No responses found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default UserQuizResponse;