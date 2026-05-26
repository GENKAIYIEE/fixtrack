/**
 * Parses a backend timestamp string as an explicit UTC instant before
 * computing the relative "time ago" string.
 *
 * Why this matters
 * ────────────────
 * Prisma / databases emit ISO-8601 strings that may or may not carry a
 * trailing "Z" (e.g. "2024-06-01T10:30:00.000" vs "…Z"). When the "Z" is
 * absent, JavaScript's Date constructor treats the value as *local* time,
 * introducing a silent offset equal to the client's UTC offset (e.g. +8 h
 * for Philippine Standard Time). Appending "Z" when missing forces JS to
 * always interpret the value as UTC, which is the correct reference frame
 * for all calculations below.
 *
 * @param timestamp - ISO-8601 date string from the backend (with or without Z)
 * @returns Human-readable relative time string (e.g. "3 min ago")
 */
export function formatRelativeTime(timestamp: string): string {
  // Normalise to UTC: append Z only when no timezone designator is present.
  const utcString = /[Zz]$|[+-]\d{2}:\d{2}$/.test(timestamp)
    ? timestamp
    : `${timestamp}Z`;

  const date = new Date(utcString);

  // Guard against invalid input silently.
  if (isNaN(date.getTime())) return '';

  const diffMs   = Date.now() - date.getTime(); // both values are UTC epoch ms
  const diffMins  = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays  = Math.floor(diffMs / 86_400_000);

  if (diffMins  <  1) return 'Just now';
  if (diffMins  < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays  <  7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  // Older than a week — show a locale-formatted date in the *client's* local
  // timezone so the display date matches what the user expects.
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
