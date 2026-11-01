mergeInto(LibraryManager.library, {
  VolverAlAtlasWeb: function () {
    var parameters = new URLSearchParams(window.location.search);
    var destination = parameters.get('return') || new URL('../minijuegos#mundos', window.location.href).href;

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'termometro:return-to-worlds', destination: destination }, window.location.origin);
      return;
    }

    window.location.assign(destination);
  }
});
