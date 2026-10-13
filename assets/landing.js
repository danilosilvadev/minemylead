(function () {
  var reduce = document.documentElement.classList.contains("reduce") ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) document.documentElement.classList.add("reduce");

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  var stories = Array.prototype.slice.call(document.querySelectorAll("[data-story]"));

  function indexFor(root) {
    var steps = parseInt(root.getAttribute("data-steps"), 10) || 1;
    var total = root.offsetHeight - window.innerHeight;
    if (total <= 0) return 0;
    var p = clamp(-root.getBoundingClientRect().top / total, 0, 0.9999);
    return Math.min(steps - 1, Math.floor(p * steps));
  }

  function paintStory(root) {
    var idx = reduce ? "all" : String(indexFor(root));
    if (root.getAttribute("data-active") !== idx) root.setAttribute("data-active", idx);
    var tabs = root.querySelectorAll("[role='tab']");
    for (var i = 0; i < tabs.length; i++) {
      var on = reduce ? true : String(i) === idx;
      if (!reduce) {
        tabs[i].setAttribute("aria-selected", on ? "true" : "false");
        tabs[i].tabIndex = on ? 0 : -1;
      }
    }
    var panels = root.querySelectorAll("[role='tabpanel']");
    for (var j = 0; j < panels.length; j++) {
      var show = reduce || String(j) === idx;
      panels[j].setAttribute("aria-hidden", show ? "false" : "true");
    }
    var live = root.querySelector("[data-feat-live]");
    if (live && !reduce) {
      var current = null;
      for (var t = 0; t < tabs.length; t++) {
        if (tabs[t].getAttribute("aria-selected") === "true") current = tabs[t];
      }
      var desc = current && current.querySelector("p");
      if (desc && live.textContent !== desc.textContent) live.textContent = desc.textContent;
    }
  }

  function scrollToStep(root, i) {
    var steps = parseInt(root.getAttribute("data-steps"), 10) || 1;
    var total = Math.max(0, root.offsetHeight - window.innerHeight);
    var y = root.offsetTop + total * ((i + 0.45) / steps);
    window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }

  stories.forEach(function (root) {
    var tabs = root.querySelectorAll("[role='tab']");
    Array.prototype.forEach.call(tabs, function (tab, i) {
      tab.addEventListener("click", function () {
        if (reduce) {
          root.setAttribute("data-active", "all");
          var panels = root.querySelectorAll("[role='tabpanel']");
          if (panels[i]) panels[i].scrollIntoView({ behavior: "auto", block: "center" });
          return;
        }
        scrollToStep(root, i);
      });
    });
    if (tabs.length) {
      var list = root.querySelector("[role='tablist']");
      if (list) {
        list.addEventListener("keydown", function (e) {
          var current = Array.prototype.indexOf.call(tabs, document.activeElement);
          if (current < 0) return;
          var next = current;
          if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (current + 1) % tabs.length;
          else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (current - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") next = 0;
          else if (e.key === "End") next = tabs.length - 1;
          else return;
          e.preventDefault();
          tabs[next].focus();
          tabs[next].click();
        });
      }
    }
  });

  var stage = document.querySelector("[data-theme-stage]");
  Array.prototype.forEach.call(document.querySelectorAll("[data-theme]"), function (btn) {
    btn.addEventListener("click", function () {
      if (!stage) return;
      var mode = btn.getAttribute("data-theme");
      var current = stage.getAttribute("data-focus");
      var next = current === mode ? "" : mode;
      if (next) stage.setAttribute("data-focus", next);
      else stage.removeAttribute("data-focus");
      Array.prototype.forEach.call(document.querySelectorAll("[data-theme]"), function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-theme") === next ? "true" : "false");
      });
    });
  });

  function fitApps() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-fit]"), function (frame) {
      var app = frame.querySelector(".app");
      if (!app) return;
      var s = frame.clientWidth / 1280;
      if (!s) return;
      app.style.transform = "scale(" + s + ")";
    });
  }

  var nav = document.querySelector(".nav");
  function navTone() {
    if (!nav) return;
    var on = false;
    Array.prototype.forEach.call(document.querySelectorAll(".paper"), function (el) {
      var r = el.getBoundingClientRect();
      if (r.top <= 56 && r.bottom > 56) on = true;
    });
    nav.classList.toggle("on-light", on);
  }

  function paint() {
    stories.forEach(paintStory);
    navTone();
  }

  fitApps();
  paint();

  if (!reduce) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        paint();
      });
    }, { passive: true });
  } else {
    paint();
  }

  window.addEventListener("resize", function () {
    fitApps();
    paint();
  });
})();
