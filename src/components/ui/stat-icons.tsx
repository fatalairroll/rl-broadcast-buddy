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
      {/* Spiky explosion star */}
      <polygon points="12,1 14,8 17,3 15,9 22,8 16,11 21,16 15,13 17,21 12,15 7,21 9,13 3,16 8,11 2,8 9,9 7,3 10,8" />
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
