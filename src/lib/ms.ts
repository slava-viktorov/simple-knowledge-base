type TimeUnit = 'ms' | 's' | 'm' | 'h' | 'd';

const unitToMs: Record<TimeUnit, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

export default function parseTimeStringToMs(timeString: string): number {
  if (typeof timeString !== 'string' || !timeString.trim()) return 0;

  const regex = /(\d*\.?\d+)\s*(ms|s|m|h|d)/g;
  let total = 0;
  let matched = false;

  for (const match of timeString.trim().toLowerCase().matchAll(regex)) {
    const value = Number(match[1]);
    const unit = match[2] as TimeUnit;
    if (isNaN(value) || !(unit in unitToMs)) return 0;
    total += value * unitToMs[unit];
    matched = true;
  }

  if (
    !matched ||
    !/^(\d*\.?\d+\s*(ms|s|m|h|d)\s*)+$/.test(timeString.trim().toLowerCase())
  ) {
    return 0;
  }

  return total;
}
