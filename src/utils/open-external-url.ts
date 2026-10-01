import { Linking } from 'react-native';
import { ensureHttpsUrl } from '@/utils/link-url';
import { ShowNotify } from '@/components/ui/toast';

/**
 * Open an external URL in the system browser / handler.
 * Skips Linking.canOpenURL — on iOS it returns false for https unless
 * LSApplicationQueriesSchemes lists the scheme, which blocks YouTube etc.
 */
export async function openExternalUrl(url: string): Promise<boolean> {
  const href = ensureHttpsUrl(url);
  try {
    await Linking.openURL(href);
    return true;
  } catch {
    ShowNotify('Error', 'An error occurred while opening the link');
    return false;
  }
}
