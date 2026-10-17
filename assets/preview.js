// Plays the app preview. Always shown; if autoplay is blocked (reduced motion,
// iOS Low Power Mode, data saver) a tap-to-play button appears.
(function () {
  var fig = document.querySelector(".pv-fig");
  if (!fig) return;
  var v = fig.querySelector("video"), btn = fig.querySelector(".pv-play");
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  v.muted = true; v.defaultMuted = true; v.playsInline = true;
  v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
  function showBtn() { fig.classList.add("paused"); }
  function hideBtn() { fig.classList.remove("paused"); }
  function play() {
    v.muted = true;
    var p;
    try { p = v.play(); } catch (e) { showBtn(); return; }
    if (p && p.then) p.then(hideBtn, showBtn);
  }
  if (reduce) { v.removeAttribute("autoplay"); v.autoplay = false; v.pause(); showBtn(); }
  else {
    play();
    // Some browsers neither play nor reject (Low Power Mode): check after a moment.
    setTimeout(function () { if (v.paused) showBtn(); }, 2500);
  }
  btn.addEventListener("click", play);
  fig.addEventListener("click", function (e) { if (e.target === v && v.paused) play(); });
  v.addEventListener("pause", function () { if (!v.ended) showBtn(); });
  v.addEventListener("playing", hideBtn);
})();
