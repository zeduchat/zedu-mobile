import React from 'react';
import { StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/text';
import {
  formatChannelEventStatusLabel,
  ParsedChannelEventMessage,
} from '@/lib/channel-event-message';

type Props = {
  data: ParsedChannelEventMessage;
};

const statusStyle = (status?: string) => {
  const key = (status || '').toLowerCase();
  if (key === 'success') {
    return {
      bg: '#E8F5E9',
      text: '#2E7D32',
      icon: 'checkmark-circle' as const,
    };
  }
  if (key === 'pending') {
    return { bg: '#FFF8E1', text: '#F9A825', icon: 'time' as const };
  }
  if (key === 'failed' || key === 'error') {
    return { bg: '#FFEBEE', text: '#C62828', icon: 'close-circle' as const };
  }
  return {
    bg: '#F3F4F6',
    text: '#54656F',
    icon: 'information-circle' as const,
  };
};

export const ChannelEventMessageBlock = ({ data }: Props) => {
  const statusTheme = statusStyle(data.status);
  const statusLabel = formatChannelEventStatusLabel(data.status);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <AppText variant="bold" size={14} style={styles.eventTitle}>
          {data.eventName}
        </AppText>
        {statusLabel ? (
          <View
            style={[styles.statusPill, { backgroundColor: statusTheme.bg }]}
          >
            <Ionicons
              name={statusTheme.icon}
              size={14}
              color={statusTheme.text}
            />
            <AppText
              size={11}
              variant="medium"
              style={{ color: statusTheme.text, marginLeft: 4 }}
            >
              {statusLabel}
            </AppText>
          </View>
        ) : null}
      </View>

      {data.fields.length > 0 ? (
        <View style={styles.fields}>
          {data.fields.map(field => (
            <View key={`${field.label}-${field.value}`} style={styles.fieldRow}>
              <AppText size={12} style={styles.fieldLabel}>
                {field.label}
              </AppText>
              <AppText size={13} variant="medium" style={styles.fieldValue}>
                {field.value}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      {data.fallbackText ? (
        <AppText size={13} style={styles.fallbackText}>
          {data.fallbackText}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 4,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F7F8FA',
    borderWidth: 1,
    borderColor: '#ECEFF1',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  eventTitle: {
    color: '#111B21',
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  fields: {
    gap: 8,
  },
  fieldRow: {
    gap: 2,
  },
  fieldLabel: {
    color: '#667781',
  },
  fieldValue: {
    color: '#111B21',
  },
  fallbackText: {
    color: '#111B21',
    lineHeight: 20,
  },
});

export default ChannelEventMessageBlock;
