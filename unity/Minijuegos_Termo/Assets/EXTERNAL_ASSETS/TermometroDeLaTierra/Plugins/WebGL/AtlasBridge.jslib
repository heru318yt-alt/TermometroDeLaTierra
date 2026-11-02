mergeInto(LibraryManager.library, {
  AtlasReturnToSite: function () {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'termometro:backToAtlas' }, '*');
    }
  }
});
