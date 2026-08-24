import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import DraftsScreen from '@/../app/(app)/drafts/index';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@/features/categories/hooks/useCategories', () => ({
  useCategories: () => ({
    categories: [
      { value: 'utilities', label: 'Utilities', icon: '💡', isCustom: false },
    ],
    getCategoryLabel: (val: string) => (val === 'utilities' ? 'Utilities' : val),
    getCategoryIcon: (val: string) => (val === 'utilities' ? '💡' : '📁'),
  }),
}));

const mockCreateDraft = jest.fn();
const mockApplyDraftToMonth = jest.fn();
const mockRecordPayment = jest.fn();

jest.mock('@/features/drafts/hooks/useDrafts', () => ({
  useDrafts: () => ({
    drafts: [
      {
        id: 'draft_1',
        title: 'Monthly Wi-Fi Fiber',
        targetAmount: 80,
        category: 'utilities',
        installmentCount: 1,
        isActive: true,
      },
      {
        id: 'draft_2',
        title: 'Apartment Rent',
        targetAmount: 1500,
        category: 'utilities',
        installmentCount: 1,
        isActive: true,
      },
    ],
    applications: [
      {
        id: 'app_draft_1_2026-08',
        draftId: 'draft_1',
        month: '2026-08',
        targetAmount: 80,
        paidAmount: 0,
        installmentsPaid: 0,
        totalInstallments: 1,
        status: 'pending',
        payments: [],
      },
    ],
    isLoading: false,
    activeMonth: '2026-08',
    setActiveMonth: jest.fn(),
    createDraft: mockCreateDraft,
    deleteDraft: jest.fn(),
    applyDraftToMonth: mockApplyDraftToMonth,
    recordPayment: mockRecordPayment,
  }),
}));

describe('DraftsScreen (/drafts)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Drafts screen with applied bills and template library', () => {
    const { getByTestId, getAllByText, getByText } = render(<DraftsScreen />);
    expect(getByTestId('drafts-screen')).toBeTruthy();
    expect(getByText('📋 Expense Drafts')).toBeTruthy();
    expect(getAllByText('Monthly Wi-Fi Fiber').length).toBeGreaterThanOrEqual(1);
    expect(getByText('Apartment Rent')).toBeTruthy();
  });

  it('allows applying a draft template to the active month', async () => {
    const { getByTestId } = render(<DraftsScreen />);

    // Apply Apartment Rent
    fireEvent.press(getByTestId('apply-draft-btn-draft_2'));
    await waitFor(() => {
      expect(mockApplyDraftToMonth).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'draft_2', title: 'Apartment Rent' }),
        '2026-08'
      );
    });
  });

  it('allows 1-tap quick pay for an applied monthly draft', async () => {
    const { getByTestId } = render(<DraftsScreen />);

    // Click Quick Add on applied Wi-Fi bill
    fireEvent.press(getByTestId('record-payment-btn-app_draft_1_2026-08'));
    expect(getByTestId('record-payment-modal')).toBeTruthy();

    fireEvent.press(getByTestId('confirm-payment-btn'));
    await waitFor(() => {
      expect(mockRecordPayment).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'app_draft_1_2026-08' }),
        80,
        expect.objectContaining({ id: 'draft_1' })
      );
    });
  });

  it('opens create draft modal and saves new template', async () => {
    const { getByTestId } = render(<DraftsScreen />);

    fireEvent.press(getByTestId('create-draft-btn'));
    expect(getByTestId('create-draft-modal')).toBeTruthy();

    fireEvent.changeText(getByTestId('draft-title-input'), 'Gym Membership');
    fireEvent.changeText(getByTestId('draft-amount-input'), '65.00');
    fireEvent.press(getByTestId('submit-draft-btn'));

    await waitFor(() => {
      expect(mockCreateDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Gym Membership',
          targetAmount: 65,
        })
      );
    });
  });
});
