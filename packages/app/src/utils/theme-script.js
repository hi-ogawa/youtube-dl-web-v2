/* <!-- */

// scripts injected in head

/**
 * @returns {boolean}
 */
function __getTheme() {
  return window.localStorage.getItem("theme");
}

/**
 * @param {string} theme
 */
function __setTheme(theme) {
  window.localStorage.setItem("theme", theme);
  __applyTheme(theme);
}

/**
 * @param {string} theme
 */
function __applyTheme(theme) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

__applyTheme(__getTheme());

/* --> */
