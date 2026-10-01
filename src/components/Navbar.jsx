import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SupabaseStatusBadge from './SupabaseStatusBadge';
import { getCurrentAdminSession, logoutAdmin } from '../lib/supabase';
import { GraduationCap, MessageSquarePlus, LayoutDashboard, LogIn, LogOut, Table, Menu, X } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [location.pathname]);

  const checkAdminStatus = async () => {
    try {
      const sessionData = await getCurrentAdminSession();
      if (sessionData && (sessionData.data?.session || sessionData.user)) {
        setIsAdminLoggedIn(true);
      } else {
        setIsAdminLoggedIn(false);
      }
    } catch (err) {
      setIsAdminLoggedIn(false);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAdminLoggedIn(false);
    navigate('/login');
  };

  const navItemClass = (path) => {
    const isActive = location.pathname === path;
    return `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      isActive 
        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30' 
        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
              Feedback<span className="text-indigo-400">Analyzer</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Supabase AI Powered
            </p>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link to="/" className={navItemClass('/')}>
            Home
          </Link>
          <Link to="/submit" className={navItemClass('/submit')}>
            <MessageSquarePlus size={16} />
            Give Feedback
          </Link>
          {isAdminLoggedIn && (
            <>
              <Link to="/dashboard" className={navItemClass('/dashboard')}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link to="/details" className={navItemClass('/details')}>
                <Table size={16} />
                Feedback Details
              </Link>
            </>
          )}
        </nav>

        {/* Right Action buttons & status */}
        <div className="hidden md:flex items-center gap-3">
          <SupabaseStatusBadge />

          {isAdminLoggedIn ? (
            <button onClick={handleLogout} className="btn btn-secondary btn-sm flex items-center gap-1.5 text-rose-400 hover:text-rose-300 border-rose-900/30">
              <LogOut size={14} />
              Logout
            </button>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm flex items-center gap-1.5">
              <LogIn size={14} />
              Admin Login
            </Link>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <SupabaseStatusBadge />
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-800 space-y-2 animate-fade-in">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className={navItemClass('/')}>
            Home
          </Link>
          <Link to="/submit" onClick={() => setMobileMenuOpen(false)} className={navItemClass('/submit')}>
            <MessageSquarePlus size={16} />
            Give Feedback
          </Link>
          {isAdminLoggedIn && (
            <>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={navItemClass('/dashboard')}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link to="/details" onClick={() => setMobileMenuOpen(false)} className={navItemClass('/details')}>
                <Table size={16} />
                Feedback Details
              </Link>
            </>
          )}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
            {isAdminLoggedIn ? (
              <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="btn btn-secondary btn-sm text-rose-400 w-full">
                <LogOut size={14} />
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-sm w-full">
                <LogIn size={14} />
                Admin Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
