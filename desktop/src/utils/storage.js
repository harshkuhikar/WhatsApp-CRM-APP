/**
 * Storage utility that works in both Electron and Browser
 * Falls back to localStorage when Electron APIs are not available
 */

const isElectron = () => {
  return typeof window !== 'undefined' && window.electron !== undefined;
};

export const storage = {
  async get(key) {
    if (isElectron()) {
      return await window.electron.storeGet(key);
    } else {
      // Browser fallback - use localStorage
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    }
  },

  async set(key, value) {
    if (isElectron()) {
      return await window.electron.storeSet(key, value);
    } else {
      // Browser fallback - use localStorage
      localStorage.setItem(key, JSON.stringify(value));
    }
  },

  async delete(key) {
    if (isElectron()) {
      return await window.electron.storeDelete(key);
    } else {
      // Browser fallback - use localStorage
      localStorage.removeItem(key);
    }
  },

  async getHWID() {
    if (isElectron()) {
      return await window.electron.getHWID();
    } else {
      // Browser fallback - generate a unique ID based on browser fingerprint
      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width,
        screen.height,
        new Date().getTimezoneOffset()
      ].join('|');
      
      // Simple hash function
      let hash = 0;
      for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      
      return `BROWSER-${Math.abs(hash).toString(16)}`;
    }
  }
};

export default storage;
