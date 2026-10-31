import moment from 'moment';
import { ViewToken } from 'react-native';
import { formatDateLabel } from '@/lib/date-label';
import { getTopVisibleDateLabel } from '../src/hooks/useStickyDateLabel';

// Labels depend on today's date, so pin "today" to keep the expected labels stable
beforeAll(() => {
  jest.useFakeTimers({ now: new Date('2026-10-20T12:00:00') });
});

afterAll(() => {
  jest.useRealTimers();
});

const token = (index: number, created_at: string): ViewToken => ({
  index,
  item: { created_at },
  key: String(index),
  isViewable: true,
});

describe('formatDateLabel', () => {
  test('uses Today, Yesterday and the full date like the date headers', () => {
    expect(formatDateLabel(moment())).toBe('Today');
    expect(formatDateLabel(moment().subtract(1, 'day'))).toBe('Yesterday');
    expect(formatDateLabel('2026-10-05T12:00:00')).toBe('October 5, 2026');
  });

  test('shows future dates as a full date', () => {
    const inThreeDays = moment().add(3, 'days');
    expect(formatDateLabel(inThreeDays)).toBe(
      inThreeDays.format('MMMM D, YYYY'),
    );
  });
});

describe('getTopVisibleDateLabel', () => {
  test('returns the date of the topmost message in an inverted list', () => {
    const viewable = [
      token(0, '2026-10-07T09:00:00'),
      token(1, '2026-10-07T08:00:00'),
      token(2, '2026-10-06T18:00:00'),
    ];
    expect(getTopVisibleDateLabel(viewable)).toBe('October 6, 2026');
  });

  test('returns an empty label when nothing is visible', () => {
    expect(getTopVisibleDateLabel([])).toBe('');
    expect(
      getTopVisibleDateLabel([], { date: '2026-10-05T10:00:00', lastIndex: 2 }),
    ).toBe('');
  });

  test("uses the thread parent's date once the oldest reply is visible", () => {
    const parent = { date: '2026-10-05T10:00:00', lastIndex: 2 };
    const replies = [
      token(1, '2026-10-07T08:00:00'),
      token(2, '2026-10-07T07:00:00'),
    ];
    expect(getTopVisibleDateLabel(replies, parent)).toBe('October 5, 2026');
    expect(
      getTopVisibleDateLabel([token(0, '2026-10-07T09:00:00')], parent),
    ).toBe('October 7, 2026');
  });
});
