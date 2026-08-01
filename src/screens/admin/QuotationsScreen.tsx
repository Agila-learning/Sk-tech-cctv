import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithAuth } from '../../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuotationsScreen = ({ navigation }: any) => {
  const [loading, setLoading] = useState(false);
  const [quotations, setQuotations] = useState<any[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/billing');
      const allBilling = Array.isArray(res) ? res : [];
      setQuotations(allBilling.filter((item: any) => item.type === 'quotation'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleWhatsApp = (q: any) => {
    const phone = q.manualCustomer?.phone || q.customer?.phone || '';
    if (!phone) return;
    const text = `Hello ${q.manualCustomer?.name || 'Customer'},\nWe are following up on your quotation #${q.invoiceNumber}. Please let us know if you have any questions!`;
    Linking.openURL(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QUOTATIONS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#0D8ABC" style={{ marginTop: 50 }} />
        ) : quotations.length === 0 ? (
          <Text style={styles.emptyText}>No quotations found.</Text>
        ) : (
          quotations.map((q) => (
            <View key={q._id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{q.invoiceNumber}</Text>
                </View>
                <Text style={styles.dateText}>{new Date(q.createdAt).toLocaleDateString()}</Text>
              </View>

              <Text style={styles.nameText}>{q.manualCustomer?.name || 'Walk-in Customer'}</Text>
              <Text style={styles.phoneText}>{q.manualCustomer?.phone || 'No Phone'}</Text>

              <View style={styles.statusRow}>
                <View style={[styles.statusIndicator, { 
                  backgroundColor: 
                    ['Confirmed', 'Completed', 'Approved'].includes(q.followUpStatus) ? '#2ecc71' : 
                    ['Cancelled', 'Rejected', 'Expired'].includes(q.followUpStatus) ? '#e74c3c' : '#0D8ABC' 
                }]} />
                <Text style={styles.statusText}>{q.followUpStatus || 'Draft'}</Text>
              </View>

              <View style={styles.footer}>
                <Text style={styles.amountText}>₹{q.totalAmount?.toLocaleString()}</Text>
                <TouchableOpacity onPress={() => handleWhatsApp(q)} style={styles.waButton}>
                  <Ionicons name="logo-whatsapp" size={16} color="#2ecc71" />
                  <Text style={styles.waText}>Follow Up</Text>
                </TouchableOpacity>
              </View>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  badge: { backgroundColor: 'rgba(13, 138, 188, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: '#0D8ABC', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dateText: { color: '#6b7280', fontSize: 12, fontWeight: 'bold' },
  nameText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  phoneText: { color: '#6b7280', fontSize: 14, marginBottom: 15 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  statusIndicator: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#1f2937', paddingTop: 15 },
  amountText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  waButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(46, 204, 113, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  waText: { color: '#2ecc71', fontWeight: 'bold', fontSize: 12, marginLeft: 8 }
});

export default QuotationsScreen;
