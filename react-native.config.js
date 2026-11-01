module.exports = {
  project: {
    ios: {},
    android: {},
  },
  // Firebase Cloud Messaging is Android-only for now; iOS keeps OneSignal, so don't link the pods there.
  dependencies: {
    '@react-native-firebase/app': { platforms: { ios: null } },
    '@react-native-firebase/messaging': { platforms: { ios: null } },
  },
  assets: ['./src/assets/fonts/'],
};
