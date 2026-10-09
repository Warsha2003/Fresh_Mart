/**
 * Axios API Client Configuration
 * 
 * Base URL is read from frontend/.env via EXPO_PUBLIC_API_URL.
 * Update your laptop Wi-Fi IPv4 in frontend/.env whenever your network changes.
 */
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

const FALLBACK_API_URL = 'http://192.168.8.100:5000/api';

/**
 * Dynamically resolves the API Base URL:
 * 1. In development (__DEV__), automatically inspects Metro's bundle scriptURL.
 *    This allows the app to dynamically connect to the host computer even when
 *    switching between different Wi-Fi networks (hotspot, home Wi-Fi, etc.).
 * 2. Uses process.env.EXPO_PUBLIC_API_URL if configured.
 * 3. Falls back to FALLBACK_API_URL.
 */
export const getApiBaseUrl = () => {
  if (__DEV__) {
    try {
      const scriptURL = NativeModules?.SourceCode?.scriptURL;
      if (scriptURL) {
        const host = scriptURL.split('://')[1]?.split('/')[0]?.split(':')[0];
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          return `http://${host}:5000/api`;
        }
      }
    } catch (_) {}

    try {
      const serverHost = NativeModules?.PlatformConstants?.ServerHost;
      if (serverHost) {
        const host = serverHost.split(':')[0];
        if (host && host !== 'localhost' && host !== '127.0.0.1') {
          return `http://${host}:5000/api`;
        }
      }
    } catch (_) {}
  }

  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  // Discard stale in-memory cached IPs from previous Metro sessions
  if (envUrl && !envUrl.includes('192.168.43.12') && !envUrl.includes('localhost')) {
    return envUrl;
  }

  return FALLBACK_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

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

// Request Interceptor: Automatically attach JWT token and sync dynamic baseURL
client.interceptors.request.async = true;
client.interceptors.request.use(
  async (config) => {
    try {
      const dynamicUrl = getApiBaseUrl();
      if (dynamicUrl && config.baseURL !== dynamicUrl) {
        config.baseURL = dynamicUrl;
      }

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
    const targetUrl = error.config?.baseURL || API_BASE_URL;
    if (error.code === 'ECONNABORTED') {
      message = `Cannot reach the server at ${targetUrl}. Request timed out. Check Wi-Fi and that the backend is running.`;
    } else if (!error.response) {
      // Network Error, no response received from backend
      message = `Cannot reach the server at ${targetUrl}. Check Wi-Fi and that the backend is running.`;
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
