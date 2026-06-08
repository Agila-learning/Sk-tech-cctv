import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const handleExport = async (endpoint: string, filename: string) => {
  try {
    const token = await SecureStore.getItemAsync('sk_auth_token');
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'https://sk-tech-cctv.onrender.com/api';
    
    // We construct the full URL
    const url = `${apiUrl}${endpoint}`;
    
    // Where we will temporarily save the file
    const fileUri = `${(FileSystem as any).documentDirectory}${filename}`;
    
    // Download the file from the API using Expo FileSystem
    const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (downloadRes.status !== 200) {
      throw new Error(`Server returned status ${downloadRes.status}`);
    }

    // Check if sharing is available
    const isSharingAvailable = await Sharing.isAvailableAsync();
    
    if (!isSharingAvailable) {
      Alert.alert('Download Complete', `File saved to ${downloadRes.uri}`);
      return;
    }

    // Trigger the native share/save sheet
    await Sharing.shareAsync(downloadRes.uri, {
      mimeType: filename.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Save or Share Export',
      UTI: filename.endsWith('.pdf') ? 'com.adobe.pdf' : 'com.microsoft.excel.xls'
    });
    
  } catch (error: any) {
    console.error('Export Error:', error);
    Alert.alert('Export Failed', error.message || 'An error occurred while exporting the file.');
  }
};
