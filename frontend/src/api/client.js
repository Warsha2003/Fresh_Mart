/**
 * Axios API Client Configuration
 * 
 * IMPORTANT FOR VIVA / DEMO:
 * When testing on a physical phone with Expo Go, change API_BASE_URL to your laptop's Wi-Fi IP.
 * Example: 'http://192.168.8.100:5000/api'
 * For Android Emulator: 'http://10.0.2.2:5000/api'
 * For iOS Simulator or Web: 'http://localhost:5000/api'
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// >>> SINGLE CONSTANT: EDIT YOUR LAPTOP IP HERE <<<
export const API_BASE_URL = 'http://192.168.8.100:5000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach JWT token to every protected request
client.interceptors.request.async = true;
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('@freshmart_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('[API Client] Failed to retrieve token from AsyncStorage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format error messages clearly for UI alerts
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Network request failed. Please check your backend connection.';
    console.error(`[API Error] [${error.config?.method?.toUpperCase()}] ${error.config?.url}:`, message);
    return Promise.reject(new Error(message));
  }
);

export default client;
