/**
 * @format
 */

import { memberMatchesSearch } from '@/utils/participant-search';

const member = {
  name: 'Odofin Moronke',
  email: 'moronke@zedu.chat',
  username: 'Sparklynjewel',
};

describe('memberMatchesSearch', () => {
  it.each([
    'Odofin',
    'moronke@zedu.chat',
    'MORONKE@ZEDU',
    'sparklyn',
    ' jewel ',
  ])('matches %p by name, email or username', query => {
    expect(memberMatchesSearch(member, query)).toBe(true);
  });

  it('does not match an unrelated query', () => {
    expect(memberMatchesSearch(member, 'someone@else.com')).toBe(false);
  });

  it('matches everyone when the search is empty', () => {
    expect(memberMatchesSearch(member, '   ')).toBe(true);
  });

  it('handles members with missing fields', () => {
    expect(memberMatchesSearch({ name: 'Ada' }, 'ada')).toBe(true);
    expect(memberMatchesSearch({}, 'ada')).toBe(false);
  });
});
