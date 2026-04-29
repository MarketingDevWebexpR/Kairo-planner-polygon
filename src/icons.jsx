export const Icon = {
  Plus: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  ),
  Minus: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 8h10" />
    </svg>
  ),
  X: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  ChevL: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3l-5 5 5 5" />
    </svg>
  ),
  ChevR: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3l5 5-5 5" />
    </svg>
  ),
  Pencil: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 2.5l2 2-8 8H3.5v-2l8-8zM10 4l2 2" />
    </svg>
  ),
  Trash: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h10M6 4V2.5h4V4M5 4l.7 9h4.6L11 4M7 7v3M9 7v3" />
    </svg>
  ),
  Search: ({ s = 12 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L13 13" />
    </svg>
  ),
  Filter: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 4h12M4.5 8h7M7 12h2" />
    </svg>
  ),
  Sliders: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 4h10M3 8h10M3 12h10" />
      <circle cx="6" cy="4" r="1.6" fill="white" />
      <circle cx="11" cy="8" r="1.6" fill="white" />
      <circle cx="5" cy="12" r="1.6" fill="white" />
    </svg>
  ),
  Bulb: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.8c-2.2 0-4 1.7-4 3.9 0 1.5.8 2.5 1.5 3.2.4.4.5.7.5 1.3v.3h4v-.3c0-.6.1-.9.5-1.3.7-.7 1.5-1.7 1.5-3.2 0-2.2-1.8-3.9-4-3.9z" />
      <path d="M6 12.5h4M7 14.2h2" />
    </svg>
  ),
  Sparkles: ({ s = 14 }) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" stroke="none">
      <path d="M6 1.5 L7 5 L10.5 6 L7 7 L6 10.5 L5 7 L1.5 6 L5 5 Z" />
      <path d="M12 8.5 L12.5 10.5 L14.5 11 L12.5 11.5 L12 13.5 L11.5 11.5 L9.5 11 L11.5 10.5 Z" />
    </svg>
  ),
};
