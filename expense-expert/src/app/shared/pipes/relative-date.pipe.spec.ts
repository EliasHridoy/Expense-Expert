import { RelativeDatePipe } from './relative-date.pipe';

describe('RelativeDatePipe', () => {
  let pipe: RelativeDatePipe;
  const baseTime = new Date(2024, 0, 15); // Jan 15, 2024

  beforeEach(() => {
    pipe = new RelativeDatePipe();
    jasmine.clock().install();
    jasmine.clock().mockDate(baseTime);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return empty string for falsy values', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(0)).toBe('');
  });

  it('should return "Today" for dates matching today', () => {
    const today = new Date(2024, 0, 15); // diffDays = 0
    expect(pipe.transform(today)).toBe('Today');

    // Test slightly earlier today
    const earlierToday = new Date(2024, 0, 15, 0, 0, 0);
    // Since baseTime is new Date(2024, 0, 15) which is also 00:00:00, they are the exact same time.
    expect(pipe.transform(earlierToday)).toBe('Today');
  });

  it('should return "Yesterday" for dates matching yesterday', () => {
    const yesterday = new Date(2024, 0, 14); // diffDays = 1
    expect(pipe.transform(yesterday)).toBe('Yesterday');
  });

  it('should return "X days ago" for dates less than 7 days ago', () => {
    const twoDaysAgo = new Date(2024, 0, 13); // diffDays = 2
    expect(pipe.transform(twoDaysAgo)).toBe('2 days ago');

    const sixDaysAgo = new Date(2024, 0, 9); // diffDays = 6
    expect(pipe.transform(sixDaysAgo)).toBe('6 days ago');
  });

  it('should return "Y weeks ago" for dates less than 30 days ago', () => {
    const oneWeekAgo = new Date(2024, 0, 8); // diffDays = 7
    expect(pipe.transform(oneWeekAgo)).toBe('1 weeks ago');

    const twoWeeksAgo = new Date(2024, 0, 1); // diffDays = 14
    expect(pipe.transform(twoWeeksAgo)).toBe('2 weeks ago');

    const almostAMonthAgo = new Date(2023, 11, 17); // 29 days ago -> 4 weeks ago
    expect(pipe.transform(almostAMonthAgo)).toBe('4 weeks ago');
  });

  it('should return formatted date for dates 30 or more days ago', () => {
    const thirtyDaysAgo = new Date(2023, 11, 16); // 30 days ago
    expect(pipe.transform(thirtyDaysAgo)).toBe('Dec 16, 2023');

    const wayBefore = new Date(2023, 5, 1); // Jun 1, 2023
    expect(pipe.transform(wayBefore)).toBe('Jun 1, 2023');
  });

  it('should handle Firebase Timestamp-like objects with toDate()', () => {
    const timestampMock = {
      toDate: () => new Date(2024, 0, 14) // Yesterday
    };
    expect(pipe.transform(timestampMock)).toBe('Yesterday');
  });

  it('should handle string date inputs', () => {
    const stringDate = '2024-01-14T00:00:00Z'; // Yesterday (using UTC to ensure parsing works)
    // We mock the date to be consistent, but Javascript's new Date(string) uses local time zone offset.
    // Let's use a straightforward local-like string representation if possible, or just test logic works:
    // For exact match on "Yesterday" it might depend on the runner's timezone with "T00:00".
    // Better to use string parseable values that match what new Date() expects and handles well
    // Let's use the local ISO string format or similar
    const dt = new Date(2024, 0, 14);
    expect(pipe.transform(dt.toISOString())).toBe('Yesterday');
  });

  it('should handle timestamp numbers', () => {
    const ms = new Date(2024, 0, 14).getTime();
    expect(pipe.transform(ms)).toBe('Yesterday');
  });
});
