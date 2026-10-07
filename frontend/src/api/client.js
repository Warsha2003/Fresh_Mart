/**
 * Axios API Client Configuration
 * 
 * Base URL is read from frontend/.env via EXPO_PUBLIC_API_URL.
 * Update your laptop Wi-Fi IPv4 in frontend/.env whenever your network changes.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Read API URL from Expo environment variable (fallback to current Wi-Fi LAN IP, never localhost)
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://192.168.8.102:5000/api';

// Small helper that logs the final base URL in development
if (__DEV__) {
  console.log('[API Client] Base URL configured as:', API_BASE_URL);
}

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 35000,
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
    let message;
    if (error.code === 'ECONNABORTED') {
      message = `Cannot reach the server at ${API_BASE_URL}. Request timed out. Check Wi-Fi and that the backend is running.`;
    } else if (!error.response) {
      // Network Error, no response received from backend
      message = `Cannot reach the server at ${API_BASE_URL}. Check Wi-Fi and that the backend is running.`;
    } else {
      message =
        error.response?.data?.message ||
        error.message ||
        'Network request failed. Please check your backend connection.';
    }

    if (!error.config?.suppressErrorLog) {
      console.error(
        `[API Error] [${error.config?.method?.toUpperCase() || 'REQUEST'}] ${error.config?.url}:`,
        message
      );
    }

    const enhancedError = new Error(message);
    if (error.response) {
      enhancedError.response = error.response;
      enhancedError.status = error.response.status;
    }
    return Promise.reject(enhancedError);
  }
);

export default client;
