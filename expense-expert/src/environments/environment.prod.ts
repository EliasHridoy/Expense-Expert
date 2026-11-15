export const environment = {
  production: true,
  firebase: {
    apiKey: import.meta.env?.['NG_APP_FIREBASE_API_KEY'] || 'AIzaSyBoy87DRqSspwHhxsB6BKgVeDNcxJdXy-w',
    authDomain: import.meta.env?.['NG_APP_FIREBASE_AUTH_DOMAIN'] || 'expense-expert-d155a.firebaseapp.com',
    projectId: import.meta.env?.['NG_APP_FIREBASE_PROJECT_ID'] || 'expense-expert-d155a',
    storageBucket: import.meta.env?.['NG_APP_FIREBASE_STORAGE_BUCKET'] || 'expense-expert-d155a.firebasestorage.app',
    messagingSenderId: import.meta.env?.['NG_APP_FIREBASE_MESSAGING_SENDER_ID'] || '324719342364',
    appId: import.meta.env?.['NG_APP_FIREBASE_APP_ID'] || '1:324719342364:web:ebc95f68dc800dede140d9',
    measurementId: import.meta.env?.['NG_APP_FIREBASE_MEASUREMENT_ID'] || 'G-7FG0N551WW',
  },
};
