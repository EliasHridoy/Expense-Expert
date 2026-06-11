export const environment = {
  production: false,
  firebase: {
    apiKey: import.meta.env['NG_APP_FIREBASE_API_KEY'] || 'YOUR_API_KEY',
    authDomain: import.meta.env['NG_APP_FIREBASE_AUTH_DOMAIN'] || "YOUR_PROJECT.firebaseapp.com",
    projectId: import.meta.env['NG_APP_FIREBASE_PROJECT_ID'] || "YOUR_PROJECT_ID",
    storageBucket: import.meta.env['NG_APP_FIREBASE_STORAGE_BUCKET'] || "YOUR_PROJECT.appspot.com",
    messagingSenderId: import.meta.env['NG_APP_FIREBASE_MESSAGING_SENDER_ID'] || "YOUR_SENDER_ID",
    appId: import.meta.env['NG_APP_FIREBASE_APP_ID'] || "YOUR_APP_ID",
    measurementId: import.meta.env['NG_APP_FIREBASE_MEASUREMENT_ID'] || "YOUR_MEASUREMENT_ID"
  },
};
