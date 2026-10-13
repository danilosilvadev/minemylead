(function () {
  var ua = navigator.userAgent || "";
  var platform = navigator.platform || "";
  var touch = navigator.maxTouchPoints || 0;
  var id = "";
  if (/iPhone|iPad|iPod/i.test(ua) || (platform === "MacIntel" && touch > 1)) id = "ios";
  else if (/Android/i.test(ua)) id = "android";
  else if (/Windows/i.test(ua)) id = "windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) id = "macos";
  else if (/Linux/i.test(ua)) id = "linux";
  if (!id) return;
  var card = document.querySelector('[data-platform="' + id + '"]');
  if (!card) return;
  card.classList.add("is-yours");
  var list = card.parentNode;
  if (list && list.firstElementChild !== card) list.insertBefore(card, list.firstElementChild);
})();
