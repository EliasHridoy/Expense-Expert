import { Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: typeof AsyncStorage): Persistence;
}
