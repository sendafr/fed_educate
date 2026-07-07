import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { authAPI } from '../api/api';
import '../styles/auth.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from registration
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Pre-fill username if coming from registration
      if (location.state?.username) {
        setFormData((prev) => ({
          ...prev,
          username: location.state.username,
        }));
      }
      // Clear the state after displaying
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Username and password are required');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.login(formData.username, formData.password);

      // Extract tokens from response
      const { access, refresh } = response.data;

      // Store tokens
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      setSuccess('Login successful! Redirecting...');

      // Redirect to home after 1 second
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.detail) {
        setError(errorData.detail);
      } else if (errorData?.non_field_errors) {
        setError(errorData.non_field_errors);
      } else if (errorData?.username) {
        setError('Invalid username or password');
      } else if (errorData?.password) {
        setError('Invalid username or password');
      } else {
        setError('Login failed. Please check your credentials.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>🏛️ Federalism Edu</h1>
          <p className="subtitle">Welcome Back</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your username or email"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Create one
            </Link>
          </p>
          <p>
            <Link to="/" className="auth-link">
              Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;