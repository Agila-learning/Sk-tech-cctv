import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, RefreshControl, Alert, Dimensions, Platform } from 'react-native';
import { Shield, DollarSign, Star, Zap, Activity, Play, Square, Clock, CheckCircle, MapPin, Bell, RefreshCw } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import * as Location from 'expo-location';
import { Colors } from '../../theme/colors';
import { StatCard, Badge } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useFocusEffect } from '@react-navigation/native';

export default function TechDashScreen({ navigation }: any) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [isOnShift, setIsOnShift] = useState(false);
  const [shiftTime, setShiftTime] = useState(0);
  const [isWorking, setIsWorking] = useState(false);
  const [workTime, setWorkTime] = useState(0);
  const [workLogs, setWorkLogs] = useState<any[]>([]);
  const [availability, setAvailability] = useState('Offline');
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
      if (techStats.status === 'fulfilled' && techStats.value?.availabilityStatus) {
        setAvailability(techStats.value.availabilityStatus);
      }

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

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (socket) {
      socket.on('task_assigned', loadData);
      socket.on('task_updated', loadData);
      socket.on('order_updated', loadData);
      socket.on('order_assigned', loadData);
      return () => {
        socket.off('task_assigned', loadData);
        socket.off('task_updated', loadData);
        socket.off('order_updated', loadData);
        socket.off('order_assigned', loadData);
      };
    }
  }, [socket]);

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
              body: JSON.stringify({ 
                lat: loc.coords.latitude, 
                lng: loc.coords.longitude, 
                heading: loc.coords.heading || 0,
                status: 'active' 
              })
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
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => Colors.fgMuted,
    strokeWidth: 2,
    barPercentage: 0.5,
    decimalPlaces: 0,
  };

  const handleShift = async () => {
    try {
      if (!isOnShift) { 
        await fetchWithAuth('/attendance/punch-in', { method: 'POST', body: JSON.stringify({}) }); 
        setIsOnShift(true); 
      } else { 
        if (isWorking) { Alert.alert('Error', 'End work session first'); return; } 
        if (activeJob) { Alert.alert('Cannot End Shift', 'Complete the ongoing work before ending your shift.'); return; }
        await fetchWithAuth('/attendance/punch-out', { method: 'POST', body: JSON.stringify({}) }); 
        setIsOnShift(false); 
      }
      loadData();
    } catch (e: any) { 
      Alert.alert('Unable to End Shift', e.message || 'Cannot end shift while assigned to an active task. Please finish it first.'); 
    }
  };

  const handleWork = async () => {
    if (!isOnShift) { Alert.alert('Error', 'Start your shift first'); return; }
    try {
      if (!isWorking) { await fetchWithAuth('/worklogs/start', { method: 'POST', body: JSON.stringify({ taskDescription: 'General Work' }) }); setIsWorking(true); }
      else { await fetchWithAuth('/worklogs/end', { method: 'POST', body: JSON.stringify({}) }); setIsWorking(false); }
      loadData();
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  const toggleAvailability = async () => {
    const order = ['Available', 'Assigned', 'On Leave', 'Offline'];
    let currentIndex = order.indexOf(availability);
    if (currentIndex === -1) currentIndex = 0;
    const nextStatus = order[(currentIndex + 1) % order.length];
    
    if (nextStatus === 'Offline' && activeJob) {
      Alert.alert('Cannot Go Offline', 'Complete the ongoing work before ending your shift.');
      return;
    }
    
    try {
      setLoading(true);
      await fetchWithAuth('/technician/status', {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus })
      });
      setAvailability(nextStatus);
      if (Platform.OS === 'web') {
        // Silent on web, visual update is enough
      } else {
        Alert.alert('Status Updated', `You are now marked as ${nextStatus}`);
      }
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={Colors.primary} />} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <View style={s.tagRow}>
              <Activity color={Colors.primary} size={12} />
              <Text style={s.tag}>SERVICE BOARD</Text>
            </View>
            <Text style={s.name} numberOfLines={1}>{user?.name || 'Technician'}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.fgMuted, marginTop: 4 }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={toggleAvailability} style={[s.statusToggle, availability === 'Available' ? s.statusToggleActive : availability === 'Assigned' ? { backgroundColor: Colors.warning + '10', borderColor: Colors.warning + '40' } : availability === 'On Leave' ? { backgroundColor: Colors.purple + '10', borderColor: Colors.purple + '40' } : null]}>
              <View style={[s.statusDot, availability === 'Available' ? { backgroundColor: Colors.success } : availability === 'Assigned' ? { backgroundColor: Colors.warning } : availability === 'On Leave' ? { backgroundColor: Colors.purple } : { backgroundColor: Colors.fgMuted }]} />
              <Text style={[s.statusText, availability === 'Available' ? { color: Colors.success } : availability === 'Assigned' ? { color: Colors.warning } : availability === 'On Leave' ? { color: Colors.purple } : { color: Colors.fgMuted }]}>{availability === 'Assigned' ? 'Busy' : availability}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.bellBtn} onPress={loadData}><RefreshCw color={Colors.fgMuted} size={20} /></TouchableOpacity>
          </View>
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
        <View style={s.statsRow}>
          <StatCard icon={<CheckCircle color={Colors.info} size={20} />} label="Leaves" value="Request" color={Colors.info} onPress={() => navigation.navigate('Leave Requests')} />
          <StatCard icon={<RefreshCw color={Colors.primaryLight} size={20} />} label="Sync" value="Refresh" color={Colors.primaryLight} onPress={loadData} />
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Badge label={activeJob.order?.serviceType ? activeJob.order.serviceType.toUpperCase() : 'CCTV INSTALLATION'} color="blue" />
              <Badge label={`Day: ${activeJob.order?.dailyReports?.length ? activeJob.order.dailyReports.length + 1 : 1}/${activeJob.order?.expectedDays || 1}`} color="purple" />
            </View>
            
            <Text style={s.jobTitle}>{activeJob.order?.customerName || activeJob.order?.customer?.name || 'ABC Company'}</Text>
            <Text style={{ fontSize: 14, color: Colors.primaryLight, fontWeight: '700' }}>Service: {activeJob.order?.serviceType || 'CCTV Installation'}</Text>
            
            <View style={s.jobRow}>
              <MapPin color={Colors.danger} size={14} />
              <Text style={s.jobAddr}>{activeJob.order?.deliveryAddress || 'Customer Site'}</Text>
            </View>

            <View style={{ marginTop: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, color: Colors.fgMuted, fontWeight: '700' }}>Status: {activeJob.order?.status === 'pending_approval' ? 'Pending Admin Approval' : activeJob.order?.status === 'in_progress' ? 'In Progress' : 'Assigned'}</Text>
                <Text style={{ fontSize: 12, color: Colors.success, fontWeight: '800' }}>Progress: {activeJob.order?.progress || '40%'}</Text>
              </View>
              <View style={{ height: 6, backgroundColor: Colors.bgSurface, borderRadius: 3, overflow: 'hidden' }}>
                <View style={{ width: activeJob.order?.progress || '40%', height: 6, backgroundColor: Colors.success }} />
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={s.actionBtnMain} onPress={() => navigation.navigate('Tasks')}>
                <Text style={s.actionBtnMainT}>Accept Order</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtnMain} onPress={() => navigation.navigate('Tasks')}>
                <Text style={s.actionBtnMainT}>Start Work</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtnAlt} onPress={() => navigation.navigate('Tasks')}>
                <Text style={s.actionBtnAltT}>Upload Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtnSuccess} onPress={() => navigation.navigate('Tasks')}>
                <Text style={s.actionBtnSuccessT}>Complete Work</Text>
              </TouchableOpacity>
            </View>
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
  statusToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, gap: 6 },
  statusToggleActive: { borderColor: Colors.success + '40', backgroundColor: Colors.success + '10' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  bellBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.bgSurface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  shiftCard: { marginHorizontal: 20, backgroundColor: Colors.bgSurface, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16 },
  shiftRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  shiftCol: { gap: 4 },
  shiftLabel: { fontSize: 9, fontWeight: '900', color: Colors.fgMuted, letterSpacing: 2 },
  timer: { fontSize: 26, fontWeight: '900', color: Colors.primaryLight, fontVariant: ['tabular-nums'] },
  shiftBtn: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, minWidth: 100, alignItems: 'center' },
  shiftBtnStart: { backgroundColor: Colors.primary },
  shiftBtnEnd: { backgroundColor: Colors.danger },
  shiftBtnT: { fontSize: 10, fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5 },
  workBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.bgMuted, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 12 },
  jobCard: { marginHorizontal: 20, backgroundColor: Colors.bgCard, borderRadius: 24, borderWidth: 1, borderColor: Colors.border, padding: 20, marginBottom: 16, gap: 10 },
  jobTitle: { fontSize: 20, fontWeight: '900', color: Colors.fgPrimary },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobAddr: { fontSize: 12, color: Colors.fgMuted, fontWeight: '600', flex: 1 },
  viewBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  viewBtnT: { fontSize: 11, fontWeight: '900', color: '#fff', letterSpacing: 1.5 },
  actionBtnMain: { flex: 1, minWidth: '45%', backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnMainT: { fontSize: 12, fontWeight: '800', color: '#fff' },
  actionBtnAlt: { flex: 1, minWidth: '45%', backgroundColor: Colors.purple, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnAltT: { fontSize: 12, fontWeight: '800', color: '#fff' },
  actionBtnSuccess: { flex: 1, minWidth: '45%', backgroundColor: Colors.success, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  actionBtnSuccessT: { fontSize: 12, fontWeight: '800', color: '#fff' },
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
