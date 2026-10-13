(function () {
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.documentElement.classList.add("reduce");
    }
  } catch (e) {}
})();
