import { formatDate, formatNumber, formatSigned, formatTimestamp } from './utils';

test('formats reported values and missing data', () => {
  expect(formatNumber(1234567)).toBe('1,234,567');
  expect(formatNumber(null)).toBe('—');
  expect(formatSigned(-12)).toBe('-12');
  expect(formatSigned(12)).toBe('+12');
  expect(formatSigned(null)).toBe('—');
});

test('formats source dates independently of local timezone', () => {
  expect(formatDate('2020-12-10')).toBe('10 Dec 2020');
  expect(formatDate(null)).toBe('Not available');
});

test('formats synchronization timestamps in UTC', () => {
  expect(formatTimestamp('2020-12-31T10:05:00Z')).toContain('31 Dec 2020');
  expect(formatTimestamp(null)).toBe('Not available');
});
