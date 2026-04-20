const TOKEN_KEY = "itf_token";
const USER_KEY = "itf_user";
const STORAGE_KEY = "itf_storage";

function getStorageByName(storageName) {
  return storageName === "session" ? window.sessionStorage : window.localStorage;
}

export function getPersistedStorageName() {
  return window.localStorage.getItem(STORAGE_KEY) || window.sessionStorage.getItem(STORAGE_KEY) || "local";
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY) || "";
}

export function getStoredUser() {
  const rawUser = window.localStorage.getItem(USER_KEY) || window.sessionStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    clearAuthStorage();
    return null;
  }
}

export function saveAuthStorage({ token, user, rememberUser = true }) {
  const activeStorage = getStorageByName(rememberUser ? "local" : "session");
  const inactiveStorage = getStorageByName(rememberUser ? "session" : "local");

  inactiveStorage.removeItem(TOKEN_KEY);
  inactiveStorage.removeItem(USER_KEY);
  inactiveStorage.removeItem(STORAGE_KEY);

  activeStorage.setItem(TOKEN_KEY, token);
  activeStorage.setItem(USER_KEY, JSON.stringify(user));
  activeStorage.setItem(STORAGE_KEY, rememberUser ? "local" : "session");
}

export function updateStoredUser(user) {
  const storageName = getPersistedStorageName();
  const activeStorage = getStorageByName(storageName);

  activeStorage.setItem(USER_KEY, JSON.stringify(user));
  activeStorage.setItem(STORAGE_KEY, storageName);
}

export function clearAuthStorage() {
  [window.localStorage, window.sessionStorage].forEach((storage) => {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
    storage.removeItem(STORAGE_KEY);
  });
}
