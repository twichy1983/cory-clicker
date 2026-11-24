// Plain web version: saves go to localStorage and portal events do nothing.
export const webPlatform = {
  async init() {},
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  loadingStart() {},
  loadingStop() {},
  gameplayStart() {},
  gameplayStop() {},
  happytime() {},
};
