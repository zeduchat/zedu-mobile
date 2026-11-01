import {
  getActiveMention,
  buildMentionHtmlTag,
  buildMentionHref,
  parseMentionHref,
  parseComposerMentionSegments,
  formatPreviewMessage,
  resolveMentionKind,
} from '@/utils/message-text';

describe('Channel Tagging (#) and Mention Utilities', () => {
  describe('getActiveMention', () => {
    it('detects standalone @ and query', () => {
      expect(getActiveMention('@', 1)).toEqual({
        trigger: '@',
        query: '',
        pos: 1,
      });

      expect(getActiveMention('@alice', 6)).toEqual({
        trigger: '@',
        query: 'alice',
        pos: 6,
      });

      expect(getActiveMention('hello @bob', 10)).toEqual({
        trigger: '@',
        query: 'bob',
        pos: 10,
      });
    });

    it('detects standalone # and query', () => {
      expect(getActiveMention('#', 1)).toEqual({
        trigger: '#',
        query: '',
        pos: 1,
      });

      expect(getActiveMention('#general', 8)).toEqual({
        trigger: '#',
        query: 'general',
        pos: 8,
      });

      expect(getActiveMention('check #announcements', 20)).toEqual({
        trigger: '#',
        query: 'announcements',
        pos: 20,
      });
    });

    it('does NOT trigger on mid-word # or URL fragments like docs#setup', () => {
      expect(getActiveMention('docs#setup', 10)).toBeNull();
      expect(getActiveMention('word#tag', 8)).toBeNull();
      expect(
        getActiveMention('https://example.com/guide#heading', 33),
      ).toBeNull();
    });
  });

  describe('resolveMentionKind', () => {
    it('resolves channel-ref before broadcast check', () => {
      expect(
        resolveMentionKind({ mentionType: 'channel-ref', label: 'channel' }),
      ).toBe('channel-ref');
      expect(
        resolveMentionKind({
          mentionType: 'channel-ref',
          id: 'ch1',
          label: 'dev',
        }),
      ).toBe('channel-ref');
    });

    it('keeps broadcast behavior for channel', () => {
      expect(resolveMentionKind({ mentionType: 'channel' })).toBe('channel');
      expect(resolveMentionKind({ id: 'channel' })).toBe('channel');
      expect(resolveMentionKind({ label: 'channel' })).toBe('channel');
    });

    it('defaults to user', () => {
      expect(resolveMentionKind({ mentionType: 'user', label: 'alice' })).toBe(
        'user',
      );
      expect(resolveMentionKind({ label: 'bob' })).toBe('user');
    });
  });

  describe('buildMentionHtmlTag', () => {
    it('outputs correct TipTap span for channel-ref', () => {
      const tag = buildMentionHtmlTag({
        id: '019bd825-1c64',
        label: 'general',
        type: 'channel-ref',
      });

      expect(tag).toBe(
        '<span class="mention mention-channel-ref" data-type="mention" data-mention-type="channel-ref" data-id="019bd825-1c64" data-label="general" data-mention-suggestion-char="#">#general</span>',
      );
    });

    it('keeps existing format for @user and @channel', () => {
      const userTag = buildMentionHtmlTag({
        id: 'usr-1',
        label: 'john',
        type: 'user',
      });
      expect(userTag).toBe(
        '<span class="mention" data-type="mention" data-mention-type="user" data-id="usr-1" data-label="john" data-mention-suggestion-char="@">@john</span>',
      );

      const channelTag = buildMentionHtmlTag({
        id: 'channel',
        label: 'channel',
        type: 'channel',
      });
      expect(channelTag).toBe(
        '<span class="mention mention-channel" data-type="mention" data-mention-type="channel" data-id="channel" data-label="channel" data-mention-suggestion-char="@">@channel</span>',
      );
    });
  });

  describe('buildMentionHref and parseMentionHref round-trip', () => {
    it('preserves channel-ref id and parses it back', () => {
      const href = buildMentionHref({
        mentionKind: 'channel-ref',
        id: 'ch-uuid-999',
        label: 'random',
      });

      expect(href).toBe('zedu-mention://channel-ref/ch-uuid-999?label=random');

      const parsed = parseMentionHref(href);
      expect(parsed).toEqual({
        mentionKind: 'channel-ref',
        id: 'ch-uuid-999',
        label: 'random',
      });
    });

    it('preserves user mention round-trip', () => {
      const href = buildMentionHref({
        mentionKind: 'user',
        id: 'u-123',
        label: 'alice',
      });

      const parsed = parseMentionHref(href);
      expect(parsed).toEqual({
        mentionKind: 'user',
        id: 'u-123',
        label: 'alice',
      });
    });

    it('preserves channel broadcast round-trip (id undefined)', () => {
      const href = buildMentionHref({
        mentionKind: 'channel',
        label: 'channel',
      });

      const parsed = parseMentionHref(href);
      expect(parsed).toEqual({
        mentionKind: 'channel',
        id: undefined,
        label: 'channel',
      });
    });
  });

  describe('parseComposerMentionSegments', () => {
    it('highlights picked channels and users, but NOT arbitrary #words', () => {
      const segments = parseComposerMentionSegments(
        'Check #general and #arbitrary with @alice and @channel',
        [
          { label: 'general', type: 'channel-ref' } as any,
          { label: 'alice', type: 'user' } as any,
        ],
      );

      expect(segments).toEqual([
        { type: 'text', content: 'Check ' },
        { type: 'channelRefMention', content: '#general' },
        { type: 'text', content: ' and ' },
        { type: 'text', content: '#' },
        { type: 'text', content: 'arbitrary with ' },
        { type: 'userMention', content: '@alice' },
        { type: 'text', content: ' and ' },
        { type: 'channelMention', content: '@channel' },
      ]);
    });
  });

  describe('formatPreviewMessage', () => {
    it('formats channel-ref mention as #label in previews', () => {
      const html =
        '<p>Please check <span class="mention mention-channel-ref" data-type="mention" data-mention-type="channel-ref" data-id="123" data-label="general" data-mention-suggestion-char="#">#general</span> for updates</p>';
      expect(formatPreviewMessage(html)).toBe(
        'Please check #general for updates',
      );
    });
  });
});
