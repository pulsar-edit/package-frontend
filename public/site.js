function changeThemeBtn() {
  document.getElementById("dropdown-list").classList.toggle("show");
}

function changeTheme(theme) {
  switch (theme) {
    case "github-dark":
      changeSyntax("github-dark-syntax");
      document.body.setAttribute("theme", "github-dark");
      localStorage.setItem("theme", "github-dark");
      break;
    case "dracula":
      changeSyntax("base16-dracula-syntax");
      document.body.setAttribute("theme", "dracula");
      localStorage.setItem("theme", "dracula");
      break;
    case "one-dark":
      changeSyntax("atom-one-dark-syntax");
      document.body.setAttribute("theme", "one-dark");
      localStorage.setItem("theme", "one-dark");
      break;
    case "original-theme":
    default:
      changeSyntax("atom-one-light-syntax");
      document.body.setAttribute("theme", "original-theme");
      localStorage.setItem("theme", "original-theme");
      break;
  }
}

function changeSyntax(syntax) {

  const syntaxList = {
    "github-dark-syntax": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/github-dark.min.css",
    "atom-one-dark-syntax": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/atom-one-dark.min.css",
    "atom-one-light-syntax": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/atom-one-light.min.css",
    "base16-dracula-syntax": "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/base16/dracula.min.css"
  };

  // Remove the previous syntax theme
  const oldSyntax = document.getElementById("syntax-theme");
  if (oldSyntax) {
    // In case the default was only previously set which has no syntax theme.
    oldSyntax.remove();
  }

  // Create the new syntax theme
  if (syntaxList[syntax]) {
    const syntaxLink = document.createElement("link");
    syntaxLink.setAttribute("rel", "stylesheet");
    syntaxLink.setAttribute("class", "codestyle");
    syntaxLink.setAttribute("id", "syntax-theme");
    syntaxLink.setAttribute("href", syntaxList[syntax]);

    document.head.appendChild(syntaxLink);
  }
}

function shareDropDown() {
  const list = document.getElementById("share-dropdown-list");
  const willBeShown = !list.classList.contains("show");
  list.classList.toggle("show");

  if (willBeShown) {
    // Position the share menu horizontally so that the arrow is directly below
    // the middle of the share button.
    let btn = document.querySelector("button.share-button");
    if (!btn) { return; }
    // Take the difference between the right edge of the body and the right
    // edge of the share button; then adjust for the widths of the share button
    // and the share menu.
    let bodyRect = document.body.getBoundingClientRect();
    let btnRect = btn.getBoundingClientRect();
    let menuRect = list.getBoundingClientRect();
    list.style.right = `${bodyRect.width - btnRect.right - (menuRect.width / 2) + (btnRect.width / 2)}px`;
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

// Agnostic Copy to Clipboard for all Share Btns
function copyToClipboardAgnostic(value, target) {
  if (value && target) {
    navigator.clipboard.writeText(value);
    const element = document.querySelector(`#${target} > span`);

    // Store original value before manipulating
    const label = element.innerText;
    element.innerText = "Copied!";
    // Reset to original button text after 3s
    setTimeout(() => {
      element.innerText = label;
    }, 3000);
  }
}

// Close the share menu if the user clicks outside of the share button or the
// share menu.
addEventListener('click', (e) => {
  const o = document.getElementById('share-dropdown-list');
  if (o && !e.target.closest('button.share-button, #share-dropdown-list')) {
    o.classList.remove('show');
  }
});

// Close the change-theme menu if the click is outside of the change-theme
// button. (We want the menu to close automatically when the user selects an
// option.)
addEventListener('click', (e) => {
  const t = document.getElementById('dropdown-list');
  if (!e.target.closest('button.change-theme')) {
    t.classList.remove('show');
  }
});

function setup (event) {
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

  const shareButton = document.querySelector('button.share-button');
  if (shareButton) {
    shareButton.addEventListener("click", shareDropDown);
  }

  const changeThemeButton = document.querySelector('button.change-theme');
  if (changeThemeButton) {
    changeThemeButton.addEventListener("click", changeThemeBtn);
  }

  const copyToClipboardButton = document.querySelector(
    ".copy-to-clipboard-button-js"
  );

  const dropdownList = document.getElementById("dropdown-list");
  dropdownList.addEventListener("click", (event) => {
    let button = event.target.closest("button[data-theme-name]");
    if (!button) { return; }
    changeTheme(button.getAttribute('data-theme-name'));
  });

  if (copyToClipboardButton) {
    copyToClipboardButton.addEventListener("click", (event) => {
      event.preventDefault();

      // We pass the event.target to the handler, we will
      // use this to change the button label to 'copied'
      copyToClipboard(event.target);
    });
  }
};

document.addEventListener('DOMContentLoaded', setup);

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
