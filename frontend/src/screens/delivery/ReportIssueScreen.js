import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../../components/AppButton';
import ScreenHeader from '../../components/ScreenHeader';
import { colors } from '../../theme/colors';

const ReportIssueScreen = ({ navigation, route }) => {
  const { orderNumber = '—' } = route.params || {};
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReport = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing details', 'Add a title and description before submitting.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Alert.alert('Issue reported', `Your report for order ${orderNumber} has been submitted.`);
      navigation.navigate('DeliveryDashboard');
    }, 500);
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Report an Issue"
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.orderCard}>
          <Ionicons name="flag-outline" size={20} color={colors.primary} />
          <View style={styles.orderDetails}>
            <Text style={styles.orderLabel}>Order number</Text>
            <Text style={styles.orderNumber}>{orderNumber}</Text>
          </View>
        </View>

        <Text style={styles.introTitle}>Tell us what happened</Text>
        <Text style={styles.introText}>
          Provide a clear description so the delivery team can review the issue.
        </Text>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Issue title</Text>
          <TextInput
            autoCapitalize="sentences"
            onChangeText={setTitle}
            placeholder="For example: Delivery was delayed"
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={title}
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            multiline
            onChangeText={setDescription}
            placeholder="Describe the issue, what you expected, and what happened."
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.textArea]}
            value={description}
          />
        </View>

        <View style={styles.actionContainer}>
          <AppButton
            title="Submit Report"
            onPress={submitReport}
            loading={submitting}
            icon={<Ionicons name="paper-plane-outline" size={18} color={colors.textInverse} />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
  },
  orderCard: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 28,
    padding: 14,
  },
  orderDetails: {
    marginLeft: 11,
  },
  orderLabel: {
    color: colors.muted,
    fontSize: 11,
  },
  orderNumber: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  introTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  introText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    height: 48,
    paddingHorizontal: 13,
  },
  textArea: {
    height: 120,
    paddingTop: 13,
    textAlignVertical: 'top',
  },
  actionContainer: {
    marginTop: 10,
  },
});

export default ReportIssueScreen;
