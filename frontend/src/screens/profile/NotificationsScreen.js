import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { useCustomer } from '../../context/CustomerContext';
import client from '../../api/client';
import { colors } from '../../theme/colors';

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { notificationUnreadCount, refreshNotificationCount } = useCustomer();

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/notifications');
      setNotifications(response.data?.data || []);
      await refreshNotificationCount();
    } catch (error) {
      Alert.alert('Unable to load notifications', error.message);
    } finally {
      setLoading(false);
    }
  }, [refreshNotificationCount]);

  useFocusEffect(useCallback(() => {
    loadNotifications();
  }, [loadNotifications]));

  const markAllRead = useCallback(async () => {
    try {
      setUpdating(true);
      await client.patch('/notifications/read-all');
      setNotifications((items) => items.map((item) => ({ ...item, isRead: true })));
      await refreshNotificationCount();
    } catch (error) {
      Alert.alert('Unable to update notifications', error.message);
    } finally {
      setUpdating(false);
    }
  }, [refreshNotificationCount]);

  const deleteNotification = async (notificationId) => {
    try {
      await client.delete(`/notifications/${notificationId}`);
      setNotifications((items) => items.filter((item) => item._id !== notificationId));
      await refreshNotificationCount();
    } catch (error) {
      Alert.alert('Unable to delete notification', error.message);
    }
  };

  const openNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await client.patch(`/notifications/${notification._id}/read`);
        setNotifications((items) =>
          items.map((item) => item._id === notification._id ? { ...item, isRead: true } : item)
        );
        await refreshNotificationCount();
      }
      const orderId = notification.orderId?._id || notification.orderId;
      if (orderId) {
        navigation.navigate('OrderTracking', { orderId: String(orderId) });
      } else {
        Alert.alert('Order unavailable', 'This notification is not linked to an order.');
      }
    } catch (error) {
      Alert.alert('Unable to open notification', error.message);
    }
  };

  const rightAction = notificationUnreadCount > 0 ? (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Mark all notifications as read"
        disabled={updating}
        onPress={markAllRead}
        style={styles.markAllButton}
      >
        <Text style={styles.markAllText}>All read</Text>
      </TouchableOpacity>
    ) : null;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" onBack={() => navigation.goBack()} rightAction={rightAction} />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={30} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptyMessage}>Order updates will appear here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {notifications.map((notification) => (
            <SwipeableNotification
              key={notification._id}
              notification={notification}
              onOpen={() => openNotification(notification)}
              onDelete={() => deleteNotification(notification._id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const SwipeableNotification = ({ notification, onOpen, onDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) =>
      gesture.dx < -10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_, gesture) => {
      translateX.setValue(Math.max(-76, Math.min(0, gesture.dx)));
    },
    onPanResponderRelease: (_, gesture) => {
      Animated.spring(translateX, {
        toValue: gesture.dx < -38 ? -76 : 0,
        useNativeDriver: true,
      }).start();
    },
  }), [translateX]);

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteAction}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Delete notification"
          onPress={onDelete}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={21} color={colors.textInverse} />
        </TouchableOpacity>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.notificationCard, !notification.isRead && styles.unreadCard, { transform: [{ translateX }] }]}
      >
        <TouchableOpacity onPress={onOpen} activeOpacity={0.85} style={styles.notificationContent}>
          <View style={styles.notificationIcon}>
            <Ionicons name="receipt-outline" size={19} color={colors.primary} />
          </View>
          <View style={styles.notificationText}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <Text style={styles.notificationDate}>{formatDate(notification.createdAt)}</Text>
          </View>
          {!notification.isRead ? <View style={styles.unreadDot} /> : null}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, paddingTop: 42 },
  list: { padding: 14, paddingBottom: 28 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  markAllButton: { paddingVertical: 8, paddingLeft: 4 },
  markAllText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 29, height: 58, justifyContent: 'center', width: 58 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 14 },
  emptyMessage: { color: colors.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center' },
  swipeContainer: { backgroundColor: colors.danger, borderRadius: 15, marginBottom: 10, overflow: 'hidden' },
  deleteAction: { alignItems: 'center', bottom: 0, justifyContent: 'center', position: 'absolute', right: 0, top: 0, width: 76 },
  deleteButton: { alignItems: 'center', height: '100%', justifyContent: 'center', width: '100%' },
  notificationCard: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 15, borderWidth: 1 },
  unreadCard: { borderColor: colors.primaryLight, backgroundColor: '#FAFFFB' },
  notificationContent: { alignItems: 'center', flexDirection: 'row', minHeight: 88, padding: 14 },
  notificationIcon: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  notificationText: { flex: 1, marginLeft: 11 },
  notificationTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  notificationMessage: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  notificationDate: { color: colors.textLight, fontSize: 10, marginTop: 5 },
  unreadDot: { backgroundColor: colors.primary, borderRadius: 5, height: 9, marginLeft: 8, width: 9 },
});

export default NotificationsScreen;
