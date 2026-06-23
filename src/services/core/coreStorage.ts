import localforage from 'localforage';

export async function safeGetItem(key: string): Promise<string | null> {
  try {
    const val = await localforage.getItem<string>(key);
    if (val !== null) return val;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[coreStorage] localforage.getItem failed for ${key}`, e);
  }
  
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) { /* ignore */ }
  
  return null;
}

export async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await localforage.setItem(key, value);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[coreStorage] localforage.setItem failed for ${key}`, e);
  }
  
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
   
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) { /* ignore */ }
}
