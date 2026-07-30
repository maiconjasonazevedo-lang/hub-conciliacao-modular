(function() {
  const USERS_KEY = 'HUB_USER_ACCOUNTS';
  const USER_SESSION_KEY = 'HUB_USER_SESSION';
  const DEFAULT_USERS = [{ username: 'admin', password: 'admin', role: 'admin' }];

  function readUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function ensureDefaultUsers() {
    const users = readUsers();
    if (!users.length) {
      saveUsers(DEFAULT_USERS);
      return DEFAULT_USERS.slice();
    }
    return users;
  }

  function getUsers() {
    return readUsers();
  }

  function addUser(username, password, role = 'user') {
    const normalized = String(username || '').trim();
    const normalizedRole = role === 'admin' ? 'admin' : 'user';
    if (!normalized || !password) {
      return false;
    }

    const users = getUsers();
    if (users.some(user => user.username === normalized)) {
      return false;
    }

    users.push({ username: normalized, password, role: normalizedRole });
    saveUsers(users);
    return true;
  }

  function removeUser(username) {
    const users = getUsers();
    if (users.length <= 1) {
      return false;
    }

    const next = users.filter(user => user.username !== username);
    if (next.length === users.length) {
      return false;
    }

    const adminCount = next.filter(user => user.role === 'admin').length;
    if (adminCount === 0) {
      return false;
    }

    saveUsers(next);
    return true;
  }

  function validateCredentials(username, password) {
    const normalized = String(username || '').trim();
    return getUsers().some(user => user.username === normalized && user.password === password);
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(USER_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function setCurrentUser(username) {
    const normalized = String(username || '').trim();
    if (!normalized) {
      return;
    }

    const user = getUsers().find(item => item.username === normalized);
    const payload = {
      username: normalized,
      role: user && user.role ? user.role : 'user',
      loggedAt: new Date().toISOString(),
    };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(payload));
  }

  function hydrateCurrentUserSession() {
    const current = getCurrentUser();
    if (!current || !current.username) {
      return null;
    }

    const user = getUsers().find(item => item.username === current.username);
    if (!user) {
      clearCurrentUser();
      return null;
    }

    if (!current.role || current.role !== user.role) {
      setCurrentUser(current.username);
      return getCurrentUser();
    }

    return current;
  }

  function clearCurrentUser() {
    localStorage.removeItem(USER_SESSION_KEY);
  }

  window.UserStorageManager = {
    ensureDefaultUsers,
    getUsers,
    addUser,
    removeUser,
    validateCredentials,
    getCurrentUser,
    hydrateCurrentUserSession,
    setCurrentUser,
    clearCurrentUser,
  };
})();
