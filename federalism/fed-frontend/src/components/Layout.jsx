import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api/api';
import '../styles/layout.css';

function Layout({ children }) {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('access_token');

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await authAPI.logout();
        navigate('/login');
      } catch (err) {
        console.error('Logout error:', err);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
      }
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            🏛️ Federalism Edu
          </Link>
          <ul className="nav-menu">
            <li className="nav-item">
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>

            {isAuthenticated && (
              <>
                {/* Learning Content */}
                <li className="nav-item dropdown">
                  <span className="nav-link dropdown-toggle">
                    📚 Learning
                  </span>
                  <ul className="dropdown-menu">
                    <li className="dropdown-item">
                      <Link to="/content" className="dropdown-link">
                        📖 Content
                      </Link>
                    </li>
                    <li className="dropdown-item">
                      <Link to="/quiz" className="dropdown-link">
                        ❓ Quizzes
                      </Link>
                    </li>
                    <li className="dropdown-item">
                      <Link to="/question" className="dropdown-link">
                        ❔ Questions
                      </Link>
                    </li>
                    <li className="dropdown-item">
                      <Link to="/user-quiz-response" className="dropdown-link">
                        📊 My Responses
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Federalism Info */}
                <li className="nav-item dropdown">
                  <span className="nav-link dropdown-toggle">
                    🏛️ Federalism
                  </span>
                  <ul className="dropdown-menu">
                    <li className="dropdown-item">
                      <Link to="/benefits" className="dropdown-link">
                        ✅ Benefits
                      </Link>
                    </li>
                    <li className="dropdown-item">
                      <Link to="/drawbacks" className="dropdown-link">
                        ⚠️ Drawbacks
                      </Link>
                    </li>
                    <li className="dropdown-item">
                      <Link to="/comparison" className="dropdown-link">
                        ⚖️ Comparison
                      </Link>
                    </li>
                    <li className="dropdown-item">
                      <Link to="/case-study" className="dropdown-link">
                        🔍 Case Studies
                      </Link>
                    </li>
                  </ul>
                </li>

                {/* Media */}
                <li className="nav-item">
                  <Link to="/media" className="nav-link">
                    📁 Media
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/external-media" className="nav-link">
                    🌐 External Media
                  </Link>
                </li>

                {/* Admin Section */}
                <li className="nav-item">
                  <Link to="/users" className="nav-link">
                    👥 Users
                  </Link>
                </li>

                {/* Profile */}
                <li className="nav-item">
                  <Link to="/profile" className="nav-link">
                    👤 Profile
                  </Link>
                </li>

                {/* Logout */}
                <li className="nav-item">
                  <button onClick={handleLogout} className="nav-link btn-logout">
                    Logout
                  </button>
                </li>
              </>
            )}

            {!isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link to="/login" className="nav-link">
                    Login
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/register" className="nav-link btn-register">
                    Register
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>
      <main className="main-content">{children}</main>
      <footer className="footer">
        <p>&copy; 2024 Federalism Edu. All rights reserved.</p>
      </footer>
    </>
  );
}

export default Layout;