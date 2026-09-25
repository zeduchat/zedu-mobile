import { PermissionsAndroid, Platform } from 'react-native';

export const requestCameraPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];

      if (Platform.Version >= 33) {
        permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
      } else {
        permissions.push(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        );
      }

      const grants = await PermissionsAndroid.requestMultiple(permissions);
      const cameraGranted =
        grants[PermissionsAndroid.PERMISSIONS.CAMERA] ===
        PermissionsAndroid.RESULTS.GRANTED;
      const storageGranted =
        Platform.Version >= 33
          ? grants[PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES] ===
            PermissionsAndroid.RESULTS.GRANTED
          : grants[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            grants[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] ===
              PermissionsAndroid.RESULTS.GRANTED;

      return cameraGranted && storageGranted;
    } catch (err) {
      console.warn('Camera permission request error:', err);
      return false;
    }
  }
  return true;
};

export const checkCameraPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const cameraGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (!cameraGranted) {
        return false;
      }

      if (Platform.Version >= 33) {
        const readImagesGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        );
        return readImagesGranted;
      }

      const writeGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      const readGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
      return writeGranted && readGranted;
    } catch (err) {
      console.warn('Camera permission check error:', err);
      return false;
    }
  }
  return true;
};

export const checkAudioPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      if (Platform.Version >= 33) {
        const recordGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        const readAudioGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        );
        return recordGranted && readAudioGranted;
      }

      const recordGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      );
      const writeGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      );
      const readGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      );
      return recordGranted && writeGranted && readGranted;
    } catch (err) {
      console.warn('Audio permission check error:', err);
      return false;
    }
  }
  return true;
};

export const checkAppPermissions = async () => {
  const cameraReady = await checkCameraPermissions();
  const audioReady = await checkAudioPermissions();
  return cameraReady && audioReady;
};

export const requestAppPermissions = async () => {
  const alreadyGranted = await checkAppPermissions();
  if (alreadyGranted) {
    return true;
  }

  const cameraGranted = await requestCameraPermissions();
  const audioGranted = await requestAudioPermissions();
  return cameraGranted && audioGranted;
};

export const requestAudioPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      // Logic for Android 13 (API 33) and above
      if (Platform.Version >= 33) {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO,
        ]);

        return (
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_MEDIA_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      }

      // Logic for Android 12 and below (As per your provided docs)
      const grants = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      return (
        grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        grants['android.permission.READ_EXTERNAL_STORAGE'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        grants['android.permission.RECORD_AUDIO'] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    } catch (err) {
      console.warn('Permission request error:', err);
      return false;
    }
  }
  return true; // iOS handles this via Info.plist automatically
};
