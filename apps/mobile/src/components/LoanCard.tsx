import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { formatINR } from '../utils/currency';
import { Loan } from '../services/loansService';

interface LoanCardProps {
  loan: Loan;
  onRepay: (loanId: string) => void;
  onViewReceipt: (loan: Loan) => void;
  isRepaying?: boolean;
}

export const LoanCard: React.FC<LoanCardProps> = ({
  loan,
  onRepay,
  onViewReceipt,
  isRepaying = false,
}) => {
  const getBadgeConfig = () => {
    if (loan.isRepaid) {
      return {
        label: '✓ REPAID',
        bg: colors.successMuted,
        border: colors.successBorder,
        text: colors.success,
      };
    }
    if (loan.isOverdue) {
      return {
        label: '⚠️ OVERDUE',
        bg: colors.dangerMuted,
        border: colors.dangerBorder,
        text: colors.danger,
      };
    }
    return {
      label: '⏳ OUTSTANDING',
      bg: colors.primaryMuted,
      border: colors.primary,
      text: colors.primary,
    };
  };

  const badge = getBadgeConfig();

  return (
    <View
      style={[
        styles.card,
        loan.isOverdue && !loan.isRepaid && styles.cardOverdue,
        loan.isRepaid && styles.cardRepaid,
      ]}
    >
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{loan.friendName}</Text>
          <Text style={styles.dueDateText}>
            Due: <Text style={loan.isOverdue && !loan.isRepaid ? styles.dueOverdue : styles.dueNormal}>{loan.dueDate}</Text>
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
          <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Center Amount Row */}
      <View style={styles.amountRow}>
        <Text style={[styles.amountValue, loan.isRepaid && styles.amountRepaid]}>
          {formatINR(loan.amount)}
        </Text>

        {loan.isRepaid && loan.repaidAt && (
          <Text style={styles.repaidDateText}>
            Settled on {loan.repaidAt.split('T')[0]}
          </Text>
        )}
      </View>

      {/* Action Footer */}
      <View style={styles.footerRow}>
        {/* Receipt Button */}
        {loan.hasReceipt ? (
          <TouchableOpacity
            style={styles.receiptButton}
            onPress={() => onViewReceipt(loan)}
          >
            <Text style={styles.receiptButtonText}>📎 View Receipt</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        {/* Mark as Repaid Button */}
        {!loan.isRepaid && (
          <TouchableOpacity
            style={[styles.repayButton, isRepaying && styles.repayButtonDisabled]}
            onPress={() => onRepay(loan.id)}
            disabled={isRepaying}
          >
            {isRepaying ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.repayButtonText}>✓ Mark as Repaid</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cardOverdue: {
    borderColor: colors.danger,
    backgroundColor: '#16121D',
  },
  cardRepaid: {
    opacity: 0.85,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  dueDateText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  dueNormal: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  dueOverdue: {
    color: colors.danger,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    marginBottom: 12,
  },
  amountValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  amountRepaid: {
    color: colors.textSecondary,
    textDecorationLine: 'none',
  },
  repaidDateText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  receiptButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  repayButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  repayButtonDisabled: {
    opacity: 0.6,
  },
  repayButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});
