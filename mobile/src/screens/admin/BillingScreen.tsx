import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar, RefreshControl } from 'react-native';
import { IndianRupee } from 'lucide-react-native';
import { Colors } from '../../theme/colors';
import { Badge, Button } from '../../components/ui';
import { fetchWithAuth } from '../../api/client';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Image, Alert, TouchableOpacity } from 'react-native';

export default function BillingScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { setLoading(true); const d = await fetchWithAuth('/orders/all'); setData((d || []).filter((o: any) => o.status === 'completed' || o.status === 'delivered')); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const formatDate = (d: string) => { try { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return 'N/A'; } };

  const generateInvoiceHtml = (order: any) => {
    const invId = `INV-${order._id?.slice(-6).toUpperCase()}`;
    const date = formatDate(order.createdAt);
    const subtotal = order.totalAmount / 1.18;
    const gst = order.totalAmount - subtotal;
    const logoUri = Image.resolveAssetSource(require('../../../assets/logo.png')).uri;

    const itemsHtml = order.products?.map((p: any) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${p.product?.name || 'Product'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity || 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(p.price || 0).toLocaleString()}</td>
      </tr>
    `).join('') || `<tr><td colspan="3" style="padding: 12px; text-align: center;">Service/Product Details</td></tr>`;

    return `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', 'Helvetica', sans-serif; color: #333; padding: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f8fafc; padding: 12px; text-align: left; font-weight: bold; color: #334155; border-bottom: 2px solid #cbd5e1; }
            .totals { width: 50%; float: right; border-top: 2px solid #cbd5e1; padding-top: 12px; }
            .totals-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .grand-total { font-size: 18px; font-weight: bold; color: #1e3a8a; margin-top: 12px; border-top: 1px solid #eee; padding-top: 12px; }
            .footer { clear: both; margin-top: 60px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
            <div style="width: 25%; display: flex; justify-content: center; align-items: center; border-right: 2px solid #000; padding-right: 20px;">
              <img src="${logoUri}" style="width: 140px; height: auto;" onerror="this.src='https://sk-tech-cctv.onrender.com/assets/logo.png'" />
            </div>
            <div style="width: 70%; text-align: center;">
              <h1 style="color: #1e3a8a; font-size: 34px; font-weight: 900; margin: 0; text-transform: uppercase;">SK TECHNOLOGY</h1>
              <p style="font-size: 10px; color: #333; margin: 4px 0;">2/222 A, Down Street, Berigai Road, Shoolagiri, Krishnagiri, Tamil Nadu - 635117</p>
              <p style="font-size: 10px; color: #333; margin: 4px 0;">Mobile: 9600975483 | GSTIN: 33BWOPN1889F1Z4 | PAN: BWOPN1889F</p>
            </div>
          </div>
          <div style="background-color: #1e3a8a; color: white; text-align: center; font-weight: bold; font-size: 16px; padding: 12px; margin-bottom: 20px; border: 1px solid #000;">
            TAX INVOICE
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 40px; border: 1px solid #000; padding: 16px;">
            <div>
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e3a8a; text-decoration: underline;">BILLED TO:</p>
              <p style="margin: 4px 0;"><strong>Customer Name:</strong> ${order.customer?.name || 'Guest'}</p>
              <p style="margin: 4px 0;"><strong>Delivery Address:</strong><br/>${order.deliveryAddress || 'Store Pickup'}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0 0 8px 0; font-weight: bold; color: #1e3a8a; text-decoration: underline;">INVOICE DETAILS:</p>
              <p style="margin: 4px 0;"><strong>Invoice Number:</strong> ${invId}</p>
              <p style="margin: 4px 0;"><strong>Invoice Date:</strong> ${date}</p>
              <p style="margin: 4px 0;"><strong>Payment Status:</strong> PAID</p>
            </div>
          </div>
          <table>
            <thead><tr><th>Description</th><th style="text-align: center;">Qty</th><th style="text-align: right;">Amount</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
            <div style="width: 50%;"></div>
            <div class="totals">
              <div class="totals-row"><span>Subtotal:</span><span>₹${subtotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
              <div class="totals-row"><span>GST (18%):</span><span>₹${gst.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
              <div class="totals-row grand-total"><span>Grand Total:</span><span>₹${(order.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span></div>
            </div>
          </div>
          <div class="footer">Thank you for choosing SK Technology! For any support, please contact support@sktechnology.com.</div>
        </body>
      </html>
    `;
  };

  const generateAndSharePdf = async (order: any) => {
    try {
      setLoading(true);
      const html = generateInvoiceHtml(order);
      const { uri } = await Print.printToFileAsync({ html, width: 612, height: 792 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Download / Share Invoice' });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}><StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <View style={s.hdr}><Text style={s.title}>Billing & Invoices</Text></View>
      <FlatList data={data} keyExtractor={(i, idx) => i._id || idx.toString()} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.primary} />}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.ic}><IndianRupee color={Colors.primary} size={20} /></View>
            <View style={s.info}>
              <Text style={s.cName}>{item.customer?.name || 'Customer'}</Text>
              <Text style={s.cSub}>INV-{item._id?.slice(-6).toUpperCase()}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.amt}>₹{item.totalAmount?.toLocaleString()}</Text>
              <TouchableOpacity onPress={() => generateAndSharePdf(item)} style={s.dlBtn}>
                <Text style={s.dlBtnT}>View PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        )} ListEmptyComponent={<Text style={s.empty}>No billing records found</Text>} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hdr: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '900', color: Colors.fgPrimary },
  card: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, padding: 16, alignItems: 'center' },
  ic: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFaint, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  info: { flex: 1, gap: 4 },
  cName: { fontSize: 14, fontWeight: '800', color: Colors.fgPrimary },
  cSub: { fontSize: 11, color: Colors.fgMuted, fontWeight: '600' },
  amt: { fontSize: 16, fontWeight: '900', color: Colors.success, marginBottom: 8 },
  dlBtn: { backgroundColor: Colors.primaryFaint, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: Colors.primary + '30' },
  dlBtnT: { fontSize: 10, fontWeight: '800', color: Colors.primary, textTransform: 'uppercase' },
  empty: { textAlign: 'center', color: Colors.fgDim, fontSize: 14, paddingTop: 40 }
});
