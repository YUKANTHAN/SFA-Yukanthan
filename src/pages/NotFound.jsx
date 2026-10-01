import { Link } from 'react-router-dom';
import Icon from '../components/Icon';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-margin">
      <div className="text-center flex flex-col items-center gap-space-md">
        <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-secondary">
          <Icon name="explore_off" size={32} />
        </div>
        <span className="overline text-secondary">Error 404</span>
        <h1 className="font-display-lg-mobile text-display-lg-mobile text-on-surface">
          This page is not in the corpus
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          The route you requested does not match any screen in the EduPulse workspace.
        </p>
        <Link to="/" className="btn-primary mt-space-sm">
          <Icon name="arrow_back" size={18} />
          Return to Overview
        </Link>
      </div>
    </div>
  );
}