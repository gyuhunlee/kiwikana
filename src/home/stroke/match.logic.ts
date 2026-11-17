// ST-20 (default NQ-9). All points are in the 0–1 square. Thresholds are starting values (ST-24).

export type Point = readonly [number, number];

export const MATCH = {
  samples: 24,
  startTolerance: 0.2,
  endTolerance: 0.25,
  maxAngleDegrees: 60,
  loopDistance: 0.1,
  maxMeanDistance: 0.18,
  minLengthRatio: 0.5,
  maxLengthRatio: 2.0,
  minPathLength: 0.03,
} as const;

export type StrokeVerdict = 'accepted' | 'rejected' | 'ignored';

const distance = (a: Point, b: Point): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function pathLength(points: readonly Point[]): number {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    if (previous && current) total += distance(previous, current);
  }
  return total;
}

/** `count` points spaced evenly along the path. */
export function resample(points: readonly Point[], count: number): Point[] {
  const first = points[0];
  if (!first) return [];
  const step = pathLength(points) / (count - 1);
  const result: Point[] = [first];
  if (step > 0) {
    let previous: Point = first;
    let carried = 0;
    for (const current of points.slice(1)) {
      let segment = distance(previous, current);
      while (carried + segment >= step && result.length < count - 1) {
        const t = (step - carried) / segment;
        previous = [previous[0] + (current[0] - previous[0]) * t, previous[1] + (current[1] - previous[1]) * t];
        result.push(previous);
        segment = distance(previous, current);
        carried = 0;
      }
      carried += segment;
      previous = current;
    }
  }
  const last = points[points.length - 1] ?? first;
  while (result.length < count) result.push(last);
  return result;
}

function angleBetweenDegrees(a: Point, b: Point): number {
  const dot = a[0] * b[0] + a[1] * b[1];
  const size = Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]);
  if (size === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / size))) * 180) / Math.PI;
}

export function matchStroke(user: readonly Point[], reference: readonly Point[]): StrokeVerdict {
  const userLength = pathLength(user);
  // ST-22: a tap is not a miss.
  if (user.length < 2 || userLength < MATCH.minPathLength) return 'ignored';

  const drawn = resample(user, MATCH.samples);
  const wanted = resample(reference, MATCH.samples);
  const [drawnStart, drawnEnd] = [drawn[0], drawn[drawn.length - 1]];
  const [wantedStart, wantedEnd] = [wanted[0], wanted[wanted.length - 1]];
  if (!drawnStart || !drawnEnd || !wantedStart || !wantedEnd) return 'rejected';

  if (distance(drawnStart, wantedStart) > MATCH.startTolerance) return 'rejected'; // ST-21 falls out of this
  if (distance(drawnEnd, wantedEnd) > MATCH.endTolerance) return 'rejected';

  // Direction is meaningless for a loop that ends near where it starts.
  if (distance(wantedStart, wantedEnd) >= MATCH.loopDistance) {
    const drawnDirection: Point = [drawnEnd[0] - drawnStart[0], drawnEnd[1] - drawnStart[1]];
    const wantedDirection: Point = [wantedEnd[0] - wantedStart[0], wantedEnd[1] - wantedStart[1]];
    if (angleBetweenDegrees(drawnDirection, wantedDirection) > MATCH.maxAngleDegrees) return 'rejected';
  }

  const meanDistance =
    drawn.reduce((sum, point, index) => sum + distance(point, wanted[index] ?? point), 0) / MATCH.samples;
  if (meanDistance > MATCH.maxMeanDistance) return 'rejected';

  const ratio = userLength / pathLength(reference);
  if (ratio < MATCH.minLengthRatio || ratio > MATCH.maxLengthRatio) return 'rejected';
  return 'accepted';
}

export interface TraceState {
  /** Index of the stroke expected next. Equal to the stroke count when the character is done. */
  nextStroke: number;
  /** Rejected attempts on the stroke expected next. */
  misses: number;
}

export const emptyTrace: TraceState = { nextStroke: 0, misses: 0 };
export const HINT_AFTER_MISSES = 2;

// ST-11: strokes are checked in order against the expected stroke.
export function drawStroke(
  trace: TraceState,
  user: readonly Point[],
  strokes: readonly (readonly Point[])[],
): { trace: TraceState; verdict: StrokeVerdict; traced: boolean } {
  const expected = strokes[trace.nextStroke];
  if (!expected) return { trace, verdict: 'ignored', traced: false };
  const verdict = matchStroke(user, expected);
  if (verdict === 'accepted') {
    const next = { nextStroke: trace.nextStroke + 1, misses: 0 };
    return { trace: next, verdict, traced: next.nextStroke === strokes.length }; // ST-13
  }
  if (verdict === 'rejected') return { trace: { ...trace, misses: trace.misses + 1 }, verdict, traced: false };
  return { trace, verdict, traced: false };
}

// ST-12: in Free-form the guide for the current stroke appears after 2 misses, until it is accepted.
export function showsGuide(trace: TraceState, mode: 'guided' | 'freeForm'): boolean {
  return mode === 'guided' || trace.misses >= HINT_AFTER_MISSES;
}
