// theme.js — Tema global Pasir (Light/Dark) sin tocar tu lógica
(function(){
  const KEY = "pasir-theme";

  function setTheme(theme){
    document.body.setAttribute("data-theme", theme);
    const dark = theme === "dark";

    const icon = document.getElementById("theme-icon");
    const label = document.getElementById("theme-label");
    if (icon) icon.textContent = dark ? "🌙" : "☀️";
    if (label) label.textContent = dark ? "Modo oscuro" : "Modo claro";

    const meta = document.getElementById("theme-color-meta") || document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0b1220" : "#f2f7ff");

    try{ localStorage.setItem(KEY, theme); }catch(e){}
  }

  function init(){
    let saved = null;
    try{ saved = localStorage.getItem(KEY); }catch(e){}
    setTheme(saved === "dark" ? "dark" : "light");

    const btn = document.getElementById("theme-toggle");
    if (btn && !btn.__pasirBound){
      btn.__pasirBound = true;
      btn.addEventListener("click", (e)=>{
        e.preventDefault();
        const cur = document.body.getAttribute("data-theme") || "light";
        setTheme(cur === "dark" ? "light" : "dark");
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once:true});
  } else {
    init();
  }
})();
