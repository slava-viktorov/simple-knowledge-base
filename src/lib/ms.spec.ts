import parseTimeStringToMs from './ms';

describe('parseTimeStringToMs', () => {
  it('корректно парсит миллисекунды', () => {
    expect(parseTimeStringToMs('500ms')).toBe(500);
    expect(parseTimeStringToMs('1ms')).toBe(1);
  });

  it('корректно парсит секунды', () => {
    expect(parseTimeStringToMs('1s')).toBe(1000);
    expect(parseTimeStringToMs('2.5s')).toBe(2500);
  });

  it('корректно парсит минуты', () => {
    expect(parseTimeStringToMs('1m')).toBe(60000);
    expect(parseTimeStringToMs('2.5m')).toBe(150000);
  });

  it('корректно парсит часы', () => {
    expect(parseTimeStringToMs('1h')).toBe(3600000);
    expect(parseTimeStringToMs('1.5h')).toBe(5400000);
  });

  it('корректно парсит дни', () => {
    expect(parseTimeStringToMs('1d')).toBe(86400000);
    expect(parseTimeStringToMs('2.5d')).toBe(216000000);
  });

  it('корректно парсит сложные выражения', () => {
    expect(parseTimeStringToMs('1d 2h 30m 10s 500ms')).toBe(
      1 * 86400000 + 2 * 3600000 + 30 * 60000 + 10 * 1000 + 500,
    );
    expect(parseTimeStringToMs('2h 15m')).toBe(2 * 3600000 + 15 * 60000);
  });

  it('игнорирует регистр и пробелы', () => {
    expect(parseTimeStringToMs(' 1D 2H ')).toBe(1 * 86400000 + 2 * 3600000);
    expect(parseTimeStringToMs('  5m   10s')).toBe(5 * 60000 + 10 * 1000);
  });

  it('возвращает 0 для некорректных строк', () => {
    expect(parseTimeStringToMs('')).toBe(0);
    expect(parseTimeStringToMs('abc')).toBe(0);
    expect(parseTimeStringToMs('1x')).toBe(0);
    expect(parseTimeStringToMs('1d 2x')).toBe(0);
    expect(parseTimeStringToMs('1d2x')).toBe(0);
    expect(parseTimeStringToMs('1d 2')).toBe(0);
    expect(parseTimeStringToMs('ms')).toBe(0);
    expect(parseTimeStringToMs('1')).toBe(0);
    expect(parseTimeStringToMs('1d 2h 3x')).toBe(0);
  });

  it('возвращает 0 для нестроковых значений', () => {
    // @ts-expect-error null input is intentional for test
    expect(parseTimeStringToMs(null)).toBe(0);
    // @ts-expect-error undefined input is intentional for test
    expect(parseTimeStringToMs(undefined)).toBe(0);
    // @ts-expect-error number input is intentional for test
    expect(parseTimeStringToMs(123)).toBe(0);
    // @ts-expect-error object input is intentional for test
    expect(parseTimeStringToMs({})).toBe(0);
  });
});
