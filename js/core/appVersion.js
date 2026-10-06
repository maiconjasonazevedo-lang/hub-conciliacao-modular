(function(){
  const APP_VERSION = {
    version: '3.1.4',
    build: 'b3d252f0',
    buildDate: '2026-10-06',
    label: 'Hub Conciliação Modular',
    commitMessage: 'fix: corrige taxa por item Shopee'
  };

  if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_VERSION;
  }
})();
