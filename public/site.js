function changeThemeBtn() {
  document.getElementById("dropdown-list").classList.toggle("show");
}

function changeTheme(theme) {
  switch(theme) {
    case "original-theme":
    default:
      document.body.setAttribute("theme", "original-theme");
  }
}

window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      let openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
}
