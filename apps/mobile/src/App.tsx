import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from './theme/colors';
import { LoginScreen } from './screens/LoginScreen';
import { OtpScreen } from './screens/OtpScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { authService, AuthUser } from './services/authService';
import { registerUnauthorizedHandler } from './services/apiClient';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [otpPhone, setOtpPhone] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Restore saved session on startup
  useEffect(() => {
    const initSession = async () => {
      try {
        const session = await authService.getSavedSession();
        if (session) {
          setCurrentUser(session.user);
        }
      } catch (err) {
        console.warn('Failed to restore session:', err);
      } finally {
        setIsInitializing(false);
      }
    };

    // Register callback if server returns 401 Unauthorized
    registerUnauthorizedHandler(() => {
      setCurrentUser(null);
      setOtpPhone(null);
    });

    initSession();
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setOtpPhone(null);
  };

  if (isInitializing) {
    return (
      <View style={styles.splashContainer}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" backgroundColor={colors.surface} />
      {currentUser ? (
        <DashboardScreen user={currentUser} onLogout={handleLogout} />
      ) : otpPhone ? (
        <OtpScreen
          phone={otpPhone}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setOtpPhone(null);
          }}
          onBackToPhone={() => setOtpPhone(null)}
        />
      ) : (
        <LoginScreen onOtpRequested={(phone) => setOtpPhone(phone)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
