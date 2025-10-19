import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage utility that uses SecureStore on native platforms and localStorage on web
 */
class StorageService {
  private isWeb(): boolean {
    return Platform.OS === "web";
  }

  async getItem(key: string): Promise<string | null> {
    if (this.isWeb()) {
      return localStorage.getItem(key);
    } else if (await SecureStore.isAvailableAsync()) {
      return await SecureStore.getItemAsync(key);
    }
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (this.isWeb()) {
      localStorage.setItem(key, value);
    } else if (await SecureStore.isAvailableAsync()) {
      await SecureStore.setItemAsync(key, value);
    }
  }

  async removeItem(key: string): Promise<void> {
    if (this.isWeb()) {
      localStorage.removeItem(key);
    } else if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(key);
    }
  }
}

export const storageService = new StorageService();