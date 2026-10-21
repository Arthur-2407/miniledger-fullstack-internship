import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatINR } from '../utils/currency';
import { Summary } from '../services/summaryService';

interface SummaryCardProps {
  summary: Summary | null;
  isLoading?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ summary, isLoading }) => {
  const totalLent = summary?.totalLent ?? 0;
  const totalRepaid = summary?.totalRepaid ?? 0;
  const overdueAmount = summary?.overdueAmount ?? 0;
  const hasOverdue = overdueAmount > 0;

  return (
    <View style={[styles.card, hasOverdue && styles.cardOverdue]}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>FINANCIAL SUMMARY</Text>
        {hasOverdue ? (
          <View style={styles.overdueBadge}>
            <Text style={styles.overdueBadgeText}>⚠️ OVERDUE LOANS</Text>
          </View>
        ) : (
          <View style={styles.healthyBadge}>
            <Text style={styles.healthyBadgeText}>✓ UP TO DATE</Text>
          </View>
        )}
      </View>

      <View style={styles.statsGrid}>
        {/* Total Lent */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Lent</Text>
          <Text style={styles.statValue}>
            {isLoading ? '...' : formatINR(totalLent)}
          </Text>
          <Text style={styles.statSubtext}>Across all friends</Text>
        </View>

        {/* Total Repaid */}
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Total Repaid</Text>
          <Text style={[styles.statValue, styles.statValueRepaid]}>
            {isLoading ? '...' : formatINR(totalRepaid)}
          </Text>
          <Text style={styles.statSubtext}>Received back</Text>
        </View>
      </View>

      {/* Overdue Banner */}
      <View style={[styles.overdueContainer, hasOverdue ? styles.overdueActive : styles.overdueClear]}>
        <View style={styles.overdueInfo}>
          <Text style={[styles.overdueLabel, hasOverdue && styles.overdueLabelActive]}>
            Overdue Amount
          </Text>
          <Text style={styles.overdueNote}>
            {hasOverdue ? 'Due date passed & unpaid' : 'Zero overdue payments'}
          </Text>
        </View>
        <Text style={[styles.overdueValue, hasOverdue && styles.overdueValueActive]}>
          {isLoading ? '...' : formatINR(overdueAmount)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardOverdue: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  overdueBadge: {
    backgroundColor: colors.dangerMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  overdueBadgeText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  healthyBadge: {
    backgroundColor: colors.successMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  healthyBadgeText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 2,
  },
  statValueRepaid: {
    color: colors.success,
  },
  statSubtext: {
    color: colors.textMuted,
    fontSize: 11,
  },
  overdueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  overdueClear: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.surfaceBorder,
  },
  overdueActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  overdueInfo: {
    flex: 1,
  },
  overdueLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  overdueLabelActive: {
    color: colors.danger,
  },
  overdueNote: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  overdueValue: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  overdueValueActive: {
    color: colors.danger,
  },
});
