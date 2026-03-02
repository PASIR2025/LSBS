/* Pasir Theme v1 - tema global para todas las páginas */
(function(){
  const KEY = "pasir-theme";

  function setMetaThemeColor(theme){
    const color = (theme === "dark") ? "#0b1220" : "#f3f4f6";
    const meta = document.getElementById("theme-color-meta") || document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
  }

  function applyTheme(theme){
    const t = (theme === "dark") ? "dark" : "light";
    document.body.setAttribute("data-theme", t);
    localStorage.setItem(KEY, t);
    setMetaThemeColor(t);

    const icon = document.getElementById("theme-icon");
    const label = document.getElementById("theme-label");
    if (icon) icon.textContent = (t === "dark") ? "🌙" : "☀️";
    if (label) label.textContent = (t === "dark") ? "Modo oscuro" : "Modo claro";
  }

  function init(){
    if (!document.body) return;
    const saved = localStorage.getItem(KEY);
    applyTheme(saved === "dark" ? "dark" : "light");

    const btn = document.getElementById("theme-toggle");
    if (btn && !btn.__pasirBound){
      btn.__pasirBound = true;
      btn.addEventListener("click", () => {
        const cur = document.body.getAttribute("data-theme");
        applyTheme(cur === "dark" ? "light" : "dark");
      });
    }
  }

  window.PasirTheme = { applyTheme };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
