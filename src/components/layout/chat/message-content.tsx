import React, { useCallback, useMemo, useState } from 'react';
import {
  Linking,
  StyleProp,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import { createMessageMarkdownStyles } from '@/theme/createMessageStyles';
import { ensureHttpsUrl } from '@/utils/link-url';
import {
  hasMessageContent,
  hasRichMessageContent,
  parseTiptapHtmlToRichSegments,
  type RichMessageSegment,
  type TextMarks,
} from '@/utils/message-text';
import {
  fileFromDocumentUrl,
  isDocumentUrl,
  type DocumentPreviewFile,
} from '@/utils/document-preview';
import { ShowNotify } from '@/components/ui/toast';
import { ChatFilePreviewModal } from './chat-file-attachment';
import { MessageLinkPreviews } from './link-preview';

type MessageContentProps = {
  html?: string | null;
  onMentionUser?: (userId: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  /** Extra text styles merged into the message body (e.g. bubble padding). */
  textStyle?: StyleProp<TextStyle>;
  /** Attachment file links — excluded from URL previews / opened as documents. */
  media?: Array<{ file_link?: string; file_name?: string; name?: string }>;
  /** Hide OG link previews (e.g. compact forward snippets). */
  showLinkPreviews?: boolean;
};

type InlineSegment = Exclude<
  RichMessageSegment,
  { type: 'list' } | { type: 'codeblock' }
>;

/**
 * Renders TipTap / mobile message HTML with native text marks so bold,
 * italic, strike, lists, code, links, and mentions match web formatting.
 * Avoids HTML→markdown (`**bold**`) which often leaves asterisks visible.
 */
export const MessageContent: React.FC<MessageContentProps> = ({
  html,
  onMentionUser,
  containerStyle,
  textStyle,
  media,
  showLinkPreviews = true,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(
    () => createMessageMarkdownStyles(colors, textStyle),
    [colors, textStyle],
  );
  const segments = useMemo(
    () => parseTiptapHtmlToRichSegments(html || ''),
    [html],
  );
  const [documentFile, setDocumentFile] = useState<DocumentPreviewFile | null>(
    null,
  );
  const [documentVisible, setDocumentVisible] = useState(false);

  const excludeUrls = useMemo(
    () =>
      (media || [])
        .map(item => item?.file_link)
        .filter((url): url is string => Boolean(url)),
    [media],
  );

  const openDocumentLink = useCallback(
    (url: string) => {
      const mediaMatch = (media || []).find(
        item =>
          item?.file_link &&
          ensureHttpsUrl(item.file_link).replace(/\/$/, '').toLowerCase() ===
            ensureHttpsUrl(url).replace(/\/$/, '').toLowerCase(),
      );

      setDocumentFile(
        mediaMatch
          ? {
              file_link: mediaMatch.file_link,
              file_name: mediaMatch.file_name || mediaMatch.name,
              name: mediaMatch.name || mediaMatch.file_name,
            }
          : fileFromDocumentUrl(url),
      );
      setDocumentVisible(true);
    },
    [media],
  );

  const openExternalLink = useCallback(async (url: string) => {
    const href = ensureHttpsUrl(url);
    try {
      const supported = await Linking.canOpenURL(href);
      if (supported) {
        await Linking.openURL(href);
      } else {
        ShowNotify('Error', "Don't know how to open this URL: " + href);
      }
    } catch {
      ShowNotify('Error', 'An error occurred while opening the link');
    }
  }, []);

  const handleUrlPress = useCallback(
    (url: string) => {
      if (isDocumentUrl(url) || excludeUrls.some(u => urlsMatch(u, url))) {
        openDocumentLink(url);
        return;
      }
      openExternalLink(url);
    },
    [excludeUrls, openDocumentLink, openExternalLink],
  );

  const markStyle = useCallback(
    (marks?: TextMarks): StyleProp<TextStyle> => {
      if (!marks) {
        return undefined;
      }
      const parts: TextStyle[] = [];
      if (marks.bold) {
        parts.push(styles.strong);
      }
      if (marks.italic) {
        parts.push(styles.em);
      }
      if (marks.strike) {
        parts.push(styles.s);
      }
      if (marks.code) {
        parts.push(styles.code_inline);
      }
      return parts;
    },
    [styles],
  );

  const renderInline = useCallback(
    (items: InlineSegment[], keyPrefix: string) =>
      items.map((segment, index) => {
        const key = `${keyPrefix}-${index}`;

        if (segment.type === 'newline') {
          return '\n';
        }

        if (segment.type === 'text') {
          return (
            <Text key={key} style={markStyle(segment.marks)}>
              {segment.content}
            </Text>
          );
        }

        if (segment.type === 'link') {
          return (
            <Text
              key={key}
              style={[styles.link, markStyle(segment.marks)]}
              onPress={() => handleUrlPress(segment.url)}
            >
              {segment.content}
            </Text>
          );
        }

        const isChannel = segment.mentionKind === 'channel';
        return (
          <Text
            key={key}
            style={isChannel ? styles.channelMention : styles.mention}
            onPress={() => {
              if (!isChannel && segment.userId) {
                onMentionUser?.(segment.userId);
              }
            }}
          >
            @{segment.label}
          </Text>
        );
      }),
    [handleUrlPress, markStyle, onMentionUser, styles],
  );

  const blocks = useMemo(() => {
    const result: Array<
      | { type: 'inline'; items: InlineSegment[] }
      | { type: 'list'; segment: Extract<RichMessageSegment, { type: 'list' }> }
      | {
          type: 'codeblock';
          segment: Extract<RichMessageSegment, { type: 'codeblock' }>;
        }
    > = [];

    let inlineBuffer: InlineSegment[] = [];

    const flushInline = () => {
      // Drop trailing newlines in a buffer; paragraph spacing handled by blocks
      while (
        inlineBuffer.length > 0 &&
        inlineBuffer[inlineBuffer.length - 1].type === 'newline'
      ) {
        inlineBuffer.pop();
      }
      if (inlineBuffer.length > 0) {
        result.push({ type: 'inline', items: inlineBuffer });
        inlineBuffer = [];
      }
    };

    segments.forEach(segment => {
      if (segment.type === 'list') {
        flushInline();
        result.push({ type: 'list', segment });
        return;
      }
      if (segment.type === 'codeblock') {
        flushInline();
        result.push({ type: 'codeblock', segment });
        return;
      }
      inlineBuffer.push(segment);
    });

    flushInline();
    return result;
  }, [segments]);

  if (!hasMessageContent(html) || !hasRichMessageContent(segments)) {
    return null;
  }

  return (
    <View style={[styles.body, containerStyle]}>
      {blocks.map((block, blockIndex) => {
        if (block.type === 'inline') {
          return (
            <Text key={`block-${blockIndex}`} style={styles.paragraph}>
              {renderInline(block.items, `inline-${blockIndex}`)}
            </Text>
          );
        }

        if (block.type === 'codeblock') {
          return (
            <View key={`block-${blockIndex}`} style={styles.fence}>
              <Text style={styles.code_block}>{block.segment.content}</Text>
            </View>
          );
        }

        return (
          <View
            key={`block-${blockIndex}`}
            style={
              block.segment.ordered ? styles.ordered_list : styles.bullet_list
            }
          >
            {block.segment.items.map((item, itemIndex) => (
              <View
                key={`block-${blockIndex}-item-${itemIndex}`}
                style={styles.list_item}
              >
                <Text
                  style={
                    block.segment.ordered
                      ? styles.ordered_list_icon
                      : styles.bullet_list_icon
                  }
                >
                  {block.segment.ordered ? `${itemIndex + 1}.` : '•'}
                </Text>
                <Text style={[styles.text, { flex: 1 }]}>
                  {renderInline(
                    item.filter(
                      (s): s is InlineSegment =>
                        s.type !== 'list' && s.type !== 'codeblock',
                    ),
                    `list-${blockIndex}-${itemIndex}`,
                  )}
                </Text>
              </View>
            ))}
          </View>
        );
      })}

      {showLinkPreviews ? (
        <MessageLinkPreviews html={html} excludeUrls={excludeUrls} />
      ) : null}

      <ChatFilePreviewModal
        visible={documentVisible}
        file={documentFile}
        onClose={() => {
          setDocumentVisible(false);
          setDocumentFile(null);
        }}
      />
    </View>
  );
};

function urlsMatch(a: string, b: string): boolean {
  return (
    ensureHttpsUrl(a).replace(/\/$/, '').toLowerCase() ===
    ensureHttpsUrl(b).replace(/\/$/, '').toLowerCase()
  );
}

export default MessageContent;
