import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  AuthService(this._auth, this._googleSignIn);

  final FirebaseAuth _auth;
  final GoogleSignIn _googleSignIn;

  /// Stream of Auth user changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  /// Get current user
  User? get currentUser => _auth.currentUser;

  /// Sign in with Email and Password
  Future<UserCredential> signInWithEmailAndPassword(
    String email,
    String password,
  ) async {
    try {
      return await _auth.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    } catch (e) {
      throw Exception('An unexpected authentication error occurred.');
    }
  }

  /// Register with Email, Password, and Name
  Future<UserCredential> registerWithEmailAndPassword({
    required String name,
    required String email,
    required String password,
  }) async {
    try {
      final credential = await _auth.createUserWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      
      // Update display name
      if (credential.user != null) {
        await credential.user!.updateDisplayName(name.trim());
        await credential.user!.reload();
      }
      
      return credential;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    } catch (e) {
      throw Exception('An unexpected registration error occurred.');
    }
  }

  /// Sign in with Google
  Future<UserCredential?> signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        // User cancelled the sign-in
        return null;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;

      final OAuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      return await _auth.signInWithCredential(credential);
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    } catch (e) {
      throw Exception('Google Sign-In failed.');
    }
  }

  /// Sign out
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      await _auth.signOut();
    } catch (e) {
      throw Exception('Failed to sign out.');
    }
  }

  /// Map Firebase Auth exceptions to user-friendly messages
  Exception _handleAuthException(FirebaseAuthException e) {
    return switch (e.code) {
      'invalid-email' => Exception('The email address is badly formatted.'),
      'user-disabled' => Exception('This user account has been disabled.'),
      'user-not-found' => Exception('No user found with this email.'),
      'wrong-password' => Exception('Wrong password provided.'),
      'email-already-in-use' => Exception('An account already exists for this email.'),
      'operation-not-allowed' => Exception('This auth operation is not allowed.'),
      'weak-password' => Exception('The password provided is too weak.'),
      'invalid-credential' => Exception('Invalid credentials provided.'),
      _ => Exception(e.message ?? 'Authentication failed.'),
    };
  }
}
