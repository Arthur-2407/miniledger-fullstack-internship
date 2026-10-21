import { Platform } from 'react-native';

export function getBaseApiUrl(): string {
  // Check if an explicit environment variable is set
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Android emulator connects to host machine via 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  // Web and iOS simulator use localhost
  return 'http://localhost:5000/api';
}

export const API_BASE_URL = getBaseApiUrl();
