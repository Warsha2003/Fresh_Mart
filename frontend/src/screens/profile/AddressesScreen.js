import React, { useState } from 'react';
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
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useCustomer } from '../../context/CustomerContext';
import { colors } from '../../theme/colors';

const emptyAddress = {
  label: 'Home',
  addressLine: '',
  city: '',
  postalCode: '',
  isDefault: false,
  location: null,
};

const hasCoordinates = (location) =>
  Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);

const AddressesScreen = ({ navigation }) => {
  const { addresses, addAddress, updateAddress, deleteAddress } = useCustomer();
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const openEditor = (address) => {
    if (address) {
      setEditingId(address._id);
      setForm({
        label: address.label || 'Home',
        addressLine: address.addressLine || '',
        city: address.city || '',
        postalCode: address.postalCode || '',
        isDefault: Boolean(address.isDefault),
        location: hasCoordinates(address.location)
          ? { latitude: address.location.latitude, longitude: address.location.longitude }
          : null,
      });
    } else {
      setEditingId(null);
      setForm({ ...emptyAddress, isDefault: addresses.length === 0 });
    }
    setEditorVisible(true);
  };

  const useCurrentLocation = async () => {
    try {
      setLocating(true);
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Location permission required', 'Allow location access to attach your current coordinates to this address.');
        return;
      }
      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const location = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };
      setForm((current) => ({ ...current, location }));

      const places = await Location.reverseGeocodeAsync(location);
      const place = places[0];
      if (place) {
        const addressLine = [place.name, place.street].filter(Boolean).join(' ');
        const city = place.city || place.district || place.subregion || '';
        setForm((current) => ({
          ...current,
          addressLine: current.addressLine || addressLine,
          city: current.city || city,
          postalCode: current.postalCode || place.postalCode || '',
          location,
        }));
      }
      Alert.alert('Location saved', 'Your current coordinates have been attached to this address.');
    } catch (error) {
      Alert.alert('Could not get location', error.message || 'Please try again.');
    } finally {
      setLocating(false);
    }
  };

  const saveAddress = async () => {
    if (!form.addressLine.trim() || !form.city.trim()) {
      Alert.alert('Address required', 'Enter a street address and city, or use your current location.');
      return;
    }
    try {
      setSaving(true);
      const payload = {
        label: form.label.trim() || 'Home',
        addressLine: form.addressLine.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        isDefault: form.isDefault || addresses.length === 0,
        location: form.location,
      };
      if (editingId) {
        await updateAddress(editingId, payload);
      } else {
        await addAddress(payload);
      }
      setEditorVisible(false);
    } catch (error) {
      Alert.alert('Could not save address', error.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (address) => {
    Alert.alert('Delete address', `Remove ${address.label || 'this address'}?`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAddress(address._id);
          } catch (error) {
            Alert.alert('Could not delete address', error.message);
          }
        },
      },
    ]);
  };

  const setDefault = async (address) => {
    try {
      await updateAddress(address._id, { ...address, isDefault: true });
    } catch (error) {
      Alert.alert('Could not update default address', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Saved Addresses" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>Choose where your FreshMart orders should arrive.</Text>
        {addresses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={36} color={colors.primary} />
            <Text style={styles.emptyText}>No saved addresses</Text>
            <Text style={styles.helper}>Add an address to make delivery checkout faster.</Text>
          </View>
        ) : (
          addresses.map((address) => (
            <View key={address._id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={styles.addressIcon}>
                  <Ionicons name={address.label?.toLowerCase() === 'work' ? 'briefcase-outline' : 'home-outline'} size={20} color={colors.primary} />
                </View>
                <View style={styles.addressInfo}>
                  <View style={styles.labelRow}>
                    <Text style={styles.addressLabel}>{address.label}</Text>
                    {address.isDefault && <Text style={styles.defaultPill}>DEFAULT</Text>}
                  </View>
                  <Text style={styles.addressLine}>{address.addressLine}, {address.city}</Text>
                  {address.postalCode ? <Text style={styles.postalCode}>{address.postalCode}</Text> : null}
                  {hasCoordinates(address.location) ? (
                    <Text style={styles.locationText}>
                      GPS {address.location.latitude.toFixed(4)}, {address.location.longitude.toFixed(4)}
                    </Text>
                  ) : (
                    <Text style={styles.locationMissing}>No GPS location attached</Text>
                  )}
                </View>
              </View>
              <View style={styles.actions}>
                {!address.isDefault && (
                  <TouchableOpacity style={styles.actionButton} onPress={() => setDefault(address)}>
                    <Text style={styles.actionText}>Set default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.actionButton} onPress={() => openEditor(address)}>
                  <Ionicons name="create-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton} onPress={() => confirmDelete(address)}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <AppButton title="Add new address" onPress={() => openEditor()} icon={<Ionicons name="add" size={20} color={colors.textInverse} />} />
      </ScrollView>

      <Modal visible={editorVisible} animationType="slide" transparent onRequestClose={() => setEditorVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit address' : 'Add address'}</Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)} accessibilityLabel="Close address form">
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Label</Text>
              <TextInput style={styles.input} value={form.label} onChangeText={(value) => setField('label', value)} placeholder="Home, Work..." placeholderTextColor={colors.textLight} />
              <Text style={styles.label}>Street address</Text>
              <TextInput style={styles.input} value={form.addressLine} onChangeText={(value) => setField('addressLine', value)} placeholder="Street and building" placeholderTextColor={colors.textLight} />
              <Text style={styles.label}>City</Text>
              <TextInput style={styles.input} value={form.city} onChangeText={(value) => setField('city', value)} placeholder="City" placeholderTextColor={colors.textLight} />
              <Text style={styles.label}>Postal code (optional)</Text>
              <TextInput style={styles.input} value={form.postalCode} onChangeText={(value) => setField('postalCode', value)} placeholder="Postal code" placeholderTextColor={colors.textLight} keyboardType="numeric" />
              <TouchableOpacity style={styles.locationButton} onPress={useCurrentLocation} disabled={locating}>
                {locating ? <ActivityIndicator color={colors.primary} /> : <Ionicons name="navigate-outline" size={18} color={colors.primary} />}
                <Text style={styles.locationButtonText}>{locating ? 'Getting location...' : form.location ? 'Refresh current GPS location' : 'Use current GPS location'}</Text>
              </TouchableOpacity>
              {form.location ? (
                <Text style={styles.coordinates}>
                  Coordinates attached: {form.location.latitude.toFixed(5)}, {form.location.longitude.toFixed(5)}
                </Text>
              ) : null}
              <TouchableOpacity style={styles.defaultToggle} onPress={() => setField('isDefault', !form.isDefault)}>
                <Ionicons name={form.isDefault ? 'checkbox' : 'square-outline'} size={21} color={colors.primary} />
                <Text style={styles.defaultToggleText}>Set as my default delivery address</Text>
              </TouchableOpacity>
              <AppButton title={editingId ? 'Save changes' : 'Save address'} onPress={saveAddress} loading={saving} style={styles.saveButton} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: colors.background, flex: 1, paddingTop: 42 },
  content: { padding: 18, paddingBottom: 30 },
  intro: { color: colors.textSecondary, fontSize: 13, marginBottom: 14 },
  empty: { alignItems: 'center', backgroundColor: colors.card, borderRadius: 16, marginBottom: 16, padding: 26 },
  emptyText: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 9 },
  helper: { color: colors.textSecondary, fontSize: 12, marginTop: 4, textAlign: 'center' },
  addressCard: { backgroundColor: colors.card, borderColor: colors.border, borderRadius: 16, borderWidth: 1, marginBottom: 12, padding: 15 },
  addressHeader: { flexDirection: 'row' },
  addressIcon: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 },
  addressInfo: { flex: 1, marginLeft: 11 },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  addressLabel: { color: colors.text, fontSize: 15, fontWeight: '800' },
  defaultPill: { backgroundColor: colors.primaryLight, borderRadius: 8, color: colors.primaryDark, fontSize: 9, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 3 },
  addressLine: { color: colors.textSecondary, fontSize: 13, marginTop: 5 },
  postalCode: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  locationText: { color: colors.primary, fontSize: 11, marginTop: 5 },
  locationMissing: { color: colors.textLight, fontSize: 11, marginTop: 5 },
  actions: { borderTopColor: colors.borderLight, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14, paddingTop: 10 },
  actionButton: { alignItems: 'center', flexDirection: 'row', gap: 4, marginLeft: 16, minHeight: 32 },
  actionText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  deleteText: { color: colors.danger },
  modalOverlay: { backgroundColor: 'rgba(0,0,0,0.45)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '90%', padding: 20, paddingBottom: 28 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  label: { color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { backgroundColor: '#FAFBFB', borderColor: colors.border, borderRadius: 11, borderWidth: 1, color: colors.text, fontSize: 14, height: 46, marginBottom: 12, paddingHorizontal: 13 },
  locationButton: { alignItems: 'center', backgroundColor: colors.primaryLight, borderRadius: 12, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 46, marginTop: 3 },
  locationButtonText: { color: colors.primaryDark, fontSize: 13, fontWeight: '700' },
  coordinates: { color: colors.textSecondary, fontSize: 11, marginTop: 7, textAlign: 'center' },
  defaultToggle: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 16, minHeight: 34 },
  defaultToggleText: { color: colors.text, fontSize: 13 },
  saveButton: { marginTop: 12 },
});

export default AddressesScreen;
