(function() {
  class UserManagementScreen extends HTMLElement {
    constructor() {
      super();
      const container = document.createElement('div');
      container.className = 'login-card user-management-card';
      container.innerHTML = `
        <div class="login-brand">
          <div class="login-title">Gerenciar <span>Usuários</span></div>
          <div class="login-subtitle">Adicione ou remova contas locais para acessar o Hub.</div>
        </div>
        <form id="user-add-form" class="login-form" autocomplete="off">
          <label class="login-label" for="new-user">Nome</label>
          <input id="new-user" class="fi" type="text" autocomplete="username" placeholder="usuario" required>
          <label class="login-label" for="new-pass">Senha</label>
          <input id="new-pass" class="fi" type="password" autocomplete="new-password" placeholder="senha" required>
          <label class="login-label" for="new-role">Perfil</label>
          <select id="new-role" class="fi">
            <option value="user">Usuário</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" class="pbtn2">Adicionar usuário</button>
          <div id="user-add-error" class="login-error" role="alert" aria-live="assertive"></div>
        </form>
        <div class="user-list-panel">
          <div class="login-subtitle">Usuários cadastrados</div>
          <div id="user-list" class="user-list"></div>
        </div>
        <div class="user-management-actions">
          <button type="button" class="pbtn2" id="close-user-management">Fechar</button>
        </div>
      `;
      this.className = 'login-screen user-management-screen';
      this.appendChild(container);
    }
  }

  if (!customElements.get('user-management-screen')) {
    customElements.define('user-management-screen', UserManagementScreen);
  }
})();
