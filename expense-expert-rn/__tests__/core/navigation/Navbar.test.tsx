import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Navbar } from '@/core/navigation/Navbar';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
}));

const mockLogout = jest.fn();
jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com', displayName: 'Test User' },
    profile: { displayName: 'Test User' },
    logout: mockLogout,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: () => ({ width: 1024, height: 768 }),
}));

describe('Navbar (Web / Desktop Navigation Bar)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders brand logo and title', () => {
    const { getByText, getByTestId } = render(<Navbar showLinks={true} />);
    expect(getByText('EE')).toBeTruthy();
    expect(getByText('Expense Expert')).toBeTruthy();
    expect(getByTestId('navbar-brand')).toBeTruthy();
  });

  it('renders all main navigation items on desktop', () => {
    const { getByTestId, getByText } = render(<Navbar activeRoute="/" showLinks={true} />);
    expect(getByTestId('nav-dashboard')).toBeTruthy();
    expect(getByTestId('nav-expenses')).toBeTruthy();
    expect(getByTestId('nav-budgets')).toBeTruthy();
    expect(getByTestId('nav-categories')).toBeTruthy();
    expect(getByTestId('nav-profile')).toBeTruthy();
    expect(getByText('Dashboard')).toBeTruthy();
    expect(getByText('Add Expense')).toBeTruthy();
    expect(getByText('Budgets')).toBeTruthy();
    expect(getByText('Categories')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  it('navigates when navigation item is pressed', () => {
    const onNavigateMock = jest.fn();
    const { getByTestId } = render(<Navbar onNavigate={onNavigateMock} showLinks={true} />);

    fireEvent.press(getByTestId('nav-budgets'));
    expect(onNavigateMock).toHaveBeenCalledWith('/budgets');

    fireEvent.press(getByTestId('nav-categories'));
    expect(onNavigateMock).toHaveBeenCalledWith('/categories');

    fireEvent.press(getByTestId('nav-profile'));
    expect(onNavigateMock).toHaveBeenCalledWith('/profile');

    fireEvent.press(getByTestId('nav-expenses'));
    expect(onNavigateMock).toHaveBeenCalledWith('/expenses/new');
  });

  it('uses router.push when onNavigate is not provided', () => {
    const { getByTestId } = render(<Navbar showLinks={true} />);
    fireEvent.press(getByTestId('nav-budgets'));
    expect(mockPush).toHaveBeenCalledWith('/budgets');
  });

  it('navigates to /profile when user badge is pressed', () => {
    const onNavigateMock = jest.fn();
    const { getByTestId } = render(
      <Navbar onNavigate={onNavigateMock} userEmail="john@example.com" userName="John Doe" showLinks={true} />
    );

    fireEvent.press(getByTestId('navbar-user-badge'));
    expect(onNavigateMock).toHaveBeenCalledWith('/profile');
  });

  it('displays user email and initial badge', () => {
    const { getByText, getByTestId } = render(
      <Navbar userEmail="john@example.com" userName="John Doe" showLinks={true} />
    );
    expect(getByText('J')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
    expect(getByTestId('navbar-user-badge')).toBeTruthy();
  });

  it('calls onSignOut or logout when sign out button is pressed', () => {
    const onSignOutMock = jest.fn();
    const { getByTestId } = render(<Navbar onSignOut={onSignOutMock} showLinks={true} />);

    fireEvent.press(getByTestId('navbar-logout-btn'));
    expect(onSignOutMock).toHaveBeenCalledTimes(1);
  });
});
