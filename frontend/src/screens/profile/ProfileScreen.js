import React, { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import client from '../../api/client';
import { colors } from '../../theme/colors';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateUserData } = useAuth();
  const { addresses, favourites } = useCustomer();
  const [profile, setProfile] = useState(user);
  const [loading, setLoading] = useState(false);
  const [profileEditorVisible, setProfileEditorVisible] = useState(false);
  const [passwordEditorVisible, setPasswordEditorVisible] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Hide parent BottomTabs when a bottom sheet modal is open
  useEffect(() => {
    const isSheetOpen = profileEditorVisible || passwordEditorVisible;
    navigation.setOptions({
      tabBarStyle: isSheetOpen ? { display: 'none' } : undefined,
    });
    return () => {
      navigation.setOptions({ tabBarStyle: undefined });
    };
  }, [profileEditorVisible, passwordEditorVisible, navigation]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await client.get('/profile');
      const loadedProfile = response.data?.data?.user;
      if (loadedProfile) {
        setProfile(loadedProfile);
        setName(loadedProfile.name || '');
        setPhone(loadedProfile.phone || '');
      }
    } catch (error) {
      Alert.alert('Unable to load profile', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    loadProfile();
  }, [loadProfile]));

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    try {
      setSaving(true);
      const response = await client.put('/profile', { name: name.trim(), phone: phone.trim() });
      const updated = response.data?.data;
      setProfile((current) => ({ ...current, ...updated }));
      updateUserData(updated);
      setProfileEditorVisible(false);
    } catch (error) {
      Alert.alert('Unable to update profile', error.message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Required fields', 'Enter your current password and confirm the new password.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Password too short', 'Use at least 6 characters for your new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Confirm the new password and try again.');
      return;
    }
    try {
      setSaving(true);
      await client.put('/profile/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordEditorVisible(false);
      Alert.alert('Password updated', 'Your password has been changed.');
    } catch (error) {
      Alert.alert('Could not change password', error.message);
    } finally {
      setSaving(false);
    }
  };

  const currentUser = profile || user;
  const initials = (currentUser?.name || 'FM')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={loadProfile} accessibilityLabel="Refresh profile">
          <Ionicons name="refresh-outline" size={21} color={colors.text} />
        </TouchableOpacity>
      </View>
      {loading && !currentUser ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.userCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials || 'FM'}</Text></View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{currentUser?.name || 'FreshMart customer'}</Text>
              <Text style={styles.userDetail}>{currentUser?.email || ''}</Text>
              {currentUser?.phone ? <Text style={styles.userDetail}>{currentUser.phone}</Text> : null}
            </View>
            <TouchableOpacity
              style={styles.editIcon}
              onPress={() => setProfileEditorVisible(true)}
              accessibilityLabel="Edit profile"
            >
              <Ionicons name="create-outline" size={19} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsCard}>
            <Stat value={currentUser?.stats?.ordersCount || 0} label="Orders" />
            <View style={styles.statDivider} />
            <Stat value={favourites.length} label="Saved" />
            <View style={styles.statDivider} />
            <Stat value={`Rs. ${(currentUser?.stats?.totalSpent || 0).toLocaleString()}`} label="Spent" />
          </View>

          <View style={styles.menuCard}>
            <MenuItem icon="receipt-outline" title="My Orders" subtitle="View order history" onPress={() => navigation.navigate('Orders')} />
            <MenuItem icon="heart-outline" title="Favourites" subtitle={`${favourites.length} saved products`} onPress={() => navigation.navigate('Favourites')} />
            <MenuItem icon="location-outline" title="Saved Addresses" subtitle={`${addresses.length} saved`} onPress={() => navigation.navigate('Addresses')} />
            <MenuItem icon="person-outline" title="Edit Profile" onPress={() => setProfileEditorVisible(true)} />
            <MenuItem icon="lock-closed-outline" title="Change Password" onPress={() => setPasswordEditorVisible(true)} />
            <MenuItem
              icon="notifications-outline"
              title="Notifications"
              iconColor="#DB2777"
              iconBackground="#FCE7F3"
              onPress={() => Alert.alert('Notifications', 'Push notifications are enabled.')}
            />
            <MenuItem
              icon="settings-outline"
              title="Settings"
              iconColor="#4B5563"
              iconBackground="#F3F4F6"
              onPress={() => Alert.alert('Settings', 'FreshMart Mobile v1.0.0 (HCI Assignment).')}
            />
            <MenuItem
              icon="bicycle-outline"
              title="Delivery Partner Portal"
              subtitle="Manage and track rider deliveries"
              iconColor="#166534"
              iconBackground="#DCFCE7"
              onPress={() => navigation.navigate('DeliveryTabs')}
              last
            />
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => Alert.alert('Log out', 'Are you sure you want to log out?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Log out', style: 'destructive', onPress: logout },
            ])}
          >
            <Ionicons name="log-out-outline" size={19} color={colors.danger} />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal
        visible={profileEditorVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setProfileEditorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={() => setProfileEditorVisible(false)}
          />
          <View style={styles.modalCard}>
            <ModalHeader title="Edit profile" onClose={() => setProfileEditorVisible(false)} />
            <Text style={styles.inputLabel}>Full name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.textLight} />
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Phone number" placeholderTextColor={colors.textLight} keyboardType="phone-pad" />
            <AppButton title="Save profile" onPress={saveProfile} loading={saving} />
          </View>
        </View>
      </Modal>

      <Modal
        visible={passwordEditorVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setPasswordEditorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={() => setPasswordEditorVisible(false)}
          />
          <View style={styles.modalCard}>
            <ModalHeader title="Change password" onClose={() => setPasswordEditorVisible(false)} />
            <TextInput style={styles.input} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current password" placeholderTextColor={colors.textLight} secureTextEntry />
            <TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} placeholder="New password (6+ characters)" placeholderTextColor={colors.textLight} secureTextEntry />
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirm new password" placeholderTextColor={colors.textLight} secureTextEntry />
            <AppButton title="Update password" onPress={changePassword} loading={saving} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const Stat = ({ value, label }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({
  icon,
  title,
  subtitle,
  onPress,
  last,
  iconColor = colors.primary,
  iconBackground = colors.primaryLight,
}) => (
  <TouchableOpacity style={[styles.menuItem, !last && styles.menuItemBorder]} onPress={onPress}>
    <View style={[styles.menuIcon, { backgroundColor: iconBackground }]}>
      <Ionicons name={icon} size={19} color={iconColor} />
    </View>
    <View style={styles.menuInfo}>
      <Text style={styles.menuTitle}>{title}</Text>
      {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
  </TouchableOpacity>
);

const ModalHeader = ({ title, onClose }) => (
  <View style={styles.modalHeader}>
    <Text style={styles.modalTitle}>{title}</Text>
    <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
      <Ionicons name="close" size={23} color={colors.text} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center', backgroundColor: colors.card, borderBottomColor: colors.borderLight, borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 14 },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  content: { padding: 16, paddingBottom: 30 },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  userCard: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: 17, borderWidth: 1, flexDirection: 'row', padding: 16 },
  avatar: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 29, height: 58, justifyContent: 'center', width: 58 },
  avatarText: { color: colors.textInverse, fontSize: 19, fontWeight: '800' },
  userInfo: { flex: 1, marginLeft: 13 },
  userName: { color: colors.text, fontSize: 16, fontWeight: '800' },
  userDetail: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  editIcon: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
  statsCard: { alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderRadius: 15, borderWidth: 1, flexDirection: 'row', marginTop: 13, paddingVertical: 15 },
  stat: { alignItems: 'center', flex: 1, paddingHorizontal: 4 },
  statValue: { color: colors.text, fontSize: 15, fontWeight: '800' },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 4 },
  statDivider: { backgroundColor: colors.borderLight, height: 30, width: 1 },
  menuCard: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 15, borderWidth: 1, marginTop: 17, paddingHorizontal: 14 },
  menuItem: { alignItems: 'center', flexDirection: 'row', minHeight: 62, paddingVertical: 10 },
  menuItemBorder: { borderBottomColor: colors.borderLight, borderBottomWidth: 1 },
  menuIcon: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 11, height: 36, justifyContent: 'center', width: 36 },
  menuInfo: { flex: 1, marginLeft: 11 },
  menuTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  menuSubtitle: { color: colors.textSecondary, fontSize: 11, marginTop: 3 },
  logoutButton: { alignItems: 'center', backgroundColor: colors.dangerLight, borderRadius: 13, flexDirection: 'row', height: 48, justifyContent: 'center', marginTop: 18 },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: '800', marginLeft: 8 },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.5)', flex: 1, justifyContent: 'flex-end' },
  backdropTouchable: { ...StyleSheet.absoluteFillObject },
  modalCard: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 38,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: '#FAFBFB', borderColor: colors.border, borderRadius: 11, borderWidth: 1, color: colors.text, fontSize: 14, height: 46, marginBottom: 13, paddingHorizontal: 13 },
});

export default ProfileScreen;
