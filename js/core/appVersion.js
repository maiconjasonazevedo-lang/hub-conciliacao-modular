(function(){
  const APP_VERSION = {
    version: '3.1.0',
    build: '449df58',
    buildDate: '2026-08-03',
    label: 'Hub Conciliação Modular',
    commitMessage: 'feat: conclui integracao settlement com deduplicacao e validacao de conciliacao amazon'
  };

  if (typeof window !== 'undefined') {
    window.APP_VERSION = APP_VERSION;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = APP_VERSION;
  }
})();
