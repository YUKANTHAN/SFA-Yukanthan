import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import SubmitFeedback from './pages/SubmitFeedback';
import FeedbackSuccess from './pages/FeedbackSuccess';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import FeedbackDetails from './pages/FeedbackDetails';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<SubmitFeedback />} />
            <Route path="/success" element={<FeedbackSuccess />} />
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/details" element={<FeedbackDetails />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
