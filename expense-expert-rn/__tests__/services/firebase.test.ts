import { app, auth, db, firebaseConfig } from '../../src/config/firebase';

describe('Firebase Service Initialization', () => {
  it('initializes Firebase app with project credentials', () => {
    expect(app).toBeDefined();
    expect(app.options.projectId).toBe('expense-expert-d155a');
    expect(firebaseConfig.projectId).toBe('expense-expert-d155a');
  });

  it('initializes Auth service instance', () => {
    expect(auth).toBeDefined();
    expect(typeof auth.onAuthStateChanged).toBe('function');
  });

  it('initializes Firestore database instance', () => {
    expect(db).toBeDefined();
    expect(db.type).toBe('firestore');
  });
});
