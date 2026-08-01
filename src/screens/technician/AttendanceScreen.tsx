import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { fetchWithAuth } from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AttendanceScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);

  const loadData = async () => {
    try {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      
      const res = await fetchWithAuth(`/attendance/summary?month=${month}&year=${year}`);
      
      setStats(res.stats);
      setHistory(res.history || []);
      
      const todayString = now.toISOString().split('T')[0];
      const todayRec = (res.history || []).find((r: any) => r.date === todayString);
      setTodayRecord(todayRec);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePunch = async (type: 'in' | 'out') => {
    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location access to punch in.');
        setLoading(false);
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      
      const payload = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        address: 'Fetched via Mobile GPS',
        deviceInfo: 'Mobile App'
      };

      const endpoint = type === 'in' ? '/attendance/punch-in' : '/attendance/punch-out';
      
      await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      Alert.alert('Success', `Successfully punched ${type}!`);
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to punch in/out.');
    } finally {
      setLoading(false);
    }
  };

  const isPunchedIn = todayRecord && todayRecord.checkIn && !todayRecord.checkOut;
  const isPunchedOut = todayRecord && todayRecord.checkOut;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ATTENDANCE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Punch Card */}
        <View style={styles.card}>
          <Text style={styles.timeText}>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={styles.dateText}>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
          
          <View style={styles.buttonContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#0D8ABC" />
            ) : !todayRecord ? (
              <TouchableOpacity style={[styles.punchBtn, { backgroundColor: '#0D8ABC' }]} onPress={() => handlePunch('in')}>
                <Ionicons name="log-in-outline" size={24} color="#fff" />
                <Text style={styles.punchText}>PUNCH IN</Text>
              </TouchableOpacity>
            ) : isPunchedIn ? (
              <TouchableOpacity style={[styles.punchBtn, { backgroundColor: '#e74c3c' }]} onPress={() => handlePunch('out')}>
                <Ionicons name="log-out-outline" size={24} color="#fff" />
                <Text style={styles.punchText}>PUNCH OUT</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBox}>
                <Ionicons name="checkmark-circle" size={32} color="#2ecc71" />
                <Text style={styles.completedText}>Shift Completed ({todayRecord.hoursWorked} hrs)</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>PRESENT</Text>
            <Text style={[styles.statValue, { color: '#2ecc71' }]}>{stats?.present || 0}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>HOURS</Text>
            <Text style={[styles.statValue, { color: '#3498db' }]}>{stats?.totalHours || 0}</Text>
          </View>
        </View>

        {/* History */}
        <Text style={styles.historyTitle}>MONTHLY HISTORY</Text>
        {history.map((record, i) => (
          <View key={i} style={styles.historyItem}>
            <Text style={styles.historyDate}>{record.date}</Text>
            <Text style={styles.historyTime}>
              {record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'} - {record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
            </Text>
            <Text style={styles.historyHours}>{record.hoursWorked ? `${record.hoursWorked}h` : '--'}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#070b14' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: '#0a101d' },
  menuButton: { padding: 5 },
  headerTitle: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  scrollContent: { padding: 20 },
  card: { backgroundColor: '#131b2f', padding: 30, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  timeText: { fontSize: 40, fontWeight: '900', color: '#fff' },
  dateText: { fontSize: 14, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, marginTop: 5 },
  buttonContainer: { marginTop: 30, width: '100%', alignItems: 'center' },
  punchBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 18, borderRadius: 15 },
  punchText: { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 1, marginLeft: 10 },
  completedBox: { alignItems: 'center', padding: 20, backgroundColor: 'rgba(46, 204, 113, 0.1)', borderRadius: 15, width: '100%' },
  completedText: { color: '#2ecc71', fontWeight: 'bold', marginTop: 10 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#131b2f', padding: 20, borderRadius: 15, marginHorizontal: 5, alignItems: 'center' },
  statLabel: { color: '#6b7280', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  statValue: { fontSize: 24, fontWeight: '900' },
  historyTitle: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginVertical: 15 },
  historyItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#131b2f', padding: 15, borderRadius: 10, marginBottom: 10 },
  historyDate: { color: '#fff', fontWeight: 'bold', flex: 1 },
  historyTime: { color: '#6b7280', flex: 1.5, textAlign: 'center' },
  historyHours: { color: '#3498db', fontWeight: 'bold', flex: 0.5, textAlign: 'right' }
});

export default AttendanceScreen;
