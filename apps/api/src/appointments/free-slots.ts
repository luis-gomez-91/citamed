import { blocksOverlap } from './block-overlap';

export type WeeklyBlock = {
  weekday: number;
  startMinute: number;
  endMinute: number;
  durationMinutes: number;
};

export type Interval = {
  start: Date;
  end: Date;
};

export function freeSlots(input: {
  timeZone: string;
  date: string;
  blocks: WeeklyBlock[];
  absences: Interval[];
  booked: Interval[];
}): Date[] {
  assertDate(input.date);
  assertTimeZone(input.timeZone);

  const weekday = weekdayInTimeZone(input.date, input.timeZone);
  const dayBlocks = input.blocks.filter((block) => block.weekday === weekday);

  for (const block of dayBlocks) {
    if (block.durationMinutes <= 0 || block.startMinute >= block.endMinute) {
      throw new Error('Invalid block');
    }
  }

  if (blocksOverlap(dayBlocks)) {
    throw new Error('Overlapping blocks');
  }

  const slots: Date[] = [];

  for (const block of dayBlocks) {

    for (
      let minute = block.startMinute;
      minute + block.durationMinutes <= block.endMinute;
      minute += block.durationMinutes
    ) {
      const start = zonedLocalToUtc(input.date, minute, input.timeZone);
      const end = new Date(start.getTime() + block.durationMinutes * 60_000);
      const overlapsAbsence = input.absences.some(
        (absence) => absence.start < end && start < absence.end,
      );
      const taken = input.booked.some(
        (booked) => booked.start < end && start < booked.end,
      );

      if (!overlapsAbsence && !taken) {
        slots.push(start);
      }
    }
  }

  return slots;
}

function assertDate(date: string): void {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) {
    throw new Error('Invalid date');
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) {
    throw new Error('Invalid date');
  }
}

function assertTimeZone(timeZone: string): void {
  Intl.DateTimeFormat('en-US', { timeZone });
}

function weekdayInTimeZone(date: string, timeZone: string): number {
  const noon = zonedLocalToUtc(date, 12 * 60, timeZone);
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(noon);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

function zonedLocalToUtc(date: string, minuteOfDay: number, timeZone: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const hour = Math.floor(minuteOfDay / 60);
  const minute = minuteOfDay % 60;
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  let instant = new Date(utcGuess - offsetMs(new Date(utcGuess), timeZone));
  const corrected = utcGuess - offsetMs(instant, timeZone);
  if (corrected !== instant.getTime()) {
    instant = new Date(corrected);
  }
  return instant;
}

function offsetMs(instant: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - instant.getTime();
}
