import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import * as SecureStore from '../utils/storage';

export const handleExport = async (endpoint: string, filename: string) => {
  try {
    const token = await SecureStore.getItemAsync('sk_auth_token');
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://sk-tech-cctv.onrender.com/api';
    
    // We construct the full URL
    const url = `${apiUrl}${endpoint}`;
    
    if (Platform.OS === 'web') {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Server returned status ${response.status}`);
      const blob = await response.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objUrl);
      return;
    }
    
    // Native Mobile Download
    const fileUri = `${(FileSystem as any).documentDirectory}${filename}`;
    
    const downloadRes = await (FileSystem as any).downloadAsync(url, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (downloadRes.status !== 200) {
      throw new Error(`Failed to download file (Status ${downloadRes.status})`);
    }

    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (!isSharingAvailable) {
      Alert.alert('Download Complete', `File saved to ${fileUri}`);
      return;
    }

    // Trigger the native share/save sheet
    await Sharing.shareAsync(fileUri, {
      mimeType: filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Save or Share Export',
      UTI: filename.endsWith('.pdf') ? 'com.adobe.pdf' : 'com.microsoft.excel.xls'
    });
    
  } catch (error: any) {
    console.error('Export Error:', error);
    Alert.alert('Export Failed', error.message || 'An error occurred while exporting the file.');
  }
};

