/**
 * OwnerManageSlotsScreen
 * Fulfills Dashboard Quick Action requirement:
 * "Manage Slots" adds, edits, and deletes delivery/pickup slots.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import client from '../../api/client';

const OwnerManageSlotsScreen = ({ navigation }) => {
  const [slotType, setSlotType] = useState('delivery'); // 'delivery' | 'pickup'
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add / Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [startTime, setStartTime] = useState('09:00 AM');
  const [endTime, setEndTime] = useState('10:00 AM');
  const [slotDate, setSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxCapacity, setMaxCapacity] = useState('5');
  const [saving, setSaving] = useState(false);

  const fetchSlots = useCallback(async () => {
    try {
      const response = await client.get(`/owner/slots?type=${slotType}`);
      if (response.data?.success) {
        setSlots(response.data.data || []);
      }
    } catch (error) {
      console.warn('[Slots] Failed to load slots:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [slotType]);

  useEffect(() => {
    setLoading(true);
    fetchSlots();
  }, [fetchSlots]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSlots();
  };

  const openAddModal = () => {
    setEditingSlot(null);
    setStartTime('09:00 AM');
    setEndTime('10:00 AM');
    setSlotDate(new Date().toISOString().split('T')[0]);
    setMaxCapacity('5');
    setModalVisible(true);
  };

  const openEditModal = (slot) => {
    setEditingSlot(slot);
    setStartTime(slot.startTime || '09:00 AM');
    setEndTime(slot.endTime || '10:00 AM');
    setSlotDate(slot.date || new Date().toISOString().split('T')[0]);
    setMaxCapacity(String(slot.maxCapacity || '5'));
    setModalVisible(true);
  };

  const handleSaveSlot = async () => {
    if (!startTime.trim() || !endTime.trim() || !slotDate.trim()) {
      Alert.alert('Required Fields', 'Please specify date, start time, and end time.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        type: slotType,
        date: slotDate.trim(),
        startTime: startTime.trim(),
        endTime: endTime.trim(),
        maxCapacity: Number(maxCapacity) || 5,
      };

      if (editingSlot) {
        // UPDATE slot
        await client.put(`/owner/slots/${editingSlot.id || editingSlot._id}`, payload);
        Alert.alert('Slot Updated', 'Slot time and capacity updated.');
      } else {
        // CREATE slot
        await client.post('/owner/slots', payload);
        Alert.alert('Slot Created', 'New fulfillment time slot added.');
      }

      setModalVisible(false);
      fetchSlots();
    } catch (error) {
      Alert.alert('Error', error.message || 'Could not save slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = (slot) => {
    Alert.alert(
      'Delete Slot',
      `Delete slot ${slot.displayLabel} on ${slot.date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await client.delete(`/owner/slots/${slot.id || slot._id}`);
              Alert.alert('Deleted', 'Time slot removed.');
              fetchSlots();
            } catch (err) {
              Alert.alert('Error', err.message || 'Could not delete slot.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Slots</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addIconBtn}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Type Filter Tabs (Delivery vs Pickup) */}
      <View style={styles.typeTabs}>
        <TouchableOpacity
          style={[styles.typeTab, slotType === 'delivery' && styles.typeTabActive]}
          onPress={() => setSlotType('delivery')}
        >
          <Ionicons
            name="bicycle-outline"
            size={16}
            color={slotType === 'delivery' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.typeTabText, slotType === 'delivery' && styles.typeTabTextActive]}>
            Delivery Slots
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeTab, slotType === 'pickup' && styles.typeTabActive]}
          onPress={() => setSlotType('pickup')}
        >
          <Ionicons
            name="storefront-outline"
            size={16}
            color={slotType === 'pickup' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.typeTabText, slotType === 'pickup' && styles.typeTabTextActive]}>
            Pickup Slots
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slots List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        >
          {slots.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No slots found</Text>
              <Text style={styles.emptySubtitle}>Tap the '+' icon above to create your first slot.</Text>
            </View>
          ) : (
            slots.map((slot) => {
              const slotId = slot.id || slot._id;
              const isFull = slot.isFull || slot.bookedCount >= slot.maxCapacity;

              return (
                <View key={slotId} style={styles.slotCard}>
                  <View style={styles.slotMainInfo}>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={16} color={colors.primary} />
                      <Text style={styles.slotTimeText}>{slot.displayLabel}</Text>
                    </View>
                    <Text style={styles.slotDateText}>Date: {slot.date}</Text>
                    <View style={styles.capacityRow}>
                      <Text style={styles.capacityText}>
                        Booked: {slot.bookedCount || 0} / {slot.maxCapacity || 5}
                      </Text>
                      <View style={[styles.statusBadge, isFull ? styles.fullBadge : styles.availableBadge]}>
                        <Text style={[styles.statusText, isFull ? styles.fullText : styles.availableText]}>
                          {isFull ? 'Full' : 'Available'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionsColumn}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(slot)}
                    >
                      <Ionicons name="pencil" size={15} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteSlot(slot)}
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Add / Edit Slot Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingSlot ? 'Edit Time Slot' : 'Create Time Slot'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Date (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2026-10-08"
                value={slotDate}
                onChangeText={setSlotDate}
              />

              <View style={styles.twoCol}>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabel}>Start Time</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="09:00 AM"
                    value={startTime}
                    onChangeText={setStartTime}
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.fieldLabel}>End Time</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="10:00 AM"
                    value={endTime}
                    onChangeText={setEndTime}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Max Capacity (Orders)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 5"
                keyboardType="numeric"
                value={maxCapacity}
                onChangeText={setMaxCapacity}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveSlot}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingSlot ? 'Update Slot' : 'Create Slot'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  typeTabs: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 10,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  typeTabActive: {
    backgroundColor: '#E8F5E9',
    borderColor: colors.primary,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeTabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 18,
    paddingBottom: 30,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  slotCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    alignItems: 'center',
  },
  slotMainInfo: {
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  slotTimeText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  slotDateText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  capacityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  availableBadge: {
    backgroundColor: '#E8F5E9',
  },
  availableText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16803C',
  },
  fullBadge: {
    backgroundColor: '#FEE2E2',
  },
  fullText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  actionsColumn: {
    gap: 8,
    marginLeft: 12,
  },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#F8FAF8',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
  },
  colHalf: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default OwnerManageSlotsScreen;
