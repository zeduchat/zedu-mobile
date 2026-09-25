export type ChannelEventMessageField = {
  label: string;
  value: string;
};

export type ParsedChannelEventMessage = {
  eventName: string;
  status?: string;
  fields: ChannelEventMessageField[];
  fallbackText?: string;
};

type ChannelEventMessageSource = {
  type?: string;
  message?: string | null;
  event_name?: string | null;
  status?: string | null;
};

export const isChannelEventThreadMessage = (
  item: ChannelEventMessageSource,
): boolean => {
  return item?.type === 'thread' && Boolean(item?.event_name?.trim());
};

const normalizeEventMessageBody = (raw: string): string => {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .trim();
};

const parseKeyValueLines = (body: string): ChannelEventMessageField[] => {
  const fields: ChannelEventMessageField[] = [];

  body.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex <= 0) {
      return;
    }

    const label = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    if (label && value) {
      fields.push({ label, value });
    }
  });

  return fields;
};

export const parseChannelEventMessage = (
  item: ChannelEventMessageSource,
): ParsedChannelEventMessage | null => {
  if (!isChannelEventThreadMessage(item)) {
    return null;
  }

  const body = normalizeEventMessageBody(item.message || '');
  const fields = parseKeyValueLines(body);

  return {
    eventName: (item.event_name || 'Event').trim(),
    status: item.status?.trim() || undefined,
    fields,
    fallbackText: fields.length === 0 && body ? body : undefined,
  };
};

export const formatChannelEventStatusLabel = (status?: string): string => {
  if (!status) {
    return '';
  }
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};
