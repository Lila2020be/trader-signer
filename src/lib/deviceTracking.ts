import { v4 as uuidv4 } from 'uuid';

export const getOrCreateDeviceId = (): string => {
  let deviceId = localStorage.getItem('tradingsignals_device_id');
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('tradingsignals_device_id', deviceId);
  }
  return deviceId;
};

export const getDeviceInfo = (): string => {
  const ua = navigator.userAgent;
  return ua.length > 200 ? ua.substring(0, 200) : ua;
};
