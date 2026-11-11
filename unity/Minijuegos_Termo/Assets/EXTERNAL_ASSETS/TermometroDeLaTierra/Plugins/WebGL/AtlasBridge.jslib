mergeInto(LibraryManager.library, {
  AtlasReturnToSite: function () {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'termometro:backToAtlas' }, '*');
    }
  },
  ToggleSiteFullscreen: function () {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'termometro:toggle-fullscreen' }, '*');
      return;
    }
    if (document.fullscreenElement) {
      if (document.exitFullscreen) document.exitFullscreen();
    } else if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    }
  },
  AtlasReportMissionComplete: function (sceneName) {
    var name = UTF8ToString(sceneName);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'termometro:mission-complete', scene: name }, '*');
    }
  }
});
