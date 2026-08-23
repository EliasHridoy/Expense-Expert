import React from 'react';
import { render, renderHook, act, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';

// Category Module Imports
import {
  ExpenseCategory,
  CategoryItem,
  CATEGORY_ICONS,
  EXPENSE_CATEGORIES,
  BUILTIN_CATEGORY_ICONS,
} from '@/features/categories/types/category.types';
import { CategoryIconPicker } from '@/features/categories/components/CategoryIconPicker';
import { CategoryBadge } from '@/features/categories/components/CategoryBadge';
import { CategoryListModal } from '@/features/categories/components/CategoryListModal';
import { CategoryProvider } from '@/features/categories/context/CategoryProvider';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { CategoryService, CATEGORIES_CACHE_KEY } from '@/features/categories/services/category.service';

// Filter & Expense Module Imports
import { Expense } from '@/features/expenses/types/expense.types';
import {
  FilterCriteria,
  DEFAULT_FILTER_CRITERIA,
} from '@/features/expenses/types/filter.types';
import {
  filterExpenses,
  sortExpenses,
  groupExpenses,
} from '@/features/expenses/utils/filter.util';
import { useTransactionFilters } from '@/features/expenses/hooks/useTransactionFilters';
import { FilterChips } from '@/features/expenses/components/FilterChips';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { toDateInputValue } from '@/features/expenses/utils/date.util';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP_MOCK'),
  onSnapshot: jest.fn(() => jest.fn()),
}));

jest.mock('@/config/firebase', () => ({
  db: { type: 'firestore_mock_db' },
  auth: {},
}));

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('Categorization & Filtering Module — Extensive Simulation Test Suite', () => {
  const mockUserId = 'user_sim_999';
  const mockUser = { uid: mockUserId, email: 'simulation@expense-expert.io' };

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (doc as jest.Mock).mockImplementation((_db, _path, id) => ({ id, path: `${_path}/${id}` }));
    (collection as jest.Mock).mockImplementation((_db, path) => ({ path }));
    (query as jest.Mock).mockImplementation((col) => col);
    (orderBy as jest.Mock).mockImplementation(() => ({}));
    (getDocs as jest.Mock).mockResolvedValue({ docs: [] });
  });

  // =========================================================================
  // 1. PREDEFINED 7 CATEGORIES & 30-EMOJI PALETTE SELECTION
  // =========================================================================
  describe('Scenario 1: Predefined 7 Categories & 30-Emoji Palette Selection', () => {
    it('validates all 7 predefined built-in categories against ExpenseCategory enum and icon mapping', () => {
      expect(EXPENSE_CATEGORIES).toHaveLength(7);

      const expectedCategories = [
        { value: ExpenseCategory.Food, label: 'Food', icon: '🍔' },
        { value: ExpenseCategory.Transport, label: 'Transport', icon: '🚌' },
        { value: ExpenseCategory.Entertainment, label: 'Entertainment', icon: '🎮' },
        { value: ExpenseCategory.Utilities, label: 'Utilities', icon: '💡' },
        { value: ExpenseCategory.Savings, label: 'Savings', icon: '💰' },
        { value: ExpenseCategory.LoanRepayment, label: 'Loan Repayment', icon: '💳' },
        { value: ExpenseCategory.Other, label: 'Other', icon: '📁' },
      ];

      expectedCategories.forEach((expected) => {
        const found = EXPENSE_CATEGORIES.find((c) => c.value === expected.value);
        expect(found).toBeDefined();
        expect(found?.label).toBe(expected.label);
        expect(found?.icon).toBe(expected.icon);
        expect(BUILTIN_CATEGORY_ICONS[expected.value]).toBe(expected.icon);
      });

      // Verify CategoryService.getBuiltInCategories transforms them properly
      const builtIns = CategoryService.getBuiltInCategories();
      expect(builtIns).toHaveLength(7);
      builtIns.forEach((item) => {
        expect(item.isCustom).toBe(false);
        expect(item.value).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeTruthy();
      });
    });

    it('verifies the 30-emoji palette contains exactly 30 unique expressive icons', () => {
      expect(CATEGORY_ICONS).toHaveLength(30);
      const uniqueIcons = new Set(CATEGORY_ICONS);
      expect(uniqueIcons.size).toBe(30);

      // Verify essential emojis are present in palette
      const requiredEmojis = ['🏋️', '💻', '🍔', '🚌', '💡', '🎮', '✈️', '🎁', '📚', '🏠', '☕', '🚗'];
      requiredEmojis.forEach((emoji) => {
        expect(CATEGORY_ICONS).toContain(emoji);
      });
    });

    it('renders CategoryIconPicker with all 30 emoji options and handles selection interactions', () => {
      const handleSelectIcon = jest.fn();
      const initialIcon = '🍔';

      const { getByTestId } = render(
        <CategoryIconPicker
          selectedIcon={initialIcon}
          onSelectIcon={handleSelectIcon}
          testID="custom-icon-picker"
        />
      );

      expect(getByTestId('custom-icon-picker')).toBeTruthy();

      // Check initial selection state
      const initialSelectedBtn = getByTestId(`emoji-option-${initialIcon}`);
      expect(initialSelectedBtn.props.accessibilityState.selected).toBe(true);

      // All 30 buttons rendered
      CATEGORY_ICONS.forEach((icon) => {
        const iconBtn = getByTestId(`emoji-option-${icon}`);
        expect(iconBtn).toBeTruthy();
      });

      // Simulate clicking custom emoji options (e.g. Gym 🏋️, Subscriptions 💻)
      const gymBtn = getByTestId('emoji-option-🏋️');
      fireEvent.press(gymBtn);
      expect(handleSelectIcon).toHaveBeenCalledWith('🏋️');

      const techBtn = getByTestId('emoji-option-💻');
      fireEvent.press(techBtn);
      expect(handleSelectIcon).toHaveBeenCalledWith('💻');
    });
  });

  // =========================================================================
  // 2. ADDING CUSTOM CATEGORIES & PERSISTENCE (FIRESTORE + ASYNCSTORAGE)
  // =========================================================================
  describe('Scenario 2: Adding Custom Categories & Persistence to Firestore & AsyncStorage', () => {
    it('persists custom category ("Gym 🏋️") to Firestore and caches into AsyncStorage', async () => {
      (setDoc as jest.Mock).mockResolvedValueOnce(undefined);

      const added = await CategoryService.addCustomCategory(mockUserId, {
        name: 'Gym',
        icon: '🏋️',
      });

      expect(added.label).toBe('Gym');
      expect(added.icon).toBe('🏋️');
      expect(added.isCustom).toBe(true);
      expect(added.id).toContain('custom_gym_');

      // Verify Firestore setDoc invocation
      expect(setDoc).toHaveBeenCalledTimes(1);
      const setDocCall = (setDoc as jest.Mock).mock.calls[0];
      const payload = setDocCall[1];
      expect(payload.name).toBe('Gym');
      expect(payload.icon).toBe('🏋️');
      expect(payload.id).toBe(added.id);

      // Verify AsyncStorage cache persistence
      const cacheKey = `${CATEGORIES_CACHE_KEY}_${mockUserId}`;
      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      expect(cachedRaw).toBeTruthy();
      const cachedList: CategoryItem[] = JSON.parse(cachedRaw!);
      expect(cachedList).toHaveLength(1);
      expect(cachedList[0].label).toBe('Gym');
      expect(cachedList[0].icon).toBe('🏋️');
    });

    it('persists multiple custom categories and maintains sorted order in local cache', async () => {
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      await CategoryService.addCustomCategory(mockUserId, 'Subscriptions', '💻');
      await CategoryService.addCustomCategory(mockUserId, 'Gym', '🏋️');
      await CategoryService.addCustomCategory(mockUserId, 'Art & Craft', '🎨');

      const cacheKey = `${CATEGORIES_CACHE_KEY}_${mockUserId}`;
      const cachedRaw = await AsyncStorage.getItem(cacheKey);
      const cachedList: CategoryItem[] = JSON.parse(cachedRaw!);

      expect(cachedList).toHaveLength(3);
      // Alphabetical order: Art & Craft, Gym, Subscriptions
      expect(cachedList.map((c) => c.label)).toEqual(['Art & Craft', 'Gym', 'Subscriptions']);
    });

    it('fetches custom categories with AsyncStorage fallback when Firestore is offline', async () => {
      const offlineCategories: CategoryItem[] = [
        { id: 'custom_gym_1', value: 'custom_gym_1', label: 'Gym', icon: '🏋️', isCustom: true },
        { id: 'custom_tech_2', value: 'custom_tech_2', label: 'Subscriptions', icon: '💻', isCustom: true },
      ];
      const cacheKey = `${CATEGORIES_CACHE_KEY}_${mockUserId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(offlineCategories));

      // Simulate Firestore network failure
      (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Firebase offline network error'));

      const result = await CategoryService.fetchCustomCategories(mockUserId);
      expect(result).toEqual(offlineCategories);
      expect(result).toHaveLength(2);
    });

    it('integrates CategoryProvider with full add category lifecycle and updates context', async () => {
      (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.categories).toHaveLength(7); // 7 built-ins

      // Add "Gym 🏋️"
      await act(async () => {
        await result.current.addCategory('Gym', '🏋️');
      });

      expect(result.current.customCategories).toHaveLength(1);
      expect(result.current.customCategories[0].label).toBe('Gym');
      expect(result.current.categories).toHaveLength(8);

      // Add "Subscriptions 💻"
      await act(async () => {
        await result.current.addCategory('Subscriptions', '💻');
      });

      expect(result.current.customCategories).toHaveLength(2);
      expect(result.current.categories).toHaveLength(9);
      expect(result.current.customCategories.map((c) => c.label)).toEqual(['Gym', 'Subscriptions']);
    });

    it('simulates user interacting with CategoryListModal to create custom categories with validation', async () => {
      (getDocs as jest.Mock).mockResolvedValueOnce({ docs: [] });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const onClose = jest.fn();

      const Component = () => (
        <CategoryProvider>
          <CategoryListModal visible={true} onClose={onClose} />
        </CategoryProvider>
      );

      const { getByTestId, getByText, queryByTestId } = render(<Component />);

      // Verify modal elements after loading resolves
      await waitFor(() => {
        expect(getByTestId('category-list-modal')).toBeTruthy();
        expect(getByTestId('empty-custom-categories')).toBeTruthy();
      });

      // Submit empty category name -> shows validation error
      const saveBtn = getByTestId('save-category-btn');
      fireEvent.press(saveBtn);

      await waitFor(() => {
        expect(getByTestId('category-form-error')).toHaveTextContent('Category name is required');
      });

      // Enter category name "Subscriptions" and select icon "💻"
      const nameInput = getByTestId('category-name-input');
      fireEvent.changeText(nameInput, 'Subscriptions');

      // Error should clear
      expect(queryByTestId('category-form-error')).toBeNull();

      const laptopEmojiBtn = getByTestId('emoji-option-💻');
      fireEvent.press(laptopEmojiBtn);

      // Submit form
      await act(async () => {
        fireEvent.press(saveBtn);
      });

      await waitFor(() => {
        expect(getByText('Subscriptions')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // 3. DELETING A CUSTOM CATEGORY & HISTORICAL EXPENSE FALLBACK
  // =========================================================================
  describe('Scenario 3: Deleting Custom Category & Historical Expense Graceful Fallback', () => {
    it('deletes custom category from Firestore and updates AsyncStorage cache', async () => {
      const initialCustoms: CategoryItem[] = [
        { id: 'custom_subs_1', value: 'custom_subs_1', label: 'Subscriptions', icon: '💻', isCustom: true },
        { id: 'custom_gym_2', value: 'custom_gym_2', label: 'Gym', icon: '🏋️', isCustom: true },
      ];
      const cacheKey = `${CATEGORIES_CACHE_KEY}_${mockUserId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(initialCustoms));
      (deleteDoc as jest.Mock).mockResolvedValueOnce(undefined);

      await CategoryService.deleteCustomCategory(mockUserId, 'custom_subs_1');

      expect(deleteDoc).toHaveBeenCalledTimes(1);

      // Verify cache after deletion
      const updatedCache = JSON.parse((await AsyncStorage.getItem(cacheKey))!);
      expect(updatedCache).toHaveLength(1);
      expect(updatedCache[0].id).toBe('custom_gym_2');
    });

    it('verifies CategoryBadge renders custom category before deletion and falls back gracefully to 📁 Unknown without crashing after deletion', async () => {
      // 1. Initial custom categories in Provider
      const customSubCategory: CategoryItem = {
        id: 'custom_sub_99',
        value: 'custom_sub_99',
        label: 'Subscriptions',
        icon: '💻',
        isCustom: true,
      };

      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [
          {
            id: 'custom_sub_99',
            data: () => ({ name: 'Subscriptions', icon: '💻' }),
          },
        ],
      });
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      const ConsumerTest = () => {
        return (
          <>
            {/* Historical Expense 1 using custom category */}
            <CategoryBadge category="custom_sub_99" testID="historical-badge-sub" />
            {/* Historical Expense 2 using built-in food category */}
            <CategoryBadge category="food" testID="historical-badge-food" />
            {/* Historical Expense 3 with completely unknown/orphan category */}
            <CategoryBadge category="deleted_nonexistent_cat_404" testID="historical-badge-unknown" />
            {/* Button to delete category */}
            <CategoryListModal visible={true} onClose={() => {}} />
          </>
        );
      };

      const { getByTestId } = render(
        <CategoryProvider>
          <ConsumerTest />
        </CategoryProvider>
      );

      // Verify initial rendering with active custom category
      await waitFor(() => {
        const subBadge = getByTestId('historical-badge-sub');
        expect(subBadge).toBeTruthy();
        expect(subBadge).toHaveTextContent(/💻/);
        expect(subBadge).toHaveTextContent(/Subscriptions/);
      });

      // Verify built-in category renders properly
      expect(getByTestId('historical-badge-food')).toHaveTextContent(/🍔/);
      expect(getByTestId('historical-badge-food')).toHaveTextContent(/Food/);

      // Verify unknown category already falls back gracefully to 📁 without crashing
      expect(getByTestId('historical-badge-unknown')).toHaveTextContent(/📁/);
      expect(getByTestId('historical-badge-unknown')).toHaveTextContent(/deleted_nonexistent_cat_404/);

      // Now simulate deleting the custom category from UI
      const deleteBtn = getByTestId('delete-category-custom_sub_99');
      await act(async () => {
        fireEvent.press(deleteBtn);
      });

      // After deletion:
      // The custom category is deleted from context.
      // Historical expenses referencing 'custom_sub_99' must not crash and fallback to '📁' and value string
      await waitFor(() => {
        const subBadgeAfterDelete = getByTestId('historical-badge-sub');
        expect(subBadgeAfterDelete).toHaveTextContent(/📁/);
        expect(subBadgeAfterDelete).toHaveTextContent(/custom_sub_99/);
      });
    });

    it('tests getCategoryByValue edge cases (empty strings, null, undefined, casing)', async () => {
      const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <CategoryProvider>{children}</CategoryProvider>
      );

      const { result } = renderHook(() => useCategories(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Empty string fallback
      const emptyResult = result.current.getCategoryByValue('');
      expect(emptyResult.icon).toBe('📁');
      expect(emptyResult.label).toBe('Other');

      // Case insensitive match for built-in
      const caseInsensitiveFood = result.current.getCategoryByValue('FOOD');
      expect(caseInsensitiveFood.icon).toBe('🍔');
      expect(caseInsensitiveFood.label).toBe('Food');

      // Case insensitive match for enum value
      const caseInsensitiveLoan = result.current.getCategoryByValue('loan_repayment');
      expect(caseInsensitiveLoan.icon).toBe('💳');
      expect(caseInsensitiveLoan.label).toBe('Loan Repayment');

      // Nonexistent string fallback
      const missingResult = result.current.getCategoryByValue('random_legacy_category_id');
      expect(missingResult.icon).toBe('📁');
      expect(missingResult.label).toBe('random_legacy_category_id');
      expect(missingResult.isCustom).toBe(false);
    });
  });

  // =========================================================================
  // 4. EXTENSIVE MULTI-CRITERIA FILTERING ENGINE SIMULATION
  // =========================================================================
  describe('Scenario 4: Multi-Criteria Filtering Engine (filter.util & useTransactionFilters)', () => {
    // Construct rich realistic dummy expenses across dates, amounts, and categories
    const now = new Date();
    const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 30).toISOString();
    const todayEveningISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 45).toISOString();

    // 2 days ago (this week or recent)
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const twoDaysAgoISO = twoDaysAgo.toISOString();

    // 5 days ago
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const fiveDaysAgoISO = fiveDaysAgo.toISOString();

    // 15 days ago in current month (or earlier this month)
    const earlierThisMonth = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 10));
    const earlierThisMonthISO = earlierThisMonth.toISOString();

    // 2 months ago
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 10, 12, 0, 0);
    const twoMonthsAgoISO = twoMonthsAgo.toISOString();

    // 1 year ago
    const oneYearAgo = new Date(now.getFullYear() - 1, 5, 20, 12, 0, 0);
    const oneYearAgoISO = oneYearAgo.toISOString();

    const dummyExpenses: Expense[] = [
      {
        id: 'exp_01',
        title: 'Whole Foods Market',
        description: 'Organic groceries, fruits, almond milk, and coffee beans',
        amount: 86.4,
        amountInCents: 8640,
        category: 'food',
        date: todayISO,
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: todayISO,
        updatedAt: todayISO,
      },
      {
        id: 'exp_02',
        title: 'Starbucks Coffee',
        description: 'Caramel Macchiato and croissant snack',
        amount: 8.75,
        amountInCents: 875,
        category: 'food',
        date: todayEveningISO,
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: todayEveningISO,
        updatedAt: todayEveningISO,
      },
      {
        id: 'exp_03',
        title: 'Uber City Ride',
        description: 'Commute to downtown co-working office',
        amount: 24.5,
        amountInCents: 2450,
        category: 'transport',
        date: twoDaysAgoISO,
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: twoDaysAgoISO,
        updatedAt: twoDaysAgoISO,
      },
      {
        id: 'exp_04',
        title: 'Steam Video Game',
        description: 'Cyberpunk RPG game purchase during summer sale',
        amount: 49.99,
        amountInCents: 4999,
        category: 'entertainment',
        date: fiveDaysAgoISO,
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: fiveDaysAgoISO,
        updatedAt: fiveDaysAgoISO,
      },
      {
        id: 'exp_05',
        title: 'Monthly Gym Membership',
        description: 'Planet Fitness monthly gym access pass and locker fee',
        amount: 35.0,
        amountInCents: 3500,
        category: 'custom_gym',
        date: earlierThisMonthISO,
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: earlierThisMonthISO,
        updatedAt: earlierThisMonthISO,
      },
      {
        id: 'exp_06',
        title: 'Netflix & Spotify Subscriptions',
        description: 'Family 4K streaming plan and audio music streaming',
        amount: 29.98,
        amountInCents: 2998,
        category: 'custom_subscriptions',
        date: earlierThisMonthISO,
        month: '2026-08',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: earlierThisMonthISO,
        updatedAt: earlierThisMonthISO,
      },
      {
        id: 'exp_07',
        title: 'High-speed Fiber Internet',
        description: 'Home gigabit broadband utilities bill',
        amount: 70.0,
        amountInCents: 7000,
        category: 'utilities',
        date: twoMonthsAgoISO,
        month: '2026-06',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: twoMonthsAgoISO,
        updatedAt: twoMonthsAgoISO,
      },
      {
        id: 'exp_08',
        title: 'Emergency Rainy Day Fund',
        description: 'Auto deposit into high yield savings account',
        amount: 250.0,
        amountInCents: 25000,
        category: 'savings',
        date: twoMonthsAgoISO,
        month: '2026-06',
        isLoan: false,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: twoMonthsAgoISO,
        updatedAt: twoMonthsAgoISO,
      },
      {
        id: 'exp_09',
        title: 'Student Loan Installment',
        description: 'Monthly fixed repayment for university degree loan',
        amount: 320.0,
        amountInCents: 32000,
        category: 'loan_repayment',
        date: oneYearAgoISO,
        month: '2025-06',
        isLoan: true,
        loanPersonId: null,
        loanCleared: false,
        loanRepaid: 320.0,
        loanTakenId: null,
        draftId: null,
        installmentIndex: null,
        createdAt: oneYearAgoISO,
        updatedAt: oneYearAgoISO,
      },
    ];

    describe('1. Search String Match (Title & Notes/Description)', () => {
      it('matches substring in title case-insensitively', () => {
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          searchQuery: 'whole foods',
        });
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('exp_01');
      });

      it('matches substring in description/notes case-insensitively with leading/trailing spaces', () => {
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          searchQuery: '  gigabit broadband  ',
        });
        expect(filtered).toHaveLength(1);
        expect(filtered[0].id).toBe('exp_07');
        expect(filtered[0].category).toBe('utilities');
      });

      it('matches multiple items when keyword is shared across title/notes (sorted by default date_desc)', () => {
        // "coffee" appears in exp_01 description and exp_02 title
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          searchQuery: 'coffee',
        });
        expect(filtered).toHaveLength(2);
        // Default sort is date_desc, so exp_02 (evening) comes before exp_01 (morning)
        expect(filtered.map((e) => e.id)).toEqual(['exp_02', 'exp_01']);
      });

      it('returns empty list when search term has no match', () => {
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          searchQuery: 'NonExistentProductZ999',
        });
        expect(filtered).toHaveLength(0);
      });
    });

    describe('2. Category Filter Chips (Built-in, Custom, and All)', () => {
      it('filters by built-in category (food)', () => {
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          category: 'food',
        });
        expect(filtered).toHaveLength(2);
        expect(filtered.every((e) => e.category === 'food')).toBe(true);
      });

      it('filters by custom category (custom_gym)', () => {
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          category: 'custom_gym',
        });
        expect(filtered).toHaveLength(1);
        expect(filtered[0].title).toBe('Monthly Gym Membership');
      });

      it('returns all expenses when category is "all"', () => {
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          category: 'all',
        });
        expect(filtered).toHaveLength(dummyExpenses.length);
      });

      it('renders FilterChips component and triggers onSelectCategory correctly', () => {
        const onSelect = jest.fn();
        const { getByTestId } = render(
          <FilterChips selectedCategory="food" onSelectCategory={onSelect} />
        );

        expect(getByTestId('filter-chip-all')).toBeTruthy();
        expect(getByTestId('filter-chip-food')).toBeTruthy();
        expect(getByTestId('filter-chip-transport')).toBeTruthy();

        fireEvent.press(getByTestId('filter-chip-transport'));
        expect(onSelect).toHaveBeenCalledWith('transport');

        fireEvent.press(getByTestId('filter-chip-all'));
        expect(onSelect).toHaveBeenCalledWith('all');
      });
    });

    describe('3. Date Presets (Today, This Week, This Month, All Time, Custom Range)', () => {
      it('filters for "today" preset correctly', () => {
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'today',
        });
        expect(filtered).toHaveLength(2);
        expect(filtered.map((e) => e.id)).toEqual(['exp_02', 'exp_01']);
      });

      it('filters for "month" preset correctly (excludes past months)', () => {
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'month',
        });
        // exp_01, exp_02, exp_03 (2d ago), exp_04 (5d ago), exp_05, exp_06 are all in current month
        expect(filtered.find((e) => e.id === 'exp_07')).toBeUndefined(); // 2 months ago
        expect(filtered.find((e) => e.id === 'exp_08')).toBeUndefined(); // 2 months ago
        expect(filtered.find((e) => e.id === 'exp_09')).toBeUndefined(); // 1 year ago
      });

      it('filters for "all" preset returning all items', () => {
        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'all',
        });
        expect(filtered).toHaveLength(dummyExpenses.length);
      });

      it('filters for "custom" date range with inclusive boundaries', () => {
        const startDateStr = toDateInputValue(earlierThisMonth);
        const endDateStr = toDateInputValue(now);

        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'custom',
          customStartDate: startDateStr,
          customEndDate: endDateStr,
        });

        // Must include today and earlier this month items, but exclude 2 months ago and 1 year ago
        expect(filtered.some((e) => e.id === 'exp_01')).toBe(true);
        expect(filtered.some((e) => e.id === 'exp_05')).toBe(true);
        expect(filtered.some((e) => e.id === 'exp_07')).toBe(false);
        expect(filtered.some((e) => e.id === 'exp_09')).toBe(false);
      });

      it('filters for "custom" date range with start-date only', () => {
        const startDateStr = toDateInputValue(twoMonthsAgo);

        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'custom',
          customStartDate: startDateStr,
        });

        expect(filtered.some((e) => e.id === 'exp_01')).toBe(true);
        expect(filtered.some((e) => e.id === 'exp_07')).toBe(true);
        expect(filtered.some((e) => e.id === 'exp_09')).toBe(false); // 1 year ago excluded
      });

      it('filters for "custom" date range with end-date only', () => {
        const endDateStr = toDateInputValue(twoMonthsAgo);

        const filtered = filterExpenses(dummyExpenses, {
          ...DEFAULT_FILTER_CRITERIA,
          dateRange: 'custom',
          customEndDate: endDateStr,
        });

        expect(filtered.some((e) => e.id === 'exp_07')).toBe(true);
        expect(filtered.some((e) => e.id === 'exp_08')).toBe(true);
        expect(filtered.some((e) => e.id === 'exp_09')).toBe(true);
        expect(filtered.some((e) => e.id === 'exp_01')).toBe(false); // Today excluded
      });
    });

    describe('4. Sorting Options (date asc/desc, amount asc/desc, title asc)', () => {
      it('sorts by date_desc (newest first)', () => {
        const sorted = sortExpenses(dummyExpenses, 'date_desc');
        expect(sorted[0].id).toBe('exp_02'); // Today evening
        expect(sorted[sorted.length - 1].id).toBe('exp_09'); // 1 year ago
      });

      it('sorts by date_asc (oldest first)', () => {
        const sorted = sortExpenses(dummyExpenses, 'date_asc');
        expect(sorted[0].id).toBe('exp_09'); // 1 year ago
        expect(sorted[sorted.length - 1].id).toBe('exp_02'); // Today evening
      });

      it('sorts by amount_desc (highest amount first)', () => {
        const sorted = sortExpenses(dummyExpenses, 'amount_desc');
        expect(sorted[0].amountInCents).toBe(32000); // Student loan $320
        expect(sorted[1].amountInCents).toBe(25000); // Savings $250
        expect(sorted[sorted.length - 1].amountInCents).toBe(875); // Coffee $8.75
      });

      it('sorts by amount_asc (lowest amount first)', () => {
        const sorted = sortExpenses(dummyExpenses, 'amount_asc');
        expect(sorted[0].amountInCents).toBe(875); // Coffee $8.75
        expect(sorted[sorted.length - 1].amountInCents).toBe(32000); // Student loan $320
      });

      it('sorts by title_asc (alphabetical order A-Z)', () => {
        const sorted = sortExpenses(dummyExpenses, 'title_asc');
        const titles = sorted.map((e) => e.title);
        const expected = [...titles].sort((a, b) => a.localeCompare(b));
        expect(titles).toEqual(expected);
      });
    });

    describe('5. Grouping Options (by none, category, date)', () => {
      it('groups by "none" returning single grand total group', () => {
        const groups = groupExpenses(dummyExpenses, 'none');
        expect(groups).toHaveLength(1);
        expect(groups[0].key).toBe('all');
        expect(groups[0].title).toBe('All Transactions');
        expect(groups[0].items).toHaveLength(dummyExpenses.length);

        const totalCents = dummyExpenses.reduce((sum, e) => sum + e.amountInCents, 0);
        expect(groups[0].totalInCents).toBe(totalCents);
        expect(groups[0].total).toBe(totalCents / 100);
      });

      it('groups by "category" sorted descending by total amount spent with custom label formatter', () => {
        const categoryLabels: Record<string, string> = {
          loan_repayment: '💳 Loan Repayment',
          savings: '💰 Savings',
          food: '🍔 Food & Groceries',
          utilities: '💡 Utilities',
          entertainment: '🎮 Gaming',
          custom_gym: '🏋️ Fitness Club',
          custom_subscriptions: '💻 Tech Subs',
          transport: '🚌 Commute',
        };

        const groups = groupExpenses(
          dummyExpenses,
          'category',
          (cat) => categoryLabels[cat] || cat
        );

        // Verify sorted descending by totalInCents
        for (let i = 0; i < groups.length - 1; i++) {
          expect(groups[i].totalInCents).toBeGreaterThanOrEqual(groups[i + 1].totalInCents);
        }

        // Loan repayment should be highest group ($320)
        expect(groups[0].key).toBe('loan_repayment');
        expect(groups[0].title).toBe('💳 Loan Repayment');
        expect(groups[0].totalInCents).toBe(32000);

        // Food should have 2 items ($86.40 + $8.75 = $95.15)
        const foodGroup = groups.find((g) => g.key === 'food');
        expect(foodGroup).toBeDefined();
        expect(foodGroup?.items).toHaveLength(2);
        expect(foodGroup?.totalInCents).toBe(8640 + 875);
      });

      it('groups by "date" sorted descending by date key with formatted header dates', () => {
        const groups = groupExpenses(dummyExpenses, 'date');
        expect(groups.length).toBeGreaterThanOrEqual(5);

        // Groups must be ordered descending by date key
        for (let i = 0; i < groups.length - 1; i++) {
          expect(groups[i].key >= groups[i + 1].key).toBe(true);
        }

        // First group should contain today's transactions
        expect(groups[0].items.some((e) => e.id === 'exp_01')).toBe(true);
        expect(groups[0].items.some((e) => e.id === 'exp_02')).toBe(true);
      });
    });

    describe('6. Hook Simulation: useTransactionFilters Live State Updates & Multi-Criteria Pipeline', () => {
      it('executes a multi-step user flow updating search, categories, date ranges, sorting, and grouping', () => {
        const categoryLabels: Record<string, string> = {
          food: '🍔 Food',
          custom_gym: '🏋️ Gym',
        };

        const { result } = renderHook(() =>
          useTransactionFilters(dummyExpenses, {
            getCategoryLabel: (c) => categoryLabels[c] || c,
          })
        );

        // Step 1: Initial state
        expect(result.current.filteredCount).toBe(dummyExpenses.length);
        const allTotalCents = dummyExpenses.reduce((sum, e) => sum + e.amountInCents, 0);
        expect(result.current.totalFilteredCents).toBe(allTotalCents);
        expect(result.current.viewMode).toBe('list');

        // Step 2: User filters by Category "food"
        act(() => {
          result.current.setCategory('food');
        });
        expect(result.current.criteria.category).toBe('food');
        expect(result.current.filteredCount).toBe(2);
        expect(result.current.totalFilteredCents).toBe(8640 + 875);
        expect(result.current.totalFiltered).toBe(95.15);

        // Step 3: User searches within food for "croissant"
        act(() => {
          result.current.setSearchQuery('croissant');
        });
        expect(result.current.filteredCount).toBe(1);
        expect(result.current.filteredExpenses[0].id).toBe('exp_02');
        expect(result.current.totalFilteredCents).toBe(875);

        // Step 4: Reset filters and apply custom date range + sort by amount_desc
        act(() => {
          result.current.resetFilters();
        });
        expect(result.current.filteredCount).toBe(dummyExpenses.length);

        act(() => {
          result.current.setSortBy('amount_desc');
          result.current.setGroupBy('category');
        });
        expect(result.current.filteredExpenses[0].amountInCents).toBe(32000);
        expect(result.current.groupedExpenses.length).toBe(8);

        // Step 5: Toggle viewMode to 'grid'
        act(() => {
          result.current.toggleViewMode();
        });
        expect(result.current.viewMode).toBe('grid');

        // Step 6: Direct criteria updater function
        act(() => {
          result.current.setCriteria((prev) => ({
            ...prev,
            category: 'custom_subscriptions',
          }));
        });
        expect(result.current.filteredCount).toBe(1);
        expect(result.current.filteredExpenses[0].title).toBe('Netflix & Spotify Subscriptions');
      });
    });
  });
});
