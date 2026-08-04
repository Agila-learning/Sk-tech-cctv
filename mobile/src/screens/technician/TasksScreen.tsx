import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, RefreshControl } from 'react-native';
import { CheckCircle, MapPin, Camera, Check } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';

export default function TasksScreen() {
  const [activeJob, setActiveJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const loadJob = async () => {
    try { setLoading(true);
      const jobs = await fetchWithAuth('/technician/my-tasks');
      if (jobs?.length) { const p = jobs.filter((j: any) => j.order?.status !== 'delivered' && j.order?.status !== 'completed'); setActiveJob(p.find((j: any) => !j.stages?.completed?.status) || null); }
      else setActiveJob(null);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { loadJob(); }, []);

  const getStep = () => {
    if (!activeJob) return 0;
    const t = activeJob.task || {}, st = activeJob.stages || {};
    if (t.workProofs?.completion?.photo) return 6;
    if (t.workProofs?.inProgress?.photo) return 5;
    if (t.workProofs?.start?.photo) return 4;
    if (st.reached?.status) return 3;
    if (st.accepted?.status) return 2;
    if (st.assigned?.status) return 1;
    return 0;
  };

  const handleAction = async (a: string) => {
    try { await fetchWithAuth(`/orders/respond/${activeJob.order._id}`, { method: 'PATCH', body: JSON.stringify({ action: a }) }); loadJob(); }
    catch { Alert.alert('Error', 'Failed'); }
  };
  const advance = async (stage: string) => {
    try { 
      setUploading(true); 
      const body = stage === 'completed' ? { finalize: true, remarks: 'Work completed by technician.' } : {};
      await fetchWithAuth(`/technician/workflow/${activeJob._id}/stage/${stage}`, { method: 'PATCH', body: JSON.stringify(body) }); 
      loadJob(); 
    }
    catch (e: any) { Alert.alert('Error', e.message); } finally { setUploading(false); }
  };

  const steps = ['Assigned', 'Accept', 'Arrived', 'Start', 'Progress', 'Done'];
  const step = getStep();

  if (!activeJob) return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.empty}><CheckCircle color={Colors.success} size={48} /><Text style={s.emptyT}>No Active Tasks</Text><Button title="Refresh" onPress={loadJob} variant="secondary" /></View></View>
  );

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadJob} tintColor={Colors.primary} />} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
        <Text style={s.hdr}>Active Task</Text>
        <Badge label={`#${activeJob.order._id.slice(-6)}`} color="blue" size="md" />
        <Text style={s.jName}>{activeJob.order?.products?.[0]?.product?.name || 'Service Task'}</Text>
        <View style={s.ar}><MapPin color={Colors.danger} size={14} /><Text style={s.addr}>{activeJob.order?.deliveryAddress}</Text></View>
        <View style={s.stepsRow}>{steps.map((l, i) => { const n = i + 1, d = step > n, ac = step === n; return (
          <View key={i} style={s.si}><View style={[s.sc, d && s.sd, ac && s.sa]}>{d ? <Check color="#fff" size={14} /> : <Text style={[s.sn, ac && { color: Colors.primary }]}>{n}</Text>}</View>
            <Text style={[s.sl, ac && { color: Colors.primary }]}>{l}</Text></View>); })}</View>
        <View style={s.ac}>
          {step === 1 && (<><Text style={s.at}>New Assignment</Text><View style={s.br}><Button title="Accept" onPress={() => handleAction('accept')} style={{ flex: 1 }} /><Button title="Decline" onPress={() => handleAction('reject')} variant="danger" style={{ flex: 1 }} /></View></>)}
          {step === 2 && (<><Text style={s.at}>Navigate to Site</Text><Button title="Report Arrival" onPress={() => advance('reached')} fullWidth loading={uploading} /></>)}
          {step === 3 && (<><Text style={s.at}>Start Work Photo</Text><Button title="Upload Start Photo" onPress={() => advance('started')} fullWidth loading={uploading} icon={<Camera color="#fff" size={16} />} /></>)}
          {step === 4 && (<><Text style={s.at}>Work In Progress</Text><Button title="Upload Progress" onPress={() => advance('inProgress')} fullWidth loading={uploading} /></>)}
          {step === 5 && (<><Text style={s.at}>Completion Proof</Text><Button title="Complete Job" onPress={() => advance('completed')} fullWidth loading={uploading} variant="success" /></>)}
          {step >= 6 && (<Text style={s.at}>Task Complete ✅</Text>)}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyT: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary },
  hdr: { fontSize: 10, fontWeight: '900', color: Colors.fgMuted, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  jName: { fontSize: 24, fontWeight: '900', color: Colors.fgPrimary, marginVertical: 12 },
  ar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  addr: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  si: { alignItems: 'center', gap: 6, flex: 1 },
  sc: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.bgCard, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  sd: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sa: { borderColor: Colors.primary },
  sn: { fontSize: 13, fontWeight: '900', color: Colors.fgDim },
  sl: { fontSize: 8, fontWeight: '800', color: Colors.fgDim, textTransform: 'uppercase', textAlign: 'center' },
  ac: { backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 24, gap: 14 },
  at: { fontSize: 22, fontWeight: '900', color: Colors.fgPrimary },
  br: { flexDirection: 'row', gap: 12 },
});
