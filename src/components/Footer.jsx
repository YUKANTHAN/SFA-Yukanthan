import { Link } from 'react-router-dom';
import { BRAND } from '../lib/design';
import Logo from './Logo';

// Resolved once at module load. Reading the clock during render would make the
// year change mid-session and re-render for no reason.
const COPYRIGHT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="w-full bg-surface-container-low py-space-lg">
      <div className="max-w-[1600px] mx-auto px-margin flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant font-body-sm text-body-sm">
        <div className="flex items-center gap-space-sm">
          <Logo size={24} className="opacity-80" />
          <span>
            © {COPYRIGHT_YEAR} {BRAND.name}. Rigorous institutional insight.
          </span>
        </div>
        <div className="flex items-center gap-space-lg">
          <Link to="/submit" className="hover:text-on-surface transition-colors">
            Evaluation Rubric
          </Link>
          <span className="hidden sm:inline hover:text-on-surface transition-colors">FERPA Compliance</span>
          <span className="hidden sm:inline hover:text-on-surface transition-colors">Security Protocol</span>
        </div>
      </div>
    </footer>
  );
}