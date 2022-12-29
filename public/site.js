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

function toggleNavBtn() {
  document.querySelector('nav').classList.toggle('active');
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
  const dropdownList = document.getElementById("dropdown-list");
  if (!event.target.matches("button") && dropdownList.classList.contains('show')) {
    console.log('removing');
    dropdownList.classList.remove('show');
  }
};

window.onload = function (event) {
  if (localStorage.getItem("theme")) {
    // If a theme has been set or saved.
    changeTheme(localStorage.getItem("theme"));
  }

  // Add the header links if we are logged in
  if (isLoggedIn()) { modifyNavigation(); }

  // Check to see if we are on the User Account Page
  if (window.location.pathname === "/users") {
    // Now that we know we are on the user page, lets start requesting their user data
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

function isLoggedIn() {
  return !!localStorage.getItem("user");
}

function userAccountLocal() {
  if (isLoggedIn()) {
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
  img.style.backgroundImage = `url(${user.avatar})`;

  // Modify User Name Details
  username.textContent = user.username;
  userhandle.textContent = `@${user.username}`; // We may want to look at removing this.

  // Modify Creation Date
  accountcreated.textContent = `Account Created: ${new Date(user.created_at).toISOString().slice(0, 10)}`;

  // Modify Token
  tokenBox.value = user.token;
}

function modifyNavigation() {
  // Obtain references to the header
  const header = document.querySelector("header > nav");
  const headerLinks = document.querySelectorAll('header > nav > a');

  // Set the "log in" link to now be "log out"
  const loginLink = Array.from(headerLinks).find(i => i.href === `${document.location.origin}/login`);
  loginLink.innerHTML = 'Log Out';
  loginLink.href = '/logout';

  // Create a new button to go to their account
  const accountLink = document.createElement("a");
  accountLink.href = '/users';
  accountLink.innerHTML = 'My Account';

  // Insert the button before the "log out" button
  header.insertBefore(accountLink, loginLink);
}
