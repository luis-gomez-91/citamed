import { freeSlots } from './free-slots';

const timeZone = 'America/Bogota';

describe('freeSlots', () => {
  const monday = '2026-10-05';

  it('offers slots that fit inside the block', () => {
    const slots = freeSlots({
      timeZone,
      date: monday,
      blocks: [
        {
          weekday: 1,
          startMinute: 9 * 60,
          endMinute: 10 * 60,
          durationMinutes: 30,
        },
      ],
      absences: [],
      booked: [],
    });

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-10-05T14:00:00.000Z',
      '2026-10-05T14:30:00.000Z',
    ]);
  });

  it('drops a slot that does not fit in the block', () => {
    const slots = freeSlots({
      timeZone,
      date: monday,
      blocks: [
        {
          weekday: 1,
          startMinute: 9 * 60,
          endMinute: 9 * 60 + 45,
          durationMinutes: 30,
        },
      ],
      absences: [],
      booked: [],
    });

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-10-05T14:00:00.000Z',
    ]);
  });

  it('drops a slot covered by an absence', () => {
    const slots = freeSlots({
      timeZone,
      date: monday,
      blocks: [
        {
          weekday: 1,
          startMinute: 9 * 60,
          endMinute: 10 * 60,
          durationMinutes: 30,
        },
      ],
      absences: [
        {
          start: new Date('2026-10-05T14:00:00.000Z'),
          end: new Date('2026-10-05T14:30:00.000Z'),
        },
      ],
      booked: [],
    });

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-10-05T14:30:00.000Z',
    ]);
  });

  it('drops a slot when an absence cuts through its middle', () => {
    const slots = freeSlots({
      timeZone,
      date: monday,
      blocks: [
        {
          weekday: 1,
          startMinute: 9 * 60,
          endMinute: 10 * 60,
          durationMinutes: 30,
        },
      ],
      absences: [
        {
          start: new Date('2026-10-05T14:10:00.000Z'),
          end: new Date('2026-10-05T14:20:00.000Z'),
        },
      ],
      booked: [],
    });

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-10-05T14:30:00.000Z',
    ]);
  });

  it('drops a slot overlapped by a booking with a different start', () => {
    const slots = freeSlots({
      timeZone,
      date: monday,
      blocks: [
        {
          weekday: 1,
          startMinute: 9 * 60,
          endMinute: 10 * 60,
          durationMinutes: 30,
        },
      ],
      absences: [],
      booked: [
        {
          start: new Date('2026-10-05T14:40:00.000Z'),
          end: new Date('2026-10-05T15:10:00.000Z'),
        },
      ],
    });

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-10-05T14:00:00.000Z',
    ]);
  });

  it('ignores blocks of another weekday', () => {
    const slots = freeSlots({
      timeZone,
      date: monday,
      blocks: [
        {
          weekday: 2,
          startMinute: 9 * 60,
          endMinute: 10 * 60,
          durationMinutes: 30,
        },
      ],
      absences: [],
      booked: [],
    });

    expect(slots).toEqual([]);
  });

  it('refuses to offer slots when that weekday has overlapping blocks', () => {
    expect(() =>
      freeSlots({
        timeZone,
        date: monday,
        blocks: [
          {
            weekday: 1,
            startMinute: 9 * 60,
            endMinute: 12 * 60,
            durationMinutes: 30,
          },
          {
            weekday: 1,
            startMinute: 11 * 60,
            endMinute: 13 * 60,
            durationMinutes: 30,
          },
        ],
        absences: [],
        booked: [],
      }),
    ).toThrow('Overlapping blocks');
  });

  it('uses the offset in effect on that date', () => {
    const slots = freeSlots({
      timeZone: 'America/New_York',
      date: '2026-03-09',
      blocks: [
        {
          weekday: 1,
          startMinute: 9 * 60,
          endMinute: 9 * 60 + 30,
          durationMinutes: 30,
        },
      ],
      absences: [],
      booked: [],
    });

    expect(slots.map((slot) => slot.toISOString())).toEqual([
      '2026-03-09T13:00:00.000Z',
    ]);
  });

  it('rejects an invalid date, an unknown time zone, and an inverted block', () => {
    const block = {
      weekday: 1,
      startMinute: 9 * 60,
      endMinute: 10 * 60,
      durationMinutes: 30,
    };

    expect(() =>
      freeSlots({
        timeZone,
        date: '2026-13-40',
        blocks: [block],
        absences: [],
        booked: [],
      }),
    ).toThrow('Invalid date');

    expect(() =>
      freeSlots({
        timeZone: 'Not/Azone',
        date: monday,
        blocks: [block],
        absences: [],
        booked: [],
      }),
    ).toThrow(RangeError);

    expect(() =>
      freeSlots({
        timeZone,
        date: monday,
        blocks: [{ ...block, startMinute: 12 * 60, endMinute: 9 * 60 }],
        absences: [],
        booked: [],
      }),
    ).toThrow('Invalid block');
  });
});
