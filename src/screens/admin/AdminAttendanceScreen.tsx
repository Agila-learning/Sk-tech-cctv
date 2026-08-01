import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithAuth } from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminAttendanceScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/attendance?startDate=${filterDate}&endDate=${filterDate}`);
      setAttendance(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterDate]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STAFF ATTENDANCE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#0D8ABC" style={{ marginTop: 50 }} />
        ) : attendance.length === 0 ? (
          <Text style={styles.emptyText}>No attendance records for today.</Text>
        ) : (
          attendance.map((record) => (
            <View key={record._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{record.user?.name?.charAt(0) || '?'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 15 }}>
                  <Text style={styles.nameText}>{record.user?.name || 'Unknown'}</Text>
                  <Text style={styles.roleText}>{record.user?.role || 'Staff'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: record.status === 'present' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)' }]}>
                  <Text style={[styles.statusText, { color: record.status === 'present' ? '#2ecc71' : '#e74c3c' }]}>{record.status}</Text>
                </View>
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>CHECK IN</Text>
                  <Text style={styles.timeVal}>{record.checkIn?.time ? new Date(record.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</Text>
                </View>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>CHECK OUT</Text>
                  <Text style={styles.timeVal}>{record.checkOut?.time ? new Date(record.checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</Text>
                </View>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>HOURS</Text>
                  <Text style={[styles.timeVal, { color: '#3498db' }]}>{record.hoursWorked || '--'}h</Text>
                </View>
              </View>

              {record.checkIn?.location?.lat && (
                <TouchableOpacity 
                  style={styles.mapBtn}
                  onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${record.checkIn.location.lat},${record.checkIn.location.lng}`)}
                >
                  <Ionicons name="location" size={16} color="#3498db" />
                  <Text style={styles.mapText}>View Location on Map</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
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
  emptyText: { color: '#6b7280', textAlign: 'center', marginTop: 50 },
  card: { backgroundColor: '#131b2f', padding: 20, borderRadius: 20, marginBottom: 15 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 45, height: 45, borderRadius: 25, backgroundColor: 'rgba(13, 138, 188, 0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#0D8ABC', fontWeight: 'bold', fontSize: 18 },
  nameText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  roleText: { color: '#6b7280', fontSize: 12, textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 15 },
  timeCol: { alignItems: 'center' },
  timeLabel: { color: '#6b7280', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  timeVal: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  mapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(52, 152, 219, 0.1)', padding: 10, borderRadius: 10, marginTop: 15 },
  mapText: { color: '#3498db', fontWeight: 'bold', marginLeft: 8, fontSize: 12 }
});

export default AdminAttendanceScreen;
