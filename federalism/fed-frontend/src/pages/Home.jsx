// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { sectionAPI } from "../api/api";
import "../styles/home.css";

function Home() {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await sectionAPI.getAll();
        const data = response.data;

        // Handle different response formats
        if (Array.isArray(data)) {
          setSections(data);
        } else if (data.results && Array.isArray(data.results)) {
          setSections(data.results); // DRF pagination format
        } else if (data.data && Array.isArray(data.data)) {
          setSections(data.data); // Envelope format
        } else {
          setSections([]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="home">
      <div className="hero">
        <h1>🏛️ Understanding Federalism</h1>
        <p>A comprehensive guide to federal systems of governance</p>
        <Link to="/section/1" className="btn">Start Learning →</Link>
      </div>

      <div className="features">
        <div className="feature">
          <h3>📚 Learn Federalism</h3>
          <p>Understand the fundamentals of federalism and its importance.</p>
        </div>
        <div className="feature">
          <h3>🎬 Interactive Content</h3>
          <p>Explore videos, infographics, charts, and maps.</p>
        </div>
        <div className="feature">
          <h3>🌍 Real-World Cases</h3>
          <p>Study case studies from countries practicing federalism.</p>
        </div>
        <div className="feature">
          <h3>✅ Test Your Knowledge</h3>
          <p>Take quizzes and assessments to evaluate your understanding.</p>
        </div>
      </div>

      <div className="sections">
        <h2>Available Sections</h2>
        {sections.length > 0 ? (
          sections.map((section) => (
            <Link
              key={section.id}
              to={`/section/${section.id}`}
              className="section-card"
            >
              <h3>{section.title}</h3>
              <p>{section.description}</p>
            </Link>
          ))
        ) : (
          <p>No sections available yet.</p>
        )}
      </div>
    </div>
  );
}

export default Home;