import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BottomNav } from '@/core/navigation/BottomNav';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }),
}));

describe('BottomNav (Mobile Bottom Navigation Panel)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders mobile navigation tabs', () => {
    const { getByTestId, getByText } = render(<BottomNav activeRoute="/" />);
    expect(getByTestId('app-mobile-bottom-nav')).toBeTruthy();
    expect(getByTestId('mobile-nav-dashboard')).toBeTruthy();
    expect(getByTestId('mobile-nav-expenses')).toBeTruthy();
    expect(getByTestId('mobile-nav-budgets')).toBeTruthy();
    expect(getByTestId('mobile-nav-categories')).toBeTruthy();
    expect(getByTestId('mobile-nav-profile')).toBeTruthy();
    expect(getByText('Dashboard')).toBeTruthy();
    expect(getByText('Add Expense')).toBeTruthy();
    expect(getByText('Budgets')).toBeTruthy();
    expect(getByText('Categories')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('navigates when mobile tab is pressed', () => {
    const onNavigateMock = jest.fn();
    const { getByTestId } = render(<BottomNav onNavigate={onNavigateMock} />);

    fireEvent.press(getByTestId('mobile-nav-budgets'));
    expect(onNavigateMock).toHaveBeenCalledWith('/budgets');

    fireEvent.press(getByTestId('mobile-nav-categories'));
    expect(onNavigateMock).toHaveBeenCalledWith('/categories');
  });

  it('uses router.push when onNavigate is not provided', () => {
    const { getByTestId } = render(<BottomNav />);
    fireEvent.press(getByTestId('mobile-nav-expenses'));
    expect(mockPush).toHaveBeenCalledWith('/expenses/new');
  });
});
