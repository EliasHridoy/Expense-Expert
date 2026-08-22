/* eslint-disable no-undef */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native/Libraries/Animated/animations/TimingAnimation', () => {
  return class MockTimingAnimation {
    start(fromValue, onUpdate, onEnd) {
      onUpdate(1);
      if (onEnd) onEnd({ finished: true });
    }
    stop() {}
  };
});
