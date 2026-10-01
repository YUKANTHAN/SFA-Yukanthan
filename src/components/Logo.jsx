/** EduPulse Analytics mark — from edupulse_analytics_logo/code.html */
export default function Logo({ size = 32, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="EduPulse Analytics"
    >
      <rect width="48" height="48" rx="12" fill="#0F172A" />
      <path d="M12 34V20C12 17.7909 13.7909 16 16 16H22V34H12Z" fill="#4F46E5" fillOpacity="0.3" />
      <path d="M26 16H32C34.2091 16 36 17.7909 36 20V34H26V16Z" fill="#4F46E5" fillOpacity="0.3" />
      <path
        d="M12 34C15 32 19 32 24 33.5C29 32 33 32 36 34"
        stroke="#6366F1"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <line x1="17" y1="28" x2="17" y2="24" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
      <line x1="24" y1="28" x2="24" y2="18" stroke="#6366F1" strokeWidth="3" strokeLinecap="round" />
      <line x1="31" y1="28" x2="31" y2="21" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="13" r="2.5" fill="#10B981" />
    </svg>
  )
}