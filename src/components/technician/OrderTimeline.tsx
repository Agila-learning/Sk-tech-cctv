import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, Clock, Navigation, Play, Pause, Hammer, ShieldCheck } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

export default function OrderTimeline({ stages }: any) {
  // Mock timeline mapping
  const timelineEvents = [
    { id: 'assigned', title: 'Order Assigned', icon: <Clock color="#fff" size={14} />, color: Colors.info, active: !!stages?.assigned?.status, time: stages?.assigned?.timestamp },
    { id: 'accepted', title: 'Accepted by Technician', icon: <CheckCircle color="#fff" size={14} />, color: Colors.primary, active: !!stages?.accepted?.status, time: stages?.accepted?.timestamp },
    { id: 'reached', title: 'Reached Site', icon: <Navigation color="#fff" size={14} />, color: Colors.primaryLight, active: !!stages?.reached?.status, time: stages?.reached?.timestamp },
    { id: 'started', title: 'Work Started', icon: <Play color="#fff" size={14} />, color: Colors.warning, active: !!stages?.started?.status, time: stages?.started?.timestamp },
    { id: 'paused', title: 'Work Paused (Material Delay)', icon: <Pause color="#fff" size={14} />, color: Colors.danger, active: false, time: null }, // Mock for UI demo
    { id: 'completed', title: 'Work Completed', icon: <Hammer color="#fff" size={14} />, color: Colors.success, active: !!stages?.completed?.status, time: stages?.completed?.timestamp },
    { id: 'approved', title: 'Admin Approved', icon: <ShieldCheck color="#fff" size={14} />, color: Colors.success, active: false, time: null }
  ];

  return (
    <View style={s.container}>
      {timelineEvents.map((ev, idx) => (
        <View key={ev.id} style={s.row}>
          {/* Vertical Line */}
          {idx !== timelineEvents.length - 1 && (
            <View style={[s.line, ev.active ? { backgroundColor: ev.color } : { backgroundColor: Colors.border }]} />
          )}
          
          {/* Icon Node */}
          <View style={[s.node, ev.active ? { backgroundColor: ev.color, borderColor: ev.color } : { backgroundColor: Colors.bgSurface, borderColor: Colors.border }]}>
            {ev.active ? ev.icon : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border }} />}
          </View>
          
          {/* Content */}
          <View style={s.content}>
            <Text style={[s.title, ev.active ? { color: Colors.fgPrimary } : { color: Colors.fgMuted }]}>{ev.title}</Text>
            {ev.time && (
              <Text style={s.time}>{new Date(ev.time).toLocaleString()}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  container: { paddingVertical: 16, paddingHorizontal: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', minHeight: 60 },
  node: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2, backgroundColor: Colors.bgCard },
  line: { position: 'absolute', left: 13, top: 28, width: 2, height: '100%', zIndex: 1 },
  content: { marginLeft: 16, marginTop: 4, flex: 1, paddingBottom: 24 },
  title: { fontSize: 14, fontWeight: '800' },
  time: { fontSize: 11, color: Colors.fgMuted, marginTop: 4, fontWeight: '600' }
});
