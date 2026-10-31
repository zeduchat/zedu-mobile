import { formatPreviewMessage } from '@/utils/message-text';

const mention = (label: string) =>
  `<span data-type="mention" data-label="${label}">@${label}</span>`;

describe('formatPreviewMessage', () => {
  it('keeps a space between two mentions in a row', () => {
    expect(
      formatPreviewMessage(`<p>${mention('saviour')}${mention('ime')}</p>`),
    ).toBe('@saviour @ime');
  });

  it('keeps the space when formatting tags sit between two mentions', () => {
    expect(
      formatPreviewMessage(
        `<p><strong>${mention('a')}</strong>${mention('b')}</p>`,
      ),
    ).toBe('@a @b');
  });

  it('does not add a space before a mention after other markup', () => {
    expect(
      formatPreviewMessage(`<p><span>hi</span>${mention('ime')}</p>`),
    ).toBe('hi@ime');
  });

  it('leaves a single mention and normal spacing unchanged', () => {
    expect(formatPreviewMessage(`<p>hi ${mention('ime')} thanks</p>`)).toBe(
      'hi @ime thanks',
    );
  });
});
