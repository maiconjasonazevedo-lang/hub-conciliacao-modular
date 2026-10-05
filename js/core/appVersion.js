(function(){
  const APP_VERSION = {
    version: '3.1.2',
    build: '97e13ff',
    buildDate: '2026-10-05',
    label: 'Hub Conciliação Modular',
    commitMessage: 'fix: reconcile Shopee DCC fees and item quantity'
  };

  if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_VERSION;
  }
})();
