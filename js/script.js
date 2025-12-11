// JS можно будет использовать позже для интерактива (поиск, меню и т.д.)
    
/*    fetch("../../nav.html")
      .then(res => res.text())
      .then(html => {
        document.getElementById("nav").innerHTML = html;
        const links = document.querySelectorAll("nav a");
        const currentPath = window.location.pathname;

      links.forEach(link => {
        if (currentPath.endsWith(link.getAttribute("href"))) {
          link.classList.add("underline", "scale-105");
        }
        });
      })
      .catch(err => console.error("Ошибка загрузки шапки:", err));*/

async function loadNav() {
  fetch("../../nav.html")
      .then(res => res.text())
      .then(html => {
        document.getElementById("nav").innerHTML = html;
        const links = document.querySelectorAll("nav a");
        const currentPath = window.location.pathname;

      links.forEach(link => {
        if (currentPath.endsWith(link.getAttribute("href"))) {
          link.classList.add("underline", "scale-105");
        }
        });
      })
      .catch(err => console.error("Ошибка загрузки шапки:", err));

  console.log("✅ nav.html подгружен");
  // Сообщаем всем скриптам, что шапка готова
  document.dispatchEvent(new Event("nav-loaded"));
}
document.addEventListener("DOMContentLoaded", loadNav)