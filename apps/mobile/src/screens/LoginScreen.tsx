import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors } from '../theme/colors';
import { authService } from '../services/authService';

interface LoginScreenProps {
  onOtpRequested: (phone: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onOtpRequested }) => {
  const [phone, setPhone] = useState('+919876543210');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validatePhone = (num: string): boolean => {
    const cleaned = num.replace(/[\s\-()]/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleRequestOtp = async () => {
    setErrorMessage('');

    if (!phone.trim()) {
      setErrorMessage('Please enter your mobile phone number.');
      return;
    }

    if (!validatePhone(phone.trim())) {
      setErrorMessage('Please enter a valid 10-digit mobile number or full E.164 number.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.requestOtp(phone.trim());
      onOtpRequested(phone.trim());
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Failed to request verification code. Check network or server.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Logo Badge */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoSymbol}>₹</Text>
          </View>

          <Text style={styles.title}>MiniLedger</Text>
          <Text style={styles.tagline}>Money Lent to Friends Tracker</Text>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Log In or Sign Up</Text>
            <Text style={styles.cardDescription}>
              Enter your mobile number to receive a 6-digit one-time password (OTP).
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Mobile Phone Number</Text>
              <TextInput
                style={[styles.phoneInput, errorMessage ? styles.phoneInputError : null]}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="phone-pad"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <Text style={styles.hintText}>Example: +919876543210 or 9876543210</Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleRequestOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Send Verification Code →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Dev helper callout */}
          <View style={styles.devNoticeBox}>
            <Text style={styles.devNoticeTitle}>🛠️ Development Environment Notice</Text>
            <Text style={styles.devNoticeBody}>
              MiniLedger uses terminal-based mock OTPs. The 6-digit verification code will be printed in your API server terminal logs once you tap the button above.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  logoSymbol: {
    fontSize: 34,
    fontWeight: '800',
    color: '#ffffff',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 28,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  phoneInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  phoneInputError: {
    borderColor: colors.danger,
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  devNoticeBox: {
    marginTop: 24,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    width: '100%',
  },
  devNoticeTitle: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  devNoticeBody: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
