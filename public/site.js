function changeThemeBtn() {
  document.getElementById("dropdown-list").classList.toggle("show");
}

function changeTheme(theme) {
  switch(theme) {
    case "github-dark":
      document.body.setAttribute("theme", "github-dark");
      localStorage.setItem("theme", "github-dark");
      break;
    case "original-theme":
    default:
      document.body.setAttribute("theme", "original-theme");
      localStorage.setItem("theme", "original-theme");
      break;
  }
}

function loadStats() {
  if (timetable) {
    console.log(timetable);
  } else {
    console.error("No stats found!");
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

window.onload = function(event) {
  if (localStorage.getItem("theme")) {
    // If a theme has been set or saved.
    changeTheme(localStorage.getItem("theme"));
  }
};
