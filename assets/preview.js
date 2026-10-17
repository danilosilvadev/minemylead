// Plays the app preview. The video is always shown; with reduced motion it waits for a click.
(function () {
  var fig = document.querySelector(".pv-fig");
  if (!fig) return;
  var v = fig.querySelector("video"), btn = fig.querySelector(".pv-play");
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  v.muted = true; v.defaultMuted = true; v.playsInline = true;
  function paused() { fig.classList.add("paused"); }
  function play() {
    var p = v.play();
    fig.classList.remove("paused");
    if (p && p.catch) p.catch(paused);
  }
  if (reduce) { v.removeAttribute("autoplay"); v.pause(); paused(); }
  else play();
  btn.addEventListener("click", play);
  v.addEventListener("pause", function () { if (!v.ended) paused(); });
  v.addEventListener("playing", function () { fig.classList.remove("paused"); });
})();
