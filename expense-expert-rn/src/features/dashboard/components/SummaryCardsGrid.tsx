import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { formatCents } from '../../expenses/utils/currency.util';
import { MonthSummary } from '../types/dashboard.types';
import { SummaryCard } from './SummaryCard';

export interface SummaryCardsGridProps {
  summary: MonthSummary;
  onPressCard?: (cardKey: string) => void;
  className?: string;
  testID?: string;
}

export const SummaryCardsGrid: React.FC<SummaryCardsGridProps> = ({
  summary,
  onPressCard,
  className = '',
  testID = 'summary-cards-grid',
}) => {
  const isDeficit = summary.remainingInCents < 0;

  const incomeSubtext =
    summary.previousMonthRemainingInCents !== 0
      ? summary.previousMonthRemainingInCents > 0
        ? `Includes +${formatCents(summary.previousMonthRemainingInCents)} carryover`
        : `Includes ${formatCents(summary.previousMonthRemainingInCents)} carryover`
      : 'Monthly income total';

  const expensesSubtext = `${summary.expenseCount} transaction${
    summary.expenseCount === 1 ? '' : 's'
  }`;

  const remainingSubtext = isDeficit ? 'Deficit this month' : 'Surplus balance';
  const remainingFormatted = isDeficit
    ? `-${formatCents(Math.abs(summary.remainingInCents))}`
    : formatCents(summary.remainingInCents);

  return (
    <View testID={testID} style={styles.grid} className={`w-full flex-row flex-wrap -mx-2 ${className}`}>
      {/* 1. Total Income */}
      <View style={styles.col} className="w-full sm:w-1/2 lg:w-1/4 p-2">
        <SummaryCard
          title="Total Income"
          amountFormatted={formatCents(summary.totalIncomeInCents)}
          subtext={incomeSubtext}
          type="income"
          icon="💰"
          onPress={onPressCard ? () => onPressCard('income') : undefined}
          testID="summary-card-income"
        />
      </View>

      {/* 2. Total Expenses */}
      <View style={styles.col} className="w-full sm:w-1/2 lg:w-1/4 p-2">
        <SummaryCard
          title="Total Expenses"
          amountFormatted={formatCents(summary.totalExpensesInCents)}
          subtext={expensesSubtext}
          type="expense"
          icon="💳"
          onPress={onPressCard ? () => onPressCard('expenses') : undefined}
          testID="summary-card-expenses"
        />
      </View>

      {/* 3. Total Savings */}
      <View style={styles.col} className="w-full sm:w-1/2 lg:w-1/4 p-2">
        <SummaryCard
          title="Total Savings"
          amountFormatted={formatCents(summary.totalSavingsInCents)}
          subtext="Net deposits this month"
          type="savings"
          icon="🏦"
          onPress={onPressCard ? () => onPressCard('savings') : undefined}
          testID="summary-card-savings"
        />
      </View>

      {/* 4. Net Remaining */}
      <View style={styles.col} className="w-full sm:w-1/2 lg:w-1/4 p-2">
        <SummaryCard
          title="Net Remaining"
          amountFormatted={remainingFormatted}
          subtext={remainingSubtext}
          isNegative={isDeficit}
          type={isDeficit ? 'expense' : 'income'}
          icon={isDeficit ? '⚠️' : '✨'}
          onPress={onPressCard ? () => onPressCard('remaining') : undefined}
          testID="summary-card-remaining"
        />
      </View>

      {/* 5. Loans Taken (Conditional) */}
      {summary.loansTakenIncomeInCents > 0 && (
        <View style={styles.col} className="w-full sm:w-1/2 lg:w-1/4 p-2">
          <SummaryCard
            title="Loans Taken"
            amountFormatted={formatCents(summary.loansTakenIncomeInCents)}
            subtext="Inflow from loans"
            type="neutral"
            icon="🤝"
            onPress={onPressCard ? () => onPressCard('loans') : undefined}
            testID="summary-card-loans"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
    marginVertical: 4,
  },
  col: {
    padding: 8,
    flexBasis: Platform.OS === 'web' ? '25%' : '100%',
    flexGrow: 1,
    minWidth: Platform.OS === 'web' ? 220 : '100%',
    maxWidth: Platform.OS === 'web' ? '50%' : '100%',
  },
});
