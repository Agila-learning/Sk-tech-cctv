import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert, Dimensions } from 'react-native';
import { Shield, DollarSign, Star, Zap, Activity, Play, Square, Clock, CheckCircle, MapPin, Bell } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Location from 'expo-location';
import { Colors } from '../../theme/colors';
import { StatCard, Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function TechDashScreen({ navigation }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [isOnShift, setIsOnShift] = useState(false);
  const [shiftTime, setShiftTime] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [workTime, setWorkTime] = useState(0);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [availability, setAvailability] = useState('available');
  const [activeJob, setActiveJob] = useState<any>(null);
  const shiftTimer = useRef<any>(null);
  const workTimer = useRef<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [techStats, attendance, logs, jobs] = await Promise.allSettled([
        fetchWithAuth('/technician/stats'),
        fetchWithAuth('/attendance/my'),
        fetchWithAuth('/worklogs/my/today'),
        fetchWithAuth('/technician/my-tasks'),
      ]);
      setStats(techStats.status === 'fulfilled' ? techStats.value || {} : {});
      setWorkLogs(logs.status === 'fulfilled' ? logs.value || [] : []);

      if (attendance.status === 'fulfilled') {
        const today = new Date().toISOString().split('T')[0];
        const rec = (attendance.value || []).find((r: any) => r.date === today);
        if (rec && !rec.checkOut?.time) {
          setIsOnShift(true);
          const st = new Date(rec.checkIn?.time || rec.checkIn).getTime();
          setShiftTime(Math.floor((Date.now() - st) / 1000));
        }
      }
      if (logs.status === 'fulfilled') {
        const active = (logs.value || []).find((l: any) => l.status === 'active');
        if (active) { setIsWorking(true); setWorkTime(Math.floor((Date.now() - new Date(active.startTime).getTime()) / 1000)); }
      }
      if (jobs.status === 'fulfilled' && jobs.value?.length) {
        const pending = jobs.value.filter((j: any) => j.order?.status !== 'delivered' && j.order?.status !== 'completed');
        setActiveJob(pending.find((j: any) => !j.stages?.completed?.status) || null);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let locSub: any = null;
    
    const trackLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permission Denied', 'GPS tracking requires location permissions.'); return; }
      
      locSub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 30000, distanceInterval: 50 },
        async (loc) => {
          try {
            await fetchWithAuth('/technician/gps', {
              method: 'PATCH',
              body: JSON.stringify({ lat: loc.coords.latitude, lng: loc.coords.longitude, status: 'Active' })
            });
          } catch (e) { console.log('Location update failed'); }
        }
      );
    };

    if (isOnShift) { 
      shiftTimer.current = setInterval(() => setShiftTime(p => p + 1), 1000); 
      trackLocation();
    }
    else { 
      clearInterval(shiftTimer.current); 
      setShiftTime(0); 
      if (locSub) locSub.remove();
    }
    return () => { clearInterval(shiftTimer.current); if (locSub) locSub.remove(); };
  }, [isOnShift]);

  useEffect(() => {
    if (isWorking) { workTimer.current = setInterval(() => setWorkTime(p => p + 1), 1000); }
    else { clearInterval(workTimer.current); }
    return () => clearInterval(workTimer.current);
  }, [isWorking]);

  const fmt = (sec: number) => `${String(Math.floor(sec / 3600)).padStart(2, '0')}:${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const screenWidth = Dimensions.get('window').width;
  const chartConfig = {
    backgroundGradientFrom: Colors.bgCard,
    backgroundGradientTo: Colors.bgCard,
    color: (opacity = 1) => `rgba(20, 184, 166, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  const handleShift = async () => {
    try {
      if (!isOnShift) { 
        await fetchWithAuth('/attendance/punch-in', { method: 'POST', body: JSON.stringify({}) }); 
        await fetchWithAuth('/technician/status', { method: 'PATCH', body: JSON.stringify({ status: 'Available' }) });
        setIsOnShift(true); 
      }
      else { 
        if (isWorking) { Alert.alert('Error', 'End work session first'); return; } 
        await fetchWithAuth('/attendance/punch-out', { method: 'POST', body: JSON.stringify({}) }); 
        await fetchWithAuth('/technician/status', { method: 'PATCH', body: JSON.stringify({ status: 'Offline' }) });
        setIsOnShift(false); 
      }
      loadData();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const handleWork = async () => {
    if (!isOnShift) { Alert.alert('Error', 'Start your shift first'); return; }
    try {
      if (!isWorking) { await fetchWithAuth('/worklogs/start', { method: 'POST', body: JSON.stringify({ taskDescription: 'General Work' }) }); setIsWorking(true); }
      else { await fetchWithAuth('/worklogs/end', { method: 'POST', body: JSON.stringify({}) }); setIsWorking(false); }
      loadData();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View><View style={s.tagRow}><Activity color={Colors.primary} size={12} /><Text style={s.tag}>SERVICE BOARD</Text></View>
            <Text style={s.name}>{user?.name || 'Technician'}</Text></View>
          <TouchableOpacity style={s.bellBtn}><Bell color={Colors.fgMuted} size={20} /></TouchableOpacity>
        </View>

        {/* Shift Controls */}
        <View style={s.shiftCard}>
          <View style={s.shiftRow}>
            <View style={s.shiftCol}><Text style={s.shiftLabel}>SHIFT</Text><Text style={s.timer}>{fmt(shiftTime)}</Text></View>
            <TouchableOpacity style={[s.shiftBtn, isOnShift ? s.shiftBtnEnd : s.shiftBtnStart]} onPress={handleShift}>
              <Text style={s.shiftBtnT}>{isOnShift ? 'End Shift' : 'Punch In'}</Text>
            </TouchableOpacity>
          </View>
          <View style={[s.shiftRow, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 16, marginTop: 16 }]}>
            <View style={s.shiftCol}><Text style={s.shiftLabel}>SESSION</Text><Text style={[s.timer, { color: Colors.warning }]}>{fmt(workTime)}</Text></View>
            <TouchableOpacity style={[s.workBtn, isWorking && { backgroundColor: Colors.warning }]} onPress={handleWork} disabled={!isOnShift}>
              {isWorking ? <Square color="#fff" size={18} /> : <Play color={Colors.fgMuted} size={18} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCard icon={<DollarSign color={Colors.success} size={20} />} label="Income" value={stats?.weeklyEarnings || '₹0'} color={Colors.success} onPress={() => navigation.navigate('Earnings')} />
          <StatCard icon={<Star color={Colors.warning} size={20} />} label="Rating" value={stats?.SystemsScore || '0.0'} color={Colors.warning} />
        </View>
        <View style={s.statsRow}>
          <StatCard icon={<Shield color={Colors.primary} size={20} />} label="Jobs Done" value={stats?.completedJobs || '0'} color={Colors.primary} />
          <StatCard icon={<Zap color={Colors.purple} size={20} />} label="Expenses" value="View" color={Colors.purple} onPress={() => navigation.navigate('Expenses')} />
        </View>

        {/* Charts */}
        <View style={s.chartSec}>
          <Text style={s.chartTitle}>Earnings Trend</Text>
          <LineChart data={{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], datasets: [{ data: [1500, 2300, 1800, 3200, 2900, 4100] }] }} width={screenWidth - 40} height={220} chartConfig={chartConfig} bezier style={s.chart} />
        </View>

        <View style={s.chartSec}>
          <Text style={s.chartTitle}>Tasks Completed</Text>
          <BarChart data={{ labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], datasets: [{ data: [3, 5, 2, 6, 4, 8] }] }} width={screenWidth - 40} height={220} chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})` }} style={s.chart} yAxisLabel="" yAxisSuffix="" />
        </View>

        {/* Active Job */}
        {activeJob ? (
          <View style={s.jobCard}>
            <Badge label="ACTIVE JOB" color="blue" /><Text style={s.jobTitle}>{activeJob.order?.products?.[0]?.product?.name || 'Service Task'}</Text>
            <View style={s.jobRow}><MapPin color={Colors.danger} size={14} /><Text style={s.jobAddr}>{activeJob.order?.deliveryAddress || 'N/A'}</Text></View>
            <TouchableOpacity style={s.viewBtn} onPress={() => navigation.navigate('Tasks')}><Text style={s.viewBtnT}>VIEW WORKFLOW</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={s.noJob}><CheckCircle color={Colors.success} size={32} /><Text style={s.noJobT}>No Active Tasks</Text></View>
        )}

        {/* Work Logs */}
        <View style={s.logSection}><Text style={s.logTitle}>Today's Sessions ({workLogs.length})</Text>
          {workLogs.map((log, i) => (
            <View key={i} style={s.logRow}><Clock color={Colors.fgMuted} size={14} />
              <Text style={s.logText}>{log.taskDescription || 'Work'}</Text>
              <Text style={s.logDur}>{log.duration ? `${log.duration}h` : 'Active'}</Text>
            </View>
          ))}
          {workLogs.length === 0 && <Text style={s.logEmpty}>No sessions logged today</Text>}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20 },
  tagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tag: { fontSize: 9, fontWeight: '900', color: Colors.primary, letterSpacing: 3 },
  name: { fontSize: 26, fontWeight: '900', color: Colors.fgPrimary },
  bellBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  shiftCard: { marginHorizontal: 20, backgroundColor: Colors.bgSurface, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shiftCol: { gap: 4 },
  shiftLabel: { fontSize: 9, fontWeight: '900', color: Colors.fgMuted, letterSpacing: 2 },
  timer: { fontSize: 28, fontWeight: '900', color: Colors.primaryLight, fontVariant: ['tabular-nums'] },
  shiftBtn: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16 },
  shiftBtnStart: { backgroundColor: Colors.primary },
  shiftBtnEnd: { backgroundColor: Colors.danger },
  shiftBtnT: { fontSize: 10, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5 },
  workBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.bgMuted, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  jobCard: { marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16, gap: 10 },
  jobTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobAddr: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  viewBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  viewBtnT: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
  noJob: { marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 32, alignItems: 'center', gap: 12, marginBottom: 16 },
  noJobT: { fontSize: 16, fontWeight: '800', color: Colors.fgMuted },
  chartSec: { marginHorizontal: 20, marginBottom: 16 },
  chartTitle: { fontSize: 13, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  chart: { borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  logSection: { marginHorizontal: 20, gap: 10 },
  logTitle: { fontSize: 13, fontWeight: '900', color: Colors.fgMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  logRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.border },
  logText: { flex: 1, fontSize: 12, fontWeight: '700', color: Colors.fgPrimary },
  logDur: { fontSize: 12, fontWeight: '800', color: Colors.primaryLight },
  logEmpty: { fontSize: 12, color: Colors.fgDim, fontWeight: '600', textAlign: 'center', paddingVertical: 16 },
});
