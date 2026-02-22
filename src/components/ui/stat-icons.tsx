interface StatIconProps {
  size?: number;
  color?: string;
}

export function GoalIcon({ size = 16, color = 'currentColor' }: StatIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Goal net */}
      <rect x="2" y="6" width="20" height="14" rx="1" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="2" y1="14" x2="22" y2="14" />
      <line x1="2" y1="18" x2="22" y2="18" />
      <line x1="7" y1="6" x2="7" y2="20" />
      <line x1="12" y1="6" x2="12" y2="20" />
      <line x1="17" y1="6" x2="17" y2="20" />
    </svg>
  );
}

export function DemoIcon({ size = 16, color = 'currentColor' }: StatIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Explosion rays */}
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.93" y1="4.93" x2="7.05" y2="7.05" />
      <line x1="16.95" y1="16.95" x2="19.07" y2="19.07" />
      <line x1="4.93" y1="19.07" x2="7.05" y2="16.95" />
      <line x1="16.95" y1="7.05" x2="19.07" y2="4.93" />
    </svg>
  );
}

export function AssistIcon({ size = 16, color = 'currentColor' }: StatIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Fist bump from front */}
      <path d="M7 13V8a1 1 0 0 1 2 0v4" />
      <path d="M9 10V6a1 1 0 0 1 2 0v5" />
      <path d="M11 9V7a1 1 0 0 1 2 0v6" />
      <path d="M13 10V9a1 1 0 0 1 2 0v4" />
      <path d="M7 13a4 4 0 0 0 4 4h1a4 4 0 0 0 4-4v-1" />
      <path d="M7 13a2 2 0 0 1-2-2V9a1 1 0 0 1 2 0" />
    </svg>
  );
}

export function ScoreIcon({ size = 16, color = 'currentColor' }: StatIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Bar chart */}
      <rect x="3" y="12" width="4" height="9" rx="0.5" />
      <rect x="10" y="7" width="4" height="14" rx="0.5" />
      <rect x="17" y="3" width="4" height="18" rx="0.5" />
    </svg>
  );
}
