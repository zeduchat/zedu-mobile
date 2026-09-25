import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText } from '@/components/ui/text';
import { useTheme } from '@/theme/ThemeProvider';
import { ensureHttpsUrl } from '@/utils/link-url';
import {
  extractMessageUrls,
  fetchLinkPreview,
  type LinkPreviewData,
} from '@/utils/link-preview';
import { ShowNotify } from '@/components/ui/toast';

type Props = {
  html?: string | null;
  /** Attachment URLs that should not get OG cards. */
  excludeUrls?: string[];
};

const messagePreviewCache = new Map<string, LinkPreviewData[]>();

export function MessageLinkPreviews({ html, excludeUrls = [] }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors.primary), [colors.primary]);
  const [previews, setPreviews] = useState<LinkPreviewData[]>([]);
  const prevKeyRef = useRef('');
  const excludeKey = excludeUrls.join('|');

  useEffect(() => {
    const urls = extractMessageUrls(html || '', excludeUrls);
    const cacheKey = `${html || ''}|${excludeKey}`;

    if (prevKeyRef.current === cacheKey) {
      return;
    }
    prevKeyRef.current = cacheKey;

    if (urls.length === 0) {
      setPreviews([]);
      return;
    }

    if (messagePreviewCache.has(cacheKey)) {
      setPreviews(messagePreviewCache.get(cacheKey)!);
      return;
    }

    let cancelled = false;

    (async () => {
      const results = await Promise.all(urls.map(fetchLinkPreview));
      const unique = Array.from(
        new Map(
          results
            .filter((p): p is LinkPreviewData => Boolean(p))
            .map(p => [p.url, p]),
        ).values(),
      );

      if (cancelled) return;
      messagePreviewCache.set(cacheKey, unique);
      setPreviews(unique);
    })();

    return () => {
      cancelled = true;
    };
    // excludeUrls identity is represented by excludeKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, excludeKey]);

  const openPreview = async (url: string) => {
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
  };

  if (previews.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {previews.map(preview => (
        <TouchableOpacity
          key={preview.url}
          activeOpacity={0.85}
          onPress={() => openPreview(preview.url)}
          style={styles.card}
        >
          {preview.image ? (
            <Image
              source={{ uri: preview.image }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.body}>
            {preview.siteName ? (
              <AppText size={11} style={styles.site} numberOfLines={1}>
                {preview.siteName}
              </AppText>
            ) : null}
            <AppText
              variant="medium"
              size={14}
              style={styles.title}
              numberOfLines={2}
            >
              {preview.title}
            </AppText>
            {preview.description ? (
              <AppText size={12} style={styles.description} numberOfLines={2}>
                {preview.description}
              </AppText>
            ) : null}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function createStyles(primary: string) {
  return StyleSheet.create({
    wrap: {
      marginTop: 6,
      gap: 8,
      width: '100%',
    },
    card: {
      borderWidth: 1,
      borderColor: '#E7E9EB',
      borderRadius: 10,
      overflow: 'hidden',
      backgroundColor: '#FAFBFC',
      maxWidth: 320,
    },
    image: {
      width: '100%',
      height: 140,
      backgroundColor: '#EEF0F2',
    },
    body: {
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    site: {
      color: '#667781',
      marginBottom: 2,
      textTransform: 'uppercase',
    },
    title: {
      color: primary,
    },
    description: {
      color: '#667781',
      marginTop: 2,
    },
  });
}

export default MessageLinkPreviews;
