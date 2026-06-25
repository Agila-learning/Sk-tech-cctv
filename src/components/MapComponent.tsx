import React from 'react';
import { View, Text } from 'react-native';

export default function MapComponent({ style }: any) {
  return (
    <View style={[style, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' }]}>
      <Text style={{ color: '#64748b', fontWeight: 'bold' }}>Map View is available on Mobile App</Text>
      <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Click the "View Customer Location on Maps" button below</Text>
    </View>
  );
}
