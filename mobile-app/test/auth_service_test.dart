import 'package:expense_expert/core/services/auth_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:mocktail/mocktail.dart';

// Mock classes
class MockFirebaseAuth extends Mock implements FirebaseAuth {}
class MockGoogleSignIn extends Mock implements GoogleSignIn {}
class MockUserCredential extends Mock implements UserCredential {}
class MockUser extends Mock implements User {}

void main() {
  late AuthService authService;
  late MockFirebaseAuth mockAuth;
  late MockGoogleSignIn mockGoogleSignIn;
  late MockUserCredential mockUserCredential;
  late MockUser mockUser;

  setUp(() {
    mockAuth = MockFirebaseAuth();
    mockGoogleSignIn = MockGoogleSignIn();
    mockUserCredential = MockUserCredential();
    mockUser = MockUser();
    authService = AuthService(mockAuth, mockGoogleSignIn);
  });

  group('AuthService Email/Password Sign In', () {
    const testEmail = 'test@example.com';
    const testPassword = 'password123';

    test('returns UserCredential on successful sign in', () async {
      when(() => mockAuth.signInWithEmailAndPassword(
            email: testEmail,
            password: testPassword,
          )).thenAnswer((_) async => mockUserCredential);

      final result = await authService.signInWithEmailAndPassword(
        testEmail,
        testPassword,
      );

      expect(result, mockUserCredential);
      verify(() => mockAuth.signInWithEmailAndPassword(
            email: testEmail,
            password: testPassword,
          )).called(1);
    });

    test('throws error with user-friendly message on invalid email exception', () async {
      when(() => mockAuth.signInWithEmailAndPassword(
            email: testEmail,
            password: testPassword,
          )).thenThrow(FirebaseAuthException(code: 'invalid-email', message: 'The email address is badly formatted.'));

      expect(
        () => authService.signInWithEmailAndPassword(testEmail, testPassword),
        throwsA(isA<Exception>().having((e) => e.toString(), 'message', contains('The email address is badly formatted'))),
      );
    });

    test('throws error with user-friendly message on user not found exception', () async {
      when(() => mockAuth.signInWithEmailAndPassword(
            email: testEmail,
            password: testPassword,
          )).thenThrow(FirebaseAuthException(code: 'user-not-found'));

      expect(
        () => authService.signInWithEmailAndPassword(testEmail, testPassword),
        throwsA(isA<Exception>().having((e) => e.toString(), 'message', contains('No user found with this email'))),
      );
    });
  });

  group('AuthService Email/Password Registration', () {
    const testName = 'Test User';
    const testEmail = 'test@example.com';
    const testPassword = 'password123';

    test('returns UserCredential and updates profile name on success', () async {
      when(() => mockAuth.createUserWithEmailAndPassword(
            email: testEmail,
            password: testPassword,
          )).thenAnswer((_) async => mockUserCredential);
      when(() => mockUserCredential.user).thenReturn(mockUser);
      when(() => mockUser.updateDisplayName(testName)).thenAnswer((_) async => {});
      when(() => mockUser.reload()).thenAnswer((_) async => {});

      final result = await authService.registerWithEmailAndPassword(
        name: testName,
        email: testEmail,
        password: testPassword,
      );

      expect(result, mockUserCredential);
      verify(() => mockAuth.createUserWithEmailAndPassword(
            email: testEmail,
            password: testPassword,
          )).called(1);
      verify(() => mockUser.updateDisplayName(testName)).called(1);
    });

    test('throws error when email-already-in-use', () async {
      when(() => mockAuth.createUserWithEmailAndPassword(
            email: testEmail,
            password: testPassword,
          )).thenThrow(FirebaseAuthException(code: 'email-already-in-use'));

      expect(
        () => authService.registerWithEmailAndPassword(
          name: testName,
          email: testEmail,
          password: testPassword,
        ),
        throwsA(isA<Exception>().having((e) => e.toString(), 'message', contains('An account already exists for this email'))),
      );
    });
  });

  group('AuthService Sign Out', () {
    test('calls firebase and google signout successfully', () async {
      when(() => mockAuth.signOut()).thenAnswer((_) async => {});
      when(() => mockGoogleSignIn.signOut()).thenAnswer((_) async => null);

      await authService.signOut();

      verify(() => mockAuth.signOut()).called(1);
      verify(() => mockGoogleSignIn.signOut()).called(1);
    });
  });
}
