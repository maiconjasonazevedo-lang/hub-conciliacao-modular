(function() {
  class LoginScreen extends HTMLElement {
    constructor() {
      super();
      const container = document.createElement('div');
      container.className = 'login-card';
      container.innerHTML = `
        <div class="login-brand">
          <div class="login-title">Conciliação <span>Marketplace</span></div>
          <div class="login-subtitle">Acesse o Hub antes de iniciar a conciliação</div>
        </div>
        <form class="login-form" autocomplete="off">
          <label class="login-label" for="login-user">Usuário</label>
          <input id="login-user" class="fi" type="text" autocomplete="username" placeholder="usuario" required>
          <label class="login-label" for="login-pass">Senha</label>
          <input id="login-pass" class="fi" type="password" autocomplete="current-password" placeholder="senha" required>
          <button type="submit" class="pbtn2" id="login-submit">Entrar</button>
          <div class="login-info">Use uma conta cadastrada no gerenciamento de usuários.</div>
          <div id="login-error" class="login-error" role="alert" aria-live="assertive"></div>
        </form>
        <button type="button" id="open-signup" class="pbtn2 login-secondary-button">Criar usuário</button>
      `;
      this.className = 'login-screen';
      this.appendChild(container);
    }
  }

  if (!customElements.get('login-screen')) {
    customElements.define('login-screen', LoginScreen);
  }
})();
