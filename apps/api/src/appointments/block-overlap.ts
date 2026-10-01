import type { WeeklyBlock } from './free-slots';

export function blocksOverlap(blocks: WeeklyBlock[]): boolean {
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const left = blocks[i];
      const right = blocks[j];
      if (
        left.weekday === right.weekday &&
        left.startMinute < right.endMinute &&
        right.startMinute < left.endMinute
      ) {
        return true;
      }
    }
  }

  return false;
}
