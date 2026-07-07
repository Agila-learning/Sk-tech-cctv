import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/colors';
import { ChevronLeft, CheckCircle2, Clock } from 'lucide-react-native';
import { Button } from '../../components/ui';

export default function ServiceTimelineScreen({ route, navigation }: any) {
  const { request } = route.params;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Service Completed': case 'Closed': return Colors.success;
      case 'Rejected': return Colors.danger;
      default: return Colors.primary;
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft color={Colors.fgPrimary} size={24} />
        </TouchableOpacity>
        <Text style={s.title}>Timeline: #{request._id.slice(-6).toUpperCase()}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: Colors.fgPrimary, marginBottom: 20 }}>Service Tracking</Text>
        
        {request.timeline && request.timeline.map((step: any, idx: number) => {
          const isLast = idx === request.timeline.length - 1;
          const color = getStatusColor(step.status);
          
          return (
            <View key={idx} style={{ flexDirection: 'row' }}>
              <View style={{ alignItems: 'center', width: 30 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: color, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
                  <CheckCircle2 color="#fff" size={12} />
                </View>
                {!isLast && <View style={{ width: 2, height: '100%', backgroundColor: Colors.border, position: 'absolute', top: 10, bottom: -10, zIndex: 1 }} />}
              </View>
              
              <View style={{ flex: 1, paddingBottom: 24, paddingLeft: 12, marginTop: -4 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.fgPrimary }}>{step.status}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.fgMuted, marginTop: 4 }}>{formatDate(step.date)}</Text>
                {step.remarks ? (
                  <Text style={{ fontSize: 13, color: Colors.fgMuted, marginTop: 6, lineHeight: 18 }}>{step.remarks}</Text>
                ) : null}
              </View>
            </View>
          );
        })}

        {request.status === 'Waiting Approval' && (
          <View style={{ marginTop: 20, padding: 16, backgroundColor: Colors.warningFaint, borderRadius: 16, borderWidth: 1, borderColor: Colors.warning }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.warning }}>Paid Service Estimate</Text>
            <Text style={{ fontSize: 13, color: Colors.warning, marginTop: 4 }}>The technician has provided an estimate for your approval.</Text>
            <Button title="View Estimate & Approve" style={{ marginTop: 12, backgroundColor: Colors.warning }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.fgPrimary }
});
