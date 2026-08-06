export function getDeviceId(): string {
  const STORAGE_KEY = 'dino_device_id';
  const storage = globalThis.sessionStorage;
  let deviceId = storage?.getItem(STORAGE_KEY);

  if (!deviceId) {
    deviceId = 'device-' + crypto.randomUUID();
    storage?.setItem(STORAGE_KEY, deviceId);
  }

  return deviceId;
}