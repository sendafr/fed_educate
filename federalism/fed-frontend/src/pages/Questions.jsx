import React, { useState, useEffect } from 'react';
import { questionAPI } from '../api/api';
import '../styles/questions.css';

function Question() {
  const [questions, setQuestions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [formData, setFormData] = useState({
    quiz: '',
    question_text: '',
    question_type: 'multiple_choice',
    options: [],
    correct_answer: '',
    explanation: '',
    order: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    fetchQuestions();
    fetchQuizzes();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await questionAPI.getAll('/question/');
      setQuestions(response.data.data || []);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch questions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await questionAPI.getAll('/quiz/');
      setQuizzes(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch quizzes:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) : value,
    }));
  };

  const handleAddOption = () => {
    if (optionInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        options: [...prev.options, optionInput.trim()],
      }));
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.quiz || !formData.question_text || !formData.correct_answer) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate options for multiple choice
    if (formData.question_type === 'multiple_choice' && formData.options.length === 0) {
      setError('Multiple choice questions must have at least one option');
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        const response = await questionAPI.put(`/question/${editingId}/`, formData);
        setQuestions(questions.map((q) => (q.id === editingId ? response.data.data : q)));
        setEditingId(null);
      } else {
        const response = await questionAPI.post('/question/', formData);
        setQuestions([response.data.data, ...questions]);
      }
      setFormData({
        quiz: '',
        question_text: '',
        question_type: 'multiple_choice',
        options: [],
        correct_answer: '',
        explanation: '',
        order: 0,
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save question');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (question) => {
    setFormData(question);
    setEditingId(question.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      await questionAPI.delete(`/question/${id}/`);
      setQuestions(questions.filter((q) => q.id !== id));
    } catch (err) {
      setError('Failed to delete question');
      console.error(err);
    }
  };

  return (
    <div className="question-container">
      <h1>❓ Question Management</h1>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="question-form">
        <div className="form-group">
          <label htmlFor="quiz">Quiz *</label>
          <select
            id="quiz"
            name="quiz"
            value={formData.quiz}
            onChange={handleChange}
            required
          >
            <option value="">Select a quiz</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="question_text">Question Text *</label>
          <textarea
            id="question_text"
            name="question_text"
            value={formData.question_text}
            onChange={handleChange}
            required
            placeholder="Enter the question"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="question_type">Question Type *</label>
          <select
            id="question_type"
            name="question_type"
            value={formData.question_type}
            onChange={handleChange}
            required
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="fill_blank">Fill in the Blank</option>
            <option value="true_false">True/False</option>
            <option value="short_answer">Short Answer</option>
          </select>
        </div>

        {/* Options for Multiple Choice */}
        {formData.question_type === 'multiple_choice' && (
          <div className="form-group">
            <label>Options</label>
            <div className="options-input">
              <input
                type="text"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                placeholder="Enter an option"
              />
              <button type="button" onClick={handleAddOption} className="btn btn-secondary">
                Add Option
              </button>
            </div>
            <div className="options-list">
              {formData.options.map((option, index) => (
                <div key={index} className="option-item">
                  <span>{option}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="btn btn-delete-small"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="correct_answer">Correct Answer *</label>
          <input
            id="correct_answer"
            type="text"
            name="correct_answer"
            value={formData.correct_answer}
            onChange={handleChange}
            required
            placeholder="Enter the correct answer"
          />
        </div>

        <div className="form-group">
          <label htmlFor="explanation">Explanation</label>
          <textarea
            id="explanation"
            name="explanation"
            value={formData.explanation}
            onChange={handleChange}
            placeholder="Explain why this is the correct answer"
            rows="3"
          />
        </div>

        <div className="form-group">
          <label htmlFor="order">Order</label>
          <input
            id="order"
            type="number"
            name="order"
            value={formData.order}
            onChange={handleChange}
            min="0"
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Saving...' : editingId ? 'Update Question' : 'Create Question'}
        </button>
        {editingId && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setEditingId(null);
              setFormData({
                quiz: '',
                question_text: '',
                question_type: 'multiple_choice',
                options: [],
                correct_answer: '',
                explanation: '',
                order: 0,
              });
            }}
          >
            Cancel
          </button>
        )}
      </form>

      <div className="question-list">
        <h2>All Questions</h2>
        {loading && !questions.length ? (
          <p>Loading...</p>
        ) : questions.length > 0 ? (
          questions.map((question) => (
            <div key={question.id} className="question-item">
              <h3>{question.question_text}</h3>
              <p>
                <strong>Type:</strong> {question.question_type}
              </p>
              {question.options && question.options.length > 0 && (
                <div>
                  <strong>Options:</strong>
                  <ul>
                    {question.options.map((option, index) => (
                      <li key={index}>{option}</li>
                    ))}
                  </ul>
                </div>
              )}
              <p>
                <strong>Correct Answer:</strong> {question.correct_answer}
              </p>
              {question.explanation && (
                <p>
                  <strong>Explanation:</strong> {question.explanation}
                </p>
              )}
              <div className="question-actions">
                <button onClick={() => handleEdit(question)} className="btn btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(question.id)} className="btn btn-delete">
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <p>No questions available</p>
        )}
      </div>
    </div>
  );
}

export default Question;