(function(){
  const APP_VERSION = {
    version: '3.1.1',
    build: '565b1e2',
    buildDate: '2026-10-05',
    label: 'Hub Conciliação Modular',
    commitMessage: 'fix: remove apostrophes from Shopee DCC export'
  };

  if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_VERSION;
  }
})();
