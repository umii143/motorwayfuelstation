import localforage from 'localforage';

export async function safeGetItem(key: string): Promise<string | null> {
  try {
    const val = await localforage.getItem<string>(key);
    if (val !== null) return val;
  } catch (e) {
    console.warn(`[coreStorage] localforage.getItem failed for ${key}`, e);
  }
  
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch (e) {}
  
  return null;
}

export async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await localforage.setItem(key, value);
  } catch (e) {
    console.warn(`[coreStorage] localforage.setItem failed for ${key}`, e);
  }
  
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (e) {}
}
