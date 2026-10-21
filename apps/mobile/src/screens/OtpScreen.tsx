import React, { useState, useEffect } from 'react';
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
import { authService, AuthUser } from '../services/authService';

interface OtpScreenProps {
  phone: string;
  onLoginSuccess: (user: AuthUser) => void;
  onBackToPhone: () => void;
}

export const OtpScreen: React.FC<OtpScreenProps> = ({
  phone,
  onLoginSuccess,
  onBackToPhone,
}) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleVerify = async () => {
    setErrorMessage('');

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setErrorMessage('Please enter the complete 6-digit code.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.verifyOtp(phone, otp);
      onLoginSuccess(response.user);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        (err instanceof Error ? err.message : 'Verification failed. Please check the OTP and try again.');
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setErrorMessage('');
    setIsResending(true);
    try {
      await authService.requestOtp(phone);
      setResendCooldown(30);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Failed to resend OTP. Please try again shortly.';
      setErrorMessage(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          {/* Back button */}
          <TouchableOpacity style={styles.backButton} onPress={onBackToPhone} disabled={isLoading}>
            <Text style={styles.backButtonText}>← Change Phone Number</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Enter Verification Code</Text>
            <Text style={styles.cardDescription}>
              We sent a 6-digit mock code for <Text style={styles.phoneHighlight}>{phone}</Text>.
            </Text>

            {/* OTP Terminal helper callout */}
            <View style={styles.terminalAlertBox}>
              <Text style={styles.terminalAlertTitle}>💻 Check API Server Terminal</Text>
              <Text style={styles.terminalAlertBody}>
                Per assignment requirements, the OTP is printed directly in your API terminal logs:
              </Text>
              <Text style={styles.terminalSnippet}>🔑 [DEV-OTP] Verification code for {phone}: ...</Text>
            </View>

            {/* OTP Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>6-Digit Code</Text>
              <TextInput
                style={[styles.otpInput, errorMessage ? styles.otpInputError : null]}
                placeholder="123456"
                placeholderTextColor={colors.textMuted}
                value={otp}
                onChangeText={(val) => {
                  // Only allow digits up to 6 characters
                  const cleaned = val.replace(/\D/g, '').slice(0, 6);
                  setOtp(cleaned);
                  if (errorMessage) setErrorMessage('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                editable={!isLoading}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.button, (isLoading || otp.length !== 6) && styles.buttonDisabled]}
              onPress={handleVerify}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Verify & Continue →</Text>
              )}
            </TouchableOpacity>

            {/* Resend Link */}
            <View style={styles.resendRow}>
              {resendCooldown > 0 ? (
                <Text style={styles.cooldownText}>Resend code in {resendCooldown}s</Text>
              ) : (
                <TouchableOpacity onPress={handleResend} disabled={isResending}>
                  <Text style={styles.resendText}>
                    {isResending ? 'Sending...' : 'Resend Verification Code'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  phoneHighlight: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  terminalAlertBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    marginBottom: 20,
  },
  terminalAlertTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  terminalAlertBody: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 6,
  },
  terminalSnippet: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: colors.textPrimary,
    fontSize: 10,
    backgroundColor: colors.surfaceElevated,
    padding: 6,
    borderRadius: 6,
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
  otpInput: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 10,
    textAlign: 'center',
  },
  otpInputError: {
    borderColor: colors.danger,
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  cooldownText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  resendText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
});
