import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import FeedbackDetails from './pages/FeedbackDetails';
import FeedbackSuccess from './pages/FeedbackSuccess';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import SubmitFeedback from './pages/SubmitFeedback';

function Shell({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Navbar />
      <main className="flex-1 w-full pt-16">{children}</main>
      <Footer />
    </div>
  );
}

function withShell(element) {
  return <Shell>{element}</Shell>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={withShell(<Home />)} />
        <Route path="/submit" element={withShell(<SubmitFeedback />)} />
        <Route path="/success" element={withShell(<FeedbackSuccess />)} />
        <Route path="/login" element={withShell(<AdminLogin />)} />
        <Route path="/dashboard" element={withShell(<Dashboard />)} />
        <Route path="/details" element={withShell(<FeedbackDetails />)} />
        <Route path="*" element={withShell(<NotFound />)} />
      </Routes>
    </BrowserRouter>
  );
}