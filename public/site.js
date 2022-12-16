function changeThemeBtn() {
  document.getElementById("dropdown-list").classList.toggle("show");
}

function changeTheme(theme) {
  switch (theme) {
    case "github-dark":
      document.body.setAttribute("theme", "github-dark");
      localStorage.setItem("theme", "github-dark");
      break;
    case "dracula":
      document.body.setAttribute("theme", "dracula");
      localStorage.setItem("theme", "dracula");
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

// Copy string from input field
function copyToClipboard(triggerElement) {
  const target = document.querySelector(".copy-to-clipboard-input-js");

  if (target) {
    navigator.clipboard.writeText(target.value);

    if (triggerElement) {
      // Store original value before manipulating
      const label = triggerElement.innerText;

      triggerElement.innerText = "Copied!";

      // Reset to original button text after 3s
      setTimeout(() => {
        triggerElement.innerText = label;
      }, 3000);
    }
  }
}

window.onclick = function (event) {
  if (!event.target.matches(".dropbtn")) {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      let openDropdown = dropdowns[i];
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};

window.onload = function (event) {
  if (localStorage.getItem("theme")) {
    // If a theme has been set or saved.
    changeTheme(localStorage.getItem("theme"));
  }

  // Check to see if we are on the User Account Page
  if (window.location.href.startsWith("https://web.pulsar-edit.dev/users")) {
  //if (window.location.href.indexOf("/users")) {
    // This should work locally in dev and on public, as long as the slug "users"
    // is never reused.
    // But now that we know we are on the user page, lets start requesting their user data
    userAccountActions();
  }

  const copyToClipboardButton = document.querySelector(
    ".copy-to-clipboard-button-js"
  );

  if (copyToClipboardButton) {
    copyToClipboardButton.addEventListener("click", (event) => {
      event.preventDefault();

      // We pass the event.target to the handler, we will
      // use this to change the button label to 'copied'
      copyToClipboard(event.target);
    });
  }
};

function userAccountActions() {
  // First lets see if they have a token in their request
  // This likely means a first time user or they are updating their user details
  const urlParams = new URLSearchParams(window.location.search);
  const params = Object.fromEntries(urlParams.entries());

  let token = params.token;

  if (typeof token === undefined || !token) {
    // The user expects to already be logged in. Do they have data saved locally?
    userAccountLocal();
  } else {
    // The user needs to access the API to retreive user details. Ignore any local data.
    userAccountAPI(token);
  }
}

function userAccountLocal() {
  if (localStorage.getItem("user")) {
    let user = localStorage.getItem("user");

    user = JSON.parse(user);
    modifyUserPage(user);

    // Now we have a user matching the object available in userAccountAPI
  } else {
    // They haven't given us any query parameters, but don't have any local data either
    // Lets redirect to the sign in page.
    window.location.href = "https://web.pulsar-edit.dev/login";
  }
}

function userAccountAPI(token) {
  fetch("https://api.pulsar-edit.dev/api/users", {
    method: "GET",
    headers: {
      'Authorization': token,
      'Access-Control-Allow-Credentials': true
    },
    credentials: 'include'
  })
    .then((response) => {
      if (response.ok) {
        return response.json();
      }

      // Handle exception
      console.log("Response:", response);
    })
    .then((data) => {
      // Now we should have a data object matching the below.
      // data.username
      // data.avatar
      // data.created_at
      // data.data
      // data.node_id
      // data.token
      // data.packages

      // Now with our user we want to modify the page, and save the user to local storage.
      modifyUserPage(data);

      localStorage.setItem("user", JSON.stringify(data));
    })
    .catch((err) => {
      // Handle error
      console.log("error", err);
    });
}

function modifyUserPage(user) {
  // This expects to be handed a proper user object.
  let img = document.getElementById("user-account-avatar");
  let username = document.getElementById("user-info-block-name").childNodes[0];
  let userhandle = document.getElementById("user-info-block-handle");
  let accountcreated = document.getElementById("account-created");
  let tokenBox = document.getElementById("api-token");

  // Modify Image
  img.src = user.avatar;
  img.alt = user.username;

  // Modify User Name Details
  username.textContent = user.username;
  userhandle.textContent = `@${user.username}`; // We may want to look at removing this.

  // Modify Creation Date
  accountcreated.textContent = `Account Created: ${user.created_at}`;

  // Modify Token
  tokenBox.value = user.token;
}
