import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

interface HeaderProps {
  phone?: string;
  onLogout: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ phone, onLogout, onRefresh, isRefreshing }) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>₹</Text>
        </View>
        <View>
          <Text style={styles.title}>MiniLedger</Text>
          <Text style={styles.subtitle}>Money Lent to Friends</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {onRefresh && (
          <TouchableOpacity
            style={[styles.refreshButton, isRefreshing && styles.buttonDisabled]}
            onPress={onRefresh}
            disabled={isRefreshing}
          >
            <Text style={styles.refreshIcon}>{isRefreshing ? '⌛' : '🔄'}</Text>
          </TouchableOpacity>
        )}

        {phone && (
          <View style={styles.phoneBadge}>
            <Text style={styles.phoneText}>{phone}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  phoneText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  refreshIcon: {
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  logoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600',
  },
});
