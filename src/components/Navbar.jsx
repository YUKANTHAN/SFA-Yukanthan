import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAdminSession } from '../hooks/useAdminSession';
import Icon from './Icon';
import Logo from './Logo';
import ApiStatusBadge from './ApiStatusBadge';

const NAV_ITEMS = [
  { to: '/', label: 'Overview' },
  { to: '/submit', label: 'Submit Feedback' },
  { to: '/dashboard', label: 'Analytics' },
  { to: '/details', label: 'Records' },
];

function navClass({ isActive }) {
  return `transition-colors ${
    isActive
      ? 'text-on-surface font-headline-sm text-headline-sm'
      : 'font-body-md text-body-md text-on-surface-variant hover:text-on-surface'
  }`;
}

export default function Navbar() {
  const { isAdmin, loading, signOut } = useAdminSession();
  const { pathname } = useLocation();

  const onAuthSurface = pathname === '/login';

  return (
    <header className="fixed top-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 max-w-[1600px] mx-auto px-margin flex items-center justify-between gap-space-lg">
        <Link to="/" className="flex items-center gap-space-md shrink-0">
          <Logo size={32} />
          <span className="font-headline-md text-headline-md tracking-tight text-on-surface hidden sm:block">
            EduPulse Analytics
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-space-lg">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navClass} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-space-sm">
          <ApiStatusBadge />

          {isAdmin && !loading ? (
            <>
              <button
                type="button"
                onClick={signOut}
                className="hidden sm:inline-flex items-center gap-1.5 px-space-md py-space-xs rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-e1 hover:bg-surface-container-low hover:text-on-surface transition-colors"
              >
                <Icon name="logout" size={16} />
                Sign Out
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 w-9 h-9 rounded-full bg-primary-container text-on-secondary justify-center"
                title={isAdmin ? 'Administrator' : ''}
              >
                <Icon name="account_circle" size={20} />
              </Link>
            </>
          ) : onAuthSurface ? null : (
            <>
              <Link
                to="/submit"
                className="inline-flex items-center justify-center px-space-md py-space-xs rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-e1 hover:bg-surface-container-low transition-colors"
              >
                Give Feedback
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-space-md py-space-xs rounded-lg bg-primary-container text-on-secondary font-label-md text-label-md shadow-e1 hover:bg-inverse-surface hover:text-inverse-on-surface transition-colors"
              >
                Admin Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}