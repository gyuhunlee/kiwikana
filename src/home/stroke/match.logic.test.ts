import { describe, expect, it } from 'vitest';
import { rng } from '../../shared/random/rng.logic';
import { drawStroke, emptyTrace, matchStroke, pathLength, resample, showsGuide, type Point } from './match.logic';

// Hand-made stand-ins for the KanjiVG paths (CT-40) until the real stroke files exist (M2).
// Replace with recorded fixtures then (ST-23).
const line = (from: Point, to: Point): Point[] => [from, to];
const arc = (cx: number, cy: number, r: number, fromDeg: number, toDeg: number, steps = 16): Point[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as Point;
  });

const characters: Record<string, Point[][]> = {
  一: [line([0.1, 0.5], [0.9, 0.5])],
  十: [line([0.1, 0.45], [0.9, 0.45]), line([0.5, 0.1], [0.5, 0.9])],
  水: [
    [[0.5, 0.1], [0.5, 0.85], [0.42, 0.78]],
    [[0.15, 0.35], [0.4, 0.35], [0.2, 0.75]],
    line([0.78, 0.25], [0.56, 0.45]),
    line([0.55, 0.42], [0.88, 0.8]),
  ],
  あ: [
    line([0.25, 0.3], [0.75, 0.27]),
    [[0.45, 0.12], [0.42, 0.5], [0.5, 0.85]],
    // The last stroke of あ loops back near where it starts.
    [[0.68, 0.42], ...arc(0.5, 0.62, 0.22, -60, -300)],
  ],
  っ: [arc(0.45, 0.6, 0.2, -150, 80)],
};

function jitter(points: Point[], seed: number, amount = 0.03): Point[] {
  const random = rng(seed);
  return resample(points, 12).map(([x, y]) => [x + (random.next() - 0.5) * amount, y + (random.next() - 0.5) * amount] as Point);
}

describe('stroke matching', () => {
  for (const [char, strokes] of Object.entries(characters)) {
    it(`ST-20 ST-23 ${char}: the reference and a jittered copy are accepted`, () => {
      strokes.forEach((stroke, index) => {
        expect(matchStroke(stroke, stroke)).toBe('accepted');
        expect(matchStroke(jitter(stroke, index + 1), stroke)).toBe('accepted');
      });
    });

    it(`ST-21 ST-23 ${char}: a reversed copy is rejected`, () => {
      strokes.forEach((stroke) => {
        expect(matchStroke([...stroke].reverse(), stroke)).toBe('rejected');
      });
    });
  }

  it('ST-23 a wrong stroke of the same character is rejected', () => {
    for (const char of ['十', '水', 'あ']) {
      const strokes = characters[char] ?? [];
      strokes.forEach((expected, index) => {
        strokes.forEach((drawn, other) => {
          if (other !== index) expect(`${char} ${other}→${index} ${matchStroke(drawn, expected)}`).toContain('rejected');
        });
      });
    }
  });

  it('ST-20 each threshold rejects on its own', () => {
    const reference = line([0.1, 0.5], [0.9, 0.5]);
    expect(matchStroke(line([0.1, 0.75], [0.9, 0.5]), reference)).toBe('rejected'); // start too far
    expect(matchStroke(line([0.1, 0.5], [0.9, 0.8]), reference)).toBe('rejected'); // end too far
    expect(matchStroke([[0.1, 0.5], [0.5, 0.95], [0.9, 0.5]], reference)).toBe('rejected'); // shape too far
    expect(matchStroke([[0.1, 0.5], [0.5, 0.1], [0.3, 0.9], [0.7, 0.1], [0.9, 0.5]], reference)).toBe('rejected'); // too long
    expect(matchStroke(line([0.12, 0.52], [0.88, 0.47]), reference)).toBe('accepted');
  });

  it('ST-22 a tap or a very short path is ignored, not a miss', () => {
    const reference = line([0.1, 0.5], [0.9, 0.5]);
    expect(matchStroke([[0.5, 0.5]], reference)).toBe('ignored');
    expect(matchStroke(line([0.5, 0.5], [0.51, 0.51]), reference)).toBe('ignored');
    expect(drawStroke(emptyTrace, [[0.5, 0.5]], [reference]).trace).toEqual(emptyTrace);
  });

  it('resample keeps the ends and the length', () => {
    const path = characters['水']?.[1] ?? [];
    const sampled = resample(path, 24);
    expect(sampled).toHaveLength(24);
    expect(sampled[0]).toEqual(path[0]);
    expect(pathLength(sampled)).toBeCloseTo(pathLength(path), 1);
  });
});

describe('tracing a character', () => {
  const strokes = characters['十'] ?? [];
  const [first = [], second = []] = strokes;

  it('ST-11 strokes are checked in order: the second stroke drawn first is rejected', () => {
    const wrongOrder = drawStroke(emptyTrace, second, strokes);
    expect([wrongOrder.verdict, wrongOrder.trace.nextStroke]).toEqual(['rejected', 0]);
    const right = drawStroke(emptyTrace, first, strokes);
    expect([right.verdict, right.trace.nextStroke, right.traced]).toEqual(['accepted', 1, false]);
  });

  it('ST-13 the character is traced when all its strokes are accepted', () => {
    const afterFirst = drawStroke(emptyTrace, first, strokes).trace;
    expect(drawStroke(afterFirst, second, strokes).traced).toBe(true);
  });

  it('ST-12 free-form: the guide for a stroke shows after 2 misses and goes once it is accepted', () => {
    let trace = emptyTrace;
    expect(showsGuide(trace, 'freeForm')).toBe(false);
    expect(showsGuide(trace, 'guided')).toBe(true);
    trace = drawStroke(trace, second, strokes).trace;
    expect(showsGuide(trace, 'freeForm')).toBe(false);
    trace = drawStroke(trace, second, strokes).trace;
    expect(showsGuide(trace, 'freeForm')).toBe(true);
    trace = drawStroke(trace, first, strokes).trace;
    expect(showsGuide(trace, 'freeForm')).toBe(false);
  });
});
