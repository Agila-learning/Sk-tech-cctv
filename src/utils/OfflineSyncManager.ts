import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWithAuth } from '../api/client';

const OFFLINE_QUEUE_KEY = 'SK_TECH_OFFLINE_QUEUE';

export interface OfflineAction {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  timestamp: number;
}

export const getOfflineQueue = async (): Promise<OfflineAction[]> => {
  try {
    const data = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting offline queue', error);
    return [];
  }
};

export const enqueueAction = async (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
  try {
    const queue = await getOfflineQueue();
    const newAction: OfflineAction = {
      ...action,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    queue.push(newAction);
    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    console.log('Action queued for offline sync', newAction);
  } catch (error) {
    console.error('Error enqueuing action', error);
  }
};

export const syncOfflineQueue = async () => {
  try {
    const queue = await getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`Starting sync for ${queue.length} items...`);
    const remainingQueue = [];

    for (const action of queue) {
      try {
        await fetchWithAuth(action.url, {
          method: action.method,
          body: JSON.stringify(action.body),
        });
        console.log(`Successfully synced action ${action.id}`);
      } catch (error) {
        console.error(`Failed to sync action ${action.id}`, error);
        remainingQueue.push(action); // Keep in queue for next time
      }
    }

    await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));
    console.log('Offline sync completed');
  } catch (error) {
    console.error('Error during offline sync', error);
  }
};
