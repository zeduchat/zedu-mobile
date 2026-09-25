import React from 'react';
import { View, ScrollView } from 'react-native';
import { AgentSkeleton } from './agent-skeleton';
import { normalize } from '@/utils/normalize';

export const AgentDetailsSkeleton = () => {
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: normalize(24),
        paddingTop: normalize(30),
      }}
    >
      {/* Matches Branding Section */}
      <View style={{ alignItems: 'center', marginBottom: normalize(30) }}>
        <AgentSkeleton
          width={normalize(100)}
          height={normalize(100)}
          borderRadius={normalize(50)}
        />
        <AgentSkeleton
          width={normalize(150)}
          height={normalize(24)}
          style={{ marginTop: normalize(16) }}
        />
        <AgentSkeleton
          width={normalize(100)}
          height={normalize(20)}
          style={{ marginTop: normalize(8) }}
        />
      </View>

      {/* Matches About, Benefits, Why Use sections */}
      {[1, 2, 3].map(item => (
        <View key={item} style={{ marginBottom: normalize(25) }}>
          <AgentSkeleton
            width={normalize(80)}
            height={normalize(18)}
            style={{ marginBottom: 12 }}
          />
          <AgentSkeleton
            width="100%"
            height={normalize(14)}
            style={{ marginBottom: 8 }}
          />
          <AgentSkeleton
            width="100%"
            height={normalize(14)}
            style={{ marginBottom: 8 }}
          />
          <AgentSkeleton width="60%" height={normalize(14)} />
          <View
            style={{
              height: 1,
              backgroundColor: '#F2F2F7',
              marginTop: normalize(20),
            }}
          />
        </View>
      ))}

      {/* Matches Capabilities (Bullet Points) */}
      <View style={{ marginTop: 10 }}>
        <AgentSkeleton
          width={normalize(120)}
          height={normalize(18)}
          style={{ marginBottom: 15 }}
        />
        {[1, 2, 3].map(i => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <AgentSkeleton
              width={6}
              height={6}
              borderRadius={3}
              style={{ marginRight: 10 }}
            />
            <AgentSkeleton width="80%" height={14} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
};
