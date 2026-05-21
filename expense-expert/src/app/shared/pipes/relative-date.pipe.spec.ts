import { RelativeDatePipe } from './relative-date.pipe';

describe('RelativeDatePipe', () => {
  let pipe: RelativeDatePipe;

  beforeEach(() => {
    pipe = new RelativeDatePipe();
    jasmine.clock().install();
    const baseTime = new Date('2023-01-15T12:00:00Z');
    jasmine.clock().mockDate(baseTime);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('returns empty string for falsy value', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('returns "Today" for current date', () => {
    const today = new Date('2023-01-15T12:00:00Z');
    expect(pipe.transform(today)).toBe('Today');
  });

  it('returns "Yesterday" for yesterday', () => {
    const yesterday = new Date('2023-01-14T12:00:00Z');
    expect(pipe.transform(yesterday)).toBe('Yesterday');
  });

  it('returns "X days ago" for < 7 days', () => {
    const threeDaysAgo = new Date('2023-01-12T12:00:00Z');
    expect(pipe.transform(threeDaysAgo)).toBe('3 days ago');
  });

  it('returns "X weeks ago" for < 30 days', () => {
    const fourteenDaysAgo = new Date('2023-01-01T12:00:00Z');
    expect(pipe.transform(fourteenDaysAgo)).toBe('2 weeks ago');
  });

  it('returns formatted date for >= 30 days', () => {
    const olderDate = new Date('2022-12-01T12:00:00Z');
    expect(pipe.transform(olderDate)).toBe('Dec 1, 2022');
  });

  it('handles string input correctly', () => {
    expect(pipe.transform('2023-01-15T12:00:00Z')).toBe('Today');
  });

  it('handles number input correctly', () => {
    const timeMs = new Date('2023-01-15T12:00:00Z').getTime();
    expect(pipe.transform(timeMs)).toBe('Today');
  });

  it('handles object with toDate() correctly', () => {
    const mockTimestamp = {
      toDate: () => new Date('2023-01-15T12:00:00Z')
    };
    expect(pipe.transform(mockTimestamp)).toBe('Today');
  });
});
