(function(){
  const APP_VERSION = {
    version: '3.1.3',
    build: 'b66bc41',
    buildDate: '2026-10-06',
    label: 'Hub Conciliação Modular',
    commitMessage: 'chore: configure GitHub Pages deployment'
  };

  if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_VERSION;
  }
})();
