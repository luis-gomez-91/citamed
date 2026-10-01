import { WeeklyBlock } from './free-slots';
import { blocksOverlap } from './block-overlap';

const morning: WeeklyBlock = {
  weekday: 1,
  startMinute: 9 * 60,
  endMinute: 12 * 60,
  durationMinutes: 30,
};

describe('blocksOverlap', () => {
  it('rejects two blocks of the same weekday that cross', () => {
    const later: WeeklyBlock = {
      weekday: 1,
      startMinute: 11 * 60,
      endMinute: 13 * 60,
      durationMinutes: 30,
    };

    expect(blocksOverlap([morning, later])).toBe(true);
  });

  it('allows blocks that only touch at the boundary', () => {
    const afternoon: WeeklyBlock = {
      weekday: 1,
      startMinute: 12 * 60,
      endMinute: 15 * 60,
      durationMinutes: 30,
    };

    expect(blocksOverlap([morning, afternoon])).toBe(false);
  });

  it('allows the same hours on different weekdays', () => {
    const tuesday: WeeklyBlock = { ...morning, weekday: 2 };

    expect(blocksOverlap([morning, tuesday])).toBe(false);
  });
});
