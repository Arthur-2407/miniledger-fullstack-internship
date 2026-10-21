import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    friendName: string;
    amount: number;
    dueDate: string;
    receipt?: { uri: string; mimeType: string; fileName: string };
  }) => Promise<void>;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({ visible, onClose, onSubmit }) => {
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [receipt, setReceipt] = useState<{ uri: string; mimeType: string; fileName: string } | null>(null);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to set preset due date
  const setPresetDate = (daysAhead: number) => {
    const target = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setDueDate(`${yyyy}-${mm}-${dd}`);
    setErrors((prev) => ({ ...prev, dueDate: '' }));
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false && Platform.OS !== 'web') {
        Alert.alert('Permission Required', 'You need to allow gallery access to attach a receipt photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setReceipt({
          uri: asset.uri,
          mimeType: asset.mimeType || 'image/jpeg',
          fileName: asset.fileName || `receipt_${Date.now()}.jpg`,
        });
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!friendName.trim()) {
      newErrors.friendName = "Please enter your friend's name";
    }

    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = 'Please enter a valid positive amount';
    } else {
      const parts = amount.split('.');
      if (parts[1] && parts[1].length > 2) {
        newErrors.amount = 'Amount cannot exceed 2 decimal places';
      }
    }

    if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      newErrors.dueDate = 'Due date must follow YYYY-MM-DD format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        friendName: friendName.trim(),
        amount: parseFloat(amount),
        dueDate: dueDate.trim(),
        receipt: receipt || undefined,
      });
      handleClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record loan';
      Alert.alert('Submission Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFriendName('');
    setAmount('');
    setDueDate('');
    setReceipt(null);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Add Loan Entry</Text>
              <Text style={styles.modalSubtitle}>Track money you lent to a friend</Text>
            </View>
            <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Friend Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Friend's Name *</Text>
              <TextInput
                style={[styles.input, errors.friendName ? styles.inputError : null]}
                placeholder="e.g. Rahul Sharma"
                placeholderTextColor={colors.textMuted}
                value={friendName}
                onChangeText={(val) => {
                  setFriendName(val);
                  if (errors.friendName) setErrors((prev) => ({ ...prev, friendName: '' }));
                }}
                editable={!isSubmitting}
              />
              {errors.friendName ? <Text style={styles.errorText}>{errors.friendName}</Text> : null}
            </View>

            {/* Amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Loan Amount (₹) *</Text>
              <TextInput
                style={[styles.input, errors.amount ? styles.inputError : null]}
                placeholder="e.g. 1500"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={(val) => {
                  setAmount(val);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                }}
                keyboardType="decimal-pad"
                editable={!isSubmitting}
              />
              {errors.amount ? <Text style={styles.errorText}>{errors.amount}</Text> : null}
            </View>

            {/* Due Date */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD) *</Text>
              <TextInput
                style={[styles.input, errors.dueDate ? styles.inputError : null]}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={dueDate}
                onChangeText={(val) => {
                  setDueDate(val);
                  if (errors.dueDate) setErrors((prev) => ({ ...prev, dueDate: '' }));
                }}
                editable={!isSubmitting}
              />
              {errors.dueDate ? <Text style={styles.errorText}>{errors.dueDate}</Text> : null}

              {/* Quick Preset Buttons */}
              <View style={styles.presetsRow}>
                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(7)}>
                  <Text style={styles.presetChipText}>+7 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(14)}>
                  <Text style={styles.presetChipText}>+14 Days</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.presetChip} onPress={() => setPresetDate(30)}>
                  <Text style={styles.presetChipText}>+1 Month</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Receipt Upload (Bonus) */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Receipt Photo (Optional Bonus)</Text>
              {receipt ? (
                <View style={styles.receiptPreviewContainer}>
                  <Image source={{ uri: receipt.uri }} style={styles.receiptThumbnail} />
                  <View style={styles.receiptMeta}>
                    <Text style={styles.receiptFileName} numberOfLines={1}>
                      {receipt.fileName}
                    </Text>
                    <TouchableOpacity onPress={() => setReceipt(null)}>
                      <Text style={styles.removeReceiptText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadButton} onPress={pickImage} disabled={isSubmitting}>
                  <Text style={styles.uploadButtonIcon}>📷</Text>
                  <Text style={styles.uploadButtonText}>Select Receipt Photo (PNG / JPG)</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>Save Loan</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    color: colors.textSecondary,
    fontSize: 20,
    fontWeight: '600',
    padding: 4,
  },
  formScroll: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  presetChip: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  presetChipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  uploadButtonIcon: {
    fontSize: 18,
  },
  uploadButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  receiptPreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 12,
  },
  receiptThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  receiptMeta: {
    flex: 1,
  },
  receiptFileName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  removeReceiptText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
