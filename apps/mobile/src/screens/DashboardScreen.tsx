import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { colors } from '../theme/colors';
import { Header } from '../components/Header';
import { SummaryCard } from '../components/SummaryCard';
import { LoanCard } from '../components/LoanCard';
import { AddLoanModal } from '../components/AddLoanModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { EmptyState } from '../components/EmptyState';
import { ErrorBanner } from '../components/ErrorBanner';
import { loansService, Loan } from '../services/loansService';
import { summaryService, Summary } from '../services/summaryService';
import { AuthUser } from '../services/authService';

interface DashboardScreenProps {
  user: AuthUser;
  onLogout: () => void;
}

type FilterTab = 'ALL' | 'OUTSTANDING' | 'OVERDUE' | 'REPAID';

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ user, onLogout }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReceiptLoan, setSelectedReceiptLoan] = useState<Loan | null>(null);
  const [repayingLoanId, setRepayingLoanId] = useState<string | null>(null);

  // Fetch loans and summary
  const loadData = useCallback(async (showFullLoader: boolean = false) => {
    if (showFullLoader) setIsLoading(true);
    setErrorMessage('');

    try {
      const [fetchedLoans, fetchedSummary] = await Promise.all([
        loansService.getLoans(),
        summaryService.getSummary(),
      ]);
      setLoans(fetchedLoans);
      setSummary(fetchedSummary);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Unable to load ledger records. Please ensure API server is running.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(false);
  };

  // Repay action
  const handleRepay = async (loanId: string) => {
    if (repayingLoanId) return;

    setRepayingLoanId(loanId);
    try {
      await loansService.markAsRepaid(loanId);
      // Immediately refresh loans and summary from real API
      await loadData(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ||
        'Failed to mark loan as repaid.';
      setErrorMessage(msg);
    } finally {
      setRepayingLoanId(null);
    }
  };

  // Add Loan submission
  const handleAddLoan = async (data: {
    friendName: string;
    amount: number;
    dueDate: string;
    receipt?: { uri: string; mimeType: string; fileName: string };
  }) => {
    // 1. Create loan record
    const newLoan = await loansService.createLoan({
      friendName: data.friendName,
      amount: data.amount,
      dueDate: data.dueDate,
    });

    // 2. Upload receipt if attached (bonus)
    if (data.receipt) {
      try {
        await loansService.uploadReceipt(
          newLoan.id,
          data.receipt.uri,
          data.receipt.mimeType,
          data.receipt.fileName
        );
      } catch (err) {
        console.warn('Receipt upload failed, loan created:', err);
      }
    }

    // 3. Refresh data from real API
    await loadData(false);
  };

  // Filtered loans list
  const filteredLoans = loans.filter((loan) => {
    if (activeTab === 'OUTSTANDING') return !loan.isRepaid;
    if (activeTab === 'OVERDUE') return loan.isOverdue && !loan.isRepaid;
    if (activeTab === 'REPAID') return loan.isRepaid;
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <Header
          phone={user.phone}
          onLogout={onLogout}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Global Error Banner */}
        {errorMessage ? (
          <ErrorBanner
            message={errorMessage}
            onRetry={() => loadData(true)}
            onDismiss={() => setErrorMessage('')}
          />
        ) : null}

        {/* Main Content List */}
        <FlatList
          data={filteredLoans}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Financial Summary Card */}
              <SummaryCard summary={summary} isLoading={isLoading && !isRefreshing} />

              {/* Loans Section Header & Filters */}
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Tracked Loans</Text>
                  <Text style={styles.sectionSubtitle}>
                    {loans.length} total • {filteredLoans.length} shown
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.addLoanHeaderBtn}
                  onPress={() => setIsAddModalOpen(true)}
                >
                  <Text style={styles.addLoanHeaderBtnText}>+ Add Loan</Text>
                </TouchableOpacity>
              </View>

              {/* Filter Tabs */}
              <View style={styles.tabsRow}>
                {(['ALL', 'OUTSTANDING', 'OVERDUE', 'REPAID'] as FilterTab[]).map((tab) => {
                  const isActive = activeTab === tab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      style={[styles.tabChip, isActive && styles.tabChipActive]}
                      onPress={() => setActiveTab(tab)}
                    >
                      <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                        {tab === 'ALL'
                          ? 'All'
                          : tab === 'OUTSTANDING'
                          ? 'Active'
                          : tab === 'OVERDUE'
                          ? 'Overdue'
                          : 'Repaid'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          }
          renderItem={({ item }) => (
            <LoanCard
              loan={item}
              onRepay={handleRepay}
              onViewReceipt={(l) => setSelectedReceiptLoan(l)}
              isRepaying={repayingLoanId === item.id}
            />
          )}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loaderText}>Loading MiniLedger records...</Text>
              </View>
            ) : (
              <EmptyState onAddLoan={() => setIsAddModalOpen(true)} />
            )
          }
          contentContainerStyle={styles.listContent}
        />

        {/* Floating Action Button (FAB) */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setIsAddModalOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        {/* Add Loan Modal */}
        <AddLoanModal
          visible={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddLoan}
        />

        {/* Receipt View Modal */}
        <ReceiptModal
          loan={selectedReceiptLoan}
          visible={Boolean(selectedReceiptLoan)}
          onClose={() => setSelectedReceiptLoan(null)}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  listContent: {
    paddingBottom: 90,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  addLoanHeaderBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addLoanHeaderBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 14,
  },
  tabChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tabChipActive: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  tabChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  loaderText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  fabIcon: {
    fontSize: 32,
    color: '#ffffff',
    lineHeight: 34,
    fontWeight: '300',
  },
});
