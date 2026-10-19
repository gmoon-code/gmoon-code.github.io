/* Shared appearance preference for Moon Notes sites.
   One preference works across the portfolio and applications on the same origin. */
(function () {
  "use strict";
  var KEY = "moon-notes-appearance";
  var choices = ["system", "light", "dark"];
  var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function read() {
    try {
      var stored = window.localStorage.getItem(KEY);
      return choices.indexOf(stored) !== -1 ? stored : "system";
    } catch (e) {
      return "system";
    }
  }

  function set(value) {
    if (choices.indexOf(value) === -1) return;
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* Storage is optional. */ }
    document.documentElement.setAttribute("data-moon-preference", value);
    apply(value);
  }

  function apply(selected) {
    var value = selected || read();
    var resolved = value === "system" ? (media && media.matches ? "dark" : "light") : value;
    document.documentElement.setAttribute("data-moon-theme", resolved);
    document.documentElement.setAttribute("data-moon-preference", value);
    document.documentElement.style.colorScheme = resolved;
    var selects = document.querySelectorAll(".moon-appearance-select");
    for (var i = 0; i < selects.length; i++) selects[i].value = value;
  }

  function mount() {
    var header = document.querySelector(".topbar");
    if (!header || header.querySelector(".moon-appearance")) return;
    var holder = document.createElement("div");
    holder.className = "moon-appearance";
    var label = document.createElement("label");
    label.className = "moon-appearance-label";
    label.textContent = "Appearance";
    var select = document.createElement("select");
    select.className = "moon-appearance-select";
    select.setAttribute("aria-label", "Appearance theme");
    select.title = "Choose system, light, or dark appearance";
    var id = "moon-appearance-choice";
    select.id = id;
    label.htmlFor = id;
    choices.forEach(function (choice) {
      var option = document.createElement("option");
      option.value = choice;
      option.textContent = choice.charAt(0).toUpperCase() + choice.slice(1);
      select.appendChild(option);
    });
    select.value = read();
    select.addEventListener("change", function () { set(select.value); });
    holder.appendChild(label);
    holder.appendChild(select);
    var container = header.querySelector(".topbar-inner") || header;
    container.appendChild(holder);
  }

  function init() {
    mount();
    /* The Story Method replaces its header when navigating between views. */
    var root = document.getElementById("app");
    if (root && window.MutationObserver) {
      var observer = new MutationObserver(function () { mount(); });
      observer.observe(root, {childList: true, subtree: true});
    }
    if (media) {
      if (media.addEventListener) {
        media.addEventListener("change", function () { if (read() === "system") apply(); });
      } else if (media.addListener) {
        media.addListener(function () { if (read() === "system") apply(); });
      }
    }
    window.addEventListener("storage", function (e) { if (e.key === KEY) apply(); });
  }

  apply();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
