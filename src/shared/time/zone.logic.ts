export interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function localParts(instant: Date, timeZone: string): LocalParts {
  const found: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(instant)) {
    if (part.type !== 'literal') found[part.type] = Number(part.value);
  }
  return {
    year: found.year ?? 0,
    month: found.month ?? 0,
    day: found.day ?? 0,
    hour: found.hour ?? 0,
    minute: found.minute ?? 0,
    second: found.second ?? 0,
  };
}

const pad = (value: number, width = 2): string => String(value).padStart(width, '0');

export function formatDate(parts: Pick<LocalParts, 'year' | 'month' | 'day'>): string {
  return `${pad(parts.year, 4)}-${pad(parts.month)}-${pad(parts.day)}`;
}

/** Local calendar date `YYYY-MM-DD` of an instant in a time zone. */
export function localDate(instant: Date, timeZone: string): string {
  return formatDate(localParts(instant, timeZone));
}

/** `YYYY-MM-DD HH:mm` for display in the dev menu. */
export function formatLocal(instant: Date, timeZone: string): string {
  const parts = localParts(instant, timeZone);
  return `${formatDate(parts)} ${pad(parts.hour)}:${pad(parts.minute)}`;
}

function asUtcMs(parts: LocalParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

/** The instant at which the wall clock in `timeZone` reads `YYYY-MM-DDTHH:mm[:ss]`. */
export function fromLocal(localIso: string, timeZone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(localIso);
  if (!match) throw new Error(`Expected YYYY-MM-DDTHH:mm, got "${localIso}"`);
  const [year, month, day, hour, minute, second] = match.slice(1).map((v) => Number(v ?? 0));
  const wanted = asUtcMs({
    year: year ?? 0,
    month: month ?? 0,
    day: day ?? 0,
    hour: hour ?? 0,
    minute: minute ?? 0,
    second: second ?? 0,
  });
  let ms = wanted;
  // Two passes: the second corrects the offset when the first guess lands across a DST change.
  for (let pass = 0; pass < 2; pass += 1) {
    ms -= asUtcMs(localParts(new Date(ms), timeZone)) - wanted;
  }
  return new Date(ms);
}

export function shiftInstant(instant: Date, ms: number): Date {
  return new Date(instant.getTime() + ms);
}

export function instantFromIso(iso: string): Date {
  const instant = new Date(iso);
  if (Number.isNaN(instant.getTime())) throw new Error(`Not a timestamp: "${iso}"`);
  return instant;
}
