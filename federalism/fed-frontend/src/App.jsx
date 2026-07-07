// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Users from "./pages/Users.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Home from "./pages/Home.jsx";
import Content from "./pages/Content.jsx";
import Section from "./pages/Section.jsx";
import Drawbacks from "./pages/Drawbacks.jsx";
import Benefits from "./pages/Benefits.jsx";
import Quiz from "./pages/Quiz.jsx";
import Question from "./pages/Questions.jsx";
import Media from "./pages/Media.jsx";
import Comparison from "./pages/Comparison.jsx";
import CaseStudy from "./pages/CaseStudy.jsx";
import UserQuizResponse from "./pages/UserQuizResponse.jsx";
import Profile from "./pages/Profile.jsx";
import MediaExternal from "./pages/MediaExternal.jsx";

// Protected Route Component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  const token = localStorage.getItem("access_token");

  return (
    <Router>
      <Routes>
        {/* ─── Public Routes ─────────────────────────────────────────────────── */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ─── Protected Routes ──────────────────────────────────────────────── */}
        
        {/* Home */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Home />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Content Management */}
        <Route
          path="/content"
          element={
            <ProtectedRoute>
              <Layout>
                <Content />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* benefits Management */}
        <Route
          path="/benefits"
          element={
            <ProtectedRoute>
              <Layout>
                <Benefits />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Protected Routes - Admin */}
          <Route 
          path="/users"
           element={
           <ProtectedRoute>
            <Layout>
    
            <Users />

            </Layout>
            </ProtectedRoute>} />

        {/* drawbacks Management */}
        <Route
          path="/drawbacks"
          element={
            <ProtectedRoute>
              <Layout>
                <Drawbacks />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Section Management */}
        <Route
          path="/section"
          element={
            <ProtectedRoute>
              <Layout>
                <Section />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/section/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Section />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Quiz Management */}
        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Layout>
                <Quiz />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Question Management */}
        <Route
          path="/question"
          element={
            <ProtectedRoute>
              <Layout>
                <Question />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/question/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Question />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Media Management */}
        <Route
          path="/media"
          element={
            <ProtectedRoute>
              <Layout>
                <Media />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* External Media Management */}
        <Route
          path="/external-media"
          element={
            <ProtectedRoute>
              <Layout>
                <MediaExternal />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Comparison Management */}
        <Route
          path="/comparison"
          element={
            <ProtectedRoute>
              <Layout>
                <Comparison />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/comparison/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <Comparison />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Case Study Management */}
        <Route
          path="/case-study"
          element={
            <ProtectedRoute>
              <Layout>
                <CaseStudy />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/case-study/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CaseStudy />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* User Quiz Response */}
        <Route
          path="/quiz-response"
          element={
            <ProtectedRoute>
              <Layout>
                <UserQuizResponse />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home or login */}
        <Route 
          path="*" 
          element={<Navigate to={token ? "/" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;