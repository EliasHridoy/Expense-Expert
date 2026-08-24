import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDrafts } from '../../../src/features/drafts/hooks/useDrafts';
import { DraftCard } from '../../../src/features/drafts/components/DraftCard';
import { DraftApplicationCard } from '../../../src/features/drafts/components/DraftApplicationCard';
import { CreateDraftModal } from '../../../src/features/drafts/components/CreateDraftModal';
import { RecordPaymentModal } from '../../../src/features/drafts/components/RecordPaymentModal';
import { ExpenseDraft, DraftApplication } from '../../../src/features/drafts/types/draft.types';
import { MonthNavigator } from '../../../src/features/dashboard/components/MonthNavigator';
import { colors } from '../../../src/theme';

export default function DraftsScreen() {
  const router = useRouter();
  const {
    drafts,
    applications,
    isLoading,
    activeMonth,
    setActiveMonth,
    createDraft,
    deleteDraft,
    applyDraftToMonth,
    recordPayment,
  } = useDrafts();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentState, setPaymentState] = useState<{
    application: DraftApplication;
    draft: ExpenseDraft;
  } | null>(null);

  const handleApply = async (draft: ExpenseDraft) => {
    await applyDraftToMonth(draft, activeMonth);
  };

  const handleRecordPaymentClick = (
    application: DraftApplication,
    draft: ExpenseDraft
  ) => {
    setPaymentState({ application, draft });
  };

  const handleConfirmPayment = async (
    application: DraftApplication,
    amount: number,
    draft: ExpenseDraft
  ) => {
    await recordPayment(application, amount, draft);
  };

  return (
    <ScrollView
      testID="drafts-screen"
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>📋 Expense Drafts</Text>
            <Text style={styles.headerSubtitle}>
              Template regular recurring expenses for 1-tap quick add
            </Text>
          </View>

          <TouchableOpacity
            testID="create-draft-btn"
            onPress={() => setShowCreateModal(true)}
            style={styles.primaryActionBtn}
            accessibilityRole="button"
          >
            <Text style={styles.primaryActionBtnText}>+ Create Draft</Text>
          </TouchableOpacity>
        </View>

        {/* Month Navigator */}
        <MonthNavigator
          activeMonth={activeMonth}
          onChangeMonth={setActiveMonth}
        />

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 32 }} />
        ) : (
          <>
            {/* Active Month Applications Section */}
            <View style={styles.section} testID="monthly-applications-section">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Applied Bills & Drafts for {activeMonth}
                </Text>
                <Text style={styles.sectionCount}>({applications.length})</Text>
              </View>

              {applications.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>⚡</Text>
                  <Text style={styles.emptyTitle}>No Drafts Applied for {activeMonth}</Text>
                  <Text style={styles.emptySubtext}>
                    Apply from your draft templates below to quickly log installments with one tap.
                  </Text>
                </View>
              ) : (
                applications.map((app) => {
                  const draft = drafts.find((d) => d.id === app.draftId);
                  if (!draft) return null;
                  return (
                    <DraftApplicationCard
                      key={app.id}
                      application={app}
                      draft={draft}
                      onRecordPayment={handleRecordPaymentClick}
                    />
                  );
                })
              )}
            </View>

            {/* Draft Templates Library Section */}
            <View style={styles.section} testID="draft-templates-section">
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Draft Templates Library</Text>
                <Text style={styles.sectionCount}>({drafts.length})</Text>
              </View>

              {drafts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={styles.emptyTitle}>No Draft Templates Created</Text>
                  <Text style={styles.emptySubtext}>
                    Create recurring expense templates (like Rent, Utilities, Wi-Fi, Subscriptions) for effortless monthly tracking.
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCreateModal(true)}
                    style={styles.emptyBtn}
                  >
                    <Text style={styles.emptyBtnText}>+ Create First Draft</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                drafts.map((draft) => {
                  const isApplied = applications.some((a) => a.draftId === draft.id);
                  return (
                    <DraftCard
                      key={draft.id}
                      draft={draft}
                      isApplied={isApplied}
                      onApply={handleApply}
                      onDelete={(d) => deleteDraft(d.id)}
                    />
                  );
                })
              )}
            </View>
          </>
        )}
      </View>

      {/* Modals */}
      <CreateDraftModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (dto) => {
          await createDraft(dto);
        }}
      />

      <RecordPaymentModal
        visible={!!paymentState}
        application={paymentState?.application || null}
        draft={paymentState?.draft || null}
        onClose={() => setPaymentState(null)}
        onSubmit={handleConfirmPayment}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 160,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 960,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitles: {
    flex: 1,
    minWidth: 280,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  primaryActionBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)', cursor: 'pointer' }
      : { elevation: 2 }),
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 420,
  },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  emptyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
});
