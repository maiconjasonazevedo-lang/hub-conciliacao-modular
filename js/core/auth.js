(function() {
  function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const form = loginScreen ? loginScreen.querySelector('.login-form') : null;
    const userInput = loginScreen ? loginScreen.querySelector('#login-user') : null;
    const passInput = loginScreen ? loginScreen.querySelector('#login-pass') : null;
    const errorBox = loginScreen ? loginScreen.querySelector('#login-error') : null;
    const signupButton = loginScreen ? loginScreen.querySelector('#open-signup') : null;
    const hubManagementButton = document.getElementById('open-user-management-hub');
    const logoutButton = document.getElementById('logout-button');

    if (form && userInput && passInput && errorBox) {
      form.addEventListener('submit', event => {
        event.preventDefault();
        errorBox.textContent = '';

        const user = userInput.value.trim();
        const pass = passInput.value;

        if (UserStorageManager.validateCredentials(user, pass)) {
          UserStorageManager.setCurrentUser(user);
          loginSuccess();
        } else {
          errorBox.textContent = 'Usuário ou senha inválidos.';
        }
      });

      if (signupButton) {
        signupButton.addEventListener('click', event => {
          event.preventDefault();
          openSignupForm();
        });
      }
    }

    if (hubManagementButton) {
      hubManagementButton.addEventListener('click', event => {
        event.preventDefault();
        openUserManagement();
      });
    }

    if (logoutButton) {
      logoutButton.addEventListener('click', event => {
        event.preventDefault();
        logout();
      });
    }
  }

  function initUserManagement() {
    const managementScreen = document.getElementById('user-management-screen');
    if (!managementScreen) return;

    const form = managementScreen.querySelector('#user-add-form');
    const usernameInput = managementScreen.querySelector('#new-user');
    const passwordInput = managementScreen.querySelector('#new-pass');
    const roleInput = managementScreen.querySelector('#new-role');
    const errorBox = managementScreen.querySelector('#user-add-error');
    const listContainer = managementScreen.querySelector('#user-list');
    const closeButton = managementScreen.querySelector('#close-user-management');

    if (!form || !usernameInput || !passwordInput || !roleInput || !errorBox || !listContainer || !closeButton) {
      return;
    }

    function renderUsers() {
      const currentUserSession = UserStorageManager.getCurrentUser();
      const users = UserStorageManager.getUsers();
      listContainer.innerHTML = users.map(user => `
        <div class="user-list-item">
          <div style="display:flex;align-items:center;gap:10px;">
            <strong>${user.username}</strong>
            <span class="user-role-label">${user.role || 'usuário'}</span>
          </div>
          <button
            type="button"
            class="user-remove-btn"
            data-user="${user.username}"
            ${currentUserSession && currentUserSession.username === user.username ? 'disabled' : ''}
          >Remover</button>
        </div>
      `).join('');
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      errorBox.textContent = '';

      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      const role = roleInput.value || 'user';

      if (!UserStorageManager.addUser(username, password, role)) {
        errorBox.textContent = 'Não foi possível adicionar o usuário. Nome em uso ou inválido.';
        return;
      }

      usernameInput.value = '';
      passwordInput.value = '';
      roleInput.value = 'user';
      renderUsers();
    });

    listContainer.addEventListener('click', event => {
      const button = event.target.closest('.user-remove-btn');
      if (!button) return;
      const username = button.getAttribute('data-user');
      if (!username) return;

      UserStorageManager.removeUser(username);
      renderUsers();
    });

    closeButton.addEventListener('click', () => {
      closeUserManagement();
    });

    renderUsers();
  }

  function loginSuccess() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('hub-screen').style.display = 'flex';
    renderHubUserState(UserStorageManager.getCurrentUser());
  }

  function logout() {
    UserStorageManager.clearCurrentUser();
    closeUserManagement();
    const hubPanel = document.getElementById('hub-user-panel');
    const hubManagementButton = document.getElementById('open-user-management-hub');

    if (hubPanel) {
      hubPanel.style.display = 'none';
    }
    if (hubManagementButton) {
      hubManagementButton.style.display = 'none';
    }

    document.getElementById('hub-screen').style.display = 'none';

    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.style.display = 'flex';
    } else {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = '<login-screen id="login-screen"></login-screen>';
      const newLoginScreen = wrapper.firstElementChild;
      document.body.insertBefore(newLoginScreen, document.body.firstChild);
      if (window.customElements && customElements.whenDefined) {
        customElements.whenDefined('login-screen').then(initAuth).catch(() => initAuth());
      } else {
        initAuth();
      }
    }
  }

  function renderHubUserState(session) {
    const hubPanel = document.getElementById('hub-user-panel');
    const hubName = document.getElementById('hub-user-name');
    const hubRole = document.getElementById('hub-user-role');
    const hubManagementButton = document.getElementById('open-user-management-hub');

    if (!hubPanel || !hubName || !hubRole) {
      return;
    }

    if (!session || !session.username) {
      hubPanel.style.display = 'none';
      if (hubManagementButton) {
        hubManagementButton.style.display = 'none';
      }
      return;
    }

    hubName.textContent = session.username;
    hubRole.textContent = session.role || 'usuário';
    hubPanel.style.display = 'flex';

    if (hubManagementButton) {
      hubManagementButton.style.display = session.role === 'admin' ? 'block' : 'none';
    }
  }

  function setupLogin() {
    UserStorageManager.ensureDefaultUsers();

    const currentUser = UserStorageManager.hydrateCurrentUserSession();
    const hasSavedUser = currentUser && UserStorageManager.getUsers().some(user => user.username === currentUser.username);
    if (hasSavedUser) {
      document.getElementById('hub-screen').style.display = 'flex';
      renderHubUserState(currentUser);
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<login-screen id="login-screen"></login-screen>';
    const loginScreen = wrapper.firstElementChild;
    document.body.insertBefore(loginScreen, document.body.firstChild);
    document.getElementById('hub-screen').style.display = 'none';
  }

  function openUserManagement() {
    const currentSession = UserStorageManager.getCurrentUser();
    if (!currentSession || currentSession.role !== 'admin') {
      return;
    }

    if (document.getElementById('user-management-screen')) {
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = '<user-management-screen id="user-management-screen"></user-management-screen>';
    const managementScreen = wrapper.firstElementChild;
    document.body.appendChild(managementScreen);
    initUserManagement();
  }

  function openSignupForm() {
    if (document.getElementById('signup-screen')) {
      return;
    }

    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.style.display = 'none';
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <div class="login-screen signup-screen" id="signup-screen" style="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.14);padding:40px 20px;">
        <div class="login-card" style="max-width:420px;margin:0 auto;">
          <div class="login-brand">
            <div class="login-title">Criar <span>Usuário</span></div>
            <div class="login-subtitle">Cadastre uma conta com perfil usuário.</div>
          </div>
          <form id="signup-form" class="login-form" autocomplete="off">
            <label class="login-label" for="signup-user">Usuário</label>
            <input id="signup-user" class="fi" type="text" autocomplete="username" placeholder="usuario" required>
            <label class="login-label" for="signup-pass">Senha</label>
            <input id="signup-pass" class="fi" type="password" autocomplete="new-password" placeholder="senha" required>
            <button type="submit" class="pbtn2">Criar usuário</button>
            <div id="signup-error" class="login-error" role="alert" aria-live="assertive"></div>
            <div id="signup-success" class="login-info"></div>
          </form>
          <button type="button" class="pbtn2" id="close-signup" style="margin-top:16px;">Fechar</button>
        </div>
      </div>
    `;
    const signupScreen = wrapper.firstElementChild;
    document.body.appendChild(signupScreen);

    const signupForm = signupScreen.querySelector('#signup-form');
    const signupUser = signupScreen.querySelector('#signup-user');
    const signupPass = signupScreen.querySelector('#signup-pass');
    const signupError = signupScreen.querySelector('#signup-error');
    const signupSuccess = signupScreen.querySelector('#signup-success');
    const closeBtn = signupScreen.querySelector('#close-signup');

    if (!signupForm || !signupUser || !signupPass || !signupError || !signupSuccess || !closeBtn) {
      return;
    }

    signupForm.addEventListener('submit', event => {
      event.preventDefault();
      signupError.textContent = '';
      signupSuccess.textContent = '';

      const username = signupUser.value.trim();
      const password = signupPass.value;

      if (!UserStorageManager.addUser(username, password, 'user')) {
        signupError.textContent = 'Não foi possível criar o usuário. Nome em uso ou inválido.';
        return;
      }

      signupUser.value = '';
      signupPass.value = '';
      signupSuccess.textContent = 'Usuário criado com perfil usuário. Agora faça login.';
    });

    closeBtn.addEventListener('click', () => {
      closeSignupForm();
    });
  }

  function closeSignupForm() {
    const signupScreen = document.getElementById('signup-screen');
    if (signupScreen) {
      signupScreen.parentElement.removeChild(signupScreen);
    }

    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.style.display = 'flex';
    }
  }

  function closeUserManagement() {
    const managementScreen = document.getElementById('user-management-screen');
    if (managementScreen) {
      managementScreen.parentElement.removeChild(managementScreen);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    UserStorageManager.ensureDefaultUsers();
    setupLogin();

    if (window.customElements && customElements.whenDefined) {
      Promise.all([
        customElements.whenDefined('login-screen'),
        customElements.whenDefined('user-management-screen'),
      ]).then(() => {
        initAuth();
      }).catch(() => {
        initAuth();
      });
    } else {
      initAuth();
    }
  });
})();
