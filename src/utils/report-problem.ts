import { Alert, Linking, Platform } from 'react-native';
import pkg from '../../package.json';

export const SUPPORT_EMAIL = 'contact@zedu.chat';

/**
 * The phone brand and model, so reports from different devices on the same OS
 * can be told apart. Android exposes it without a new package; iOS does not,
 * so the line is left out there.
 */
export const getDeviceModel = (): string | undefined => {
  if (Platform.OS !== 'android') return undefined;
  const { Brand, Model } = (Platform.constants ?? {}) as {
    Brand?: string;
    Model?: string;
  };
  const model = [Brand, Model].filter(Boolean).join(' ').trim();
  return model || undefined;
};

/** A ready-to-send support email with the app and phone details filled in. */
export const buildReportProblemUrl = (): string => {
  const subject = 'Zedu mobile: report a problem';
  const model = getDeviceModel();
  const body = [
    'What went wrong?',
    '',
    '',
    '---',
    `App version: ${pkg.version}`,
    ...(model ? [`Phone model: ${model}`] : []),
    `Platform: ${Platform.OS} ${Platform.Version}`,
  ].join('\n');

  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
};

/**
 * Opens the mail app. Nothing is sent until the person presses send. If there
 * is no mail app, shows the support address so they can write to it anyway.
 */
export const openReportProblem = async () => {
  try {
    await Linking.openURL(buildReportProblemUrl());
  } catch {
    Alert.alert(
      'No mail app found',
      `Please email ${SUPPORT_EMAIL} and describe what went wrong.`,
    );
  }
};
