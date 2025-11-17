
const ThemeSwitcher = {
  DEFAULT_THEME_PREFERENCE: "auto",
  MEDIA: window.matchMedia("(prefers-color-scheme: light)"),
  setup() {
    this.root = document.documentElement;
    this.button = document.getElementById("theme-switcher");
    this.metaScheme = document.getElementById("meta-scheme");

    // We want to:
    // - listen for clicks on this button to switch the theme
    // - change this theme according to the OS prefferred theme
    // - change this theme according to any stored preferences on this site
    // - listen for OS preferred theme changing
    let preference = this.findSavedPreference() ?? this.DEFAULT_THEME_PREFERENCE;
    this.setPreference(preference);
    this.setupListeners();
  },

  findSavedPreference() {
    return localStorage.getItem("preferred-theme");
  },

  findOSTheme() {
    return this.MEDIA.matches ? "light" : "dark";
  },

  setupListeners() {
    this.button.addEventListener("click", this.onButtonClick.bind(this));
    this.MEDIA.addEventListener("change", () => {
      let newTheme = event.matches ? "light" : "dark";
      this.setTheme(newTheme);
    });
  },

  setTheme(newTheme) {
    if (this.root.dataset.theme === newTheme) return;
    this.root.dataset.theme = newTheme;

    this.metaScheme.setAttribute(
      "content",
      newTheme
    );
  },

  setPreference(newPreference) {
    localStorage.setItem("preferred-theme", newPreference);
    if (this.root.dataset.themeSetting === newPreference) return;
    this.root.dataset.themeSetting = newPreference;
    let theme = newPreference === "auto" ? this.findOSTheme() : newPreference;
    this.setTheme(theme);
  },

  onButtonClick() {
    let currentValue = this.root.dataset.themeSetting;
    let newValue;

    switch(currentValue) {
      case "dark":
        newValue = "light";
        break;
      case "light":
        newValue = "auto";
        break;
      case "auto":
        newValue = "dark";
        break;
      default:
        newValue = this.DEFAULT_THEME_PREFERENCE;
    }
    this.setPreference(newValue);
  }
};

const CopyToClipboard = {
  setup() {
    const items = document.querySelectorAll("[data-clipboard]");
    for (const item of items) {
      item.addEventListener("click", () => {
        this.copy(item);
      });
    }
  },

  copy(item) {
    navigator.clipboard.writeText(item.dataset.clipboard);
    // Store the original text of the item before manipulating
    const str = item.innerText;
    item.innerText = "Copied!";

    // Reset to original text after 3s
    setTimeout(() => {
      item.innerText = str;
    }, 3000);
  }
};

const AccountActions = {
  isLoggedIn() {
    return !!localStorage.getItem("user");
  },

  async setup() {
    // Adjust navigation headers
    if (this.isLoggedIn()) { this.modifyNav(); }

    if (window.location.pathname === "/users") {
      // We are currently on the user page, so we need to fill in their account details
      await this.userPageActions();
    }
  },

  modifyNav() {
    // Modify the top header navigation like so:
    // DEFAULT: Featured | Packages | Sign In | HomePage
    // When Signed in: Featured | Packages | Account | Sign Out | HomePage

    const header = document.querySelector("header > div > nav");
    const headerLinks = document.querySelectorAll("header > div > nav > a");

    // Set the "Sign In" to be "Sign Out"
    const loginLink = Array.from(headerLinks).find(i => i.href === `${document.location.origin}/login`);
    loginLink.innerHTML = "Sign Out";
    loginLink.href = "/logout";

    // Create the link for "Account"
    const accountLink = document.createElement("a");
    accountLink.href = "/users";
    accountLink.innerHTML = "My Account";
    accountLink.classList.add("page-header__link");

    // Insert "Account" before "Sign Out"
    header.insertBefore(accountLink, loginLink);
  },

  async userPageActions() {
    // Try to find a token in their request
    const urlParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlParams.entries());
    const token = params.token;
    let userDetails = {};

    if (typeof token === undefined || !token) {
      // The user has not supplied a token, meaning they expect to be able to load
      // already saved user account details
      userDetails = this.getLocalUserDetails();
    } else {
      // The user has supplied a token, likely meaning a first time sign up
      // We need to retreive their user account details from the backend
      userDetails = await this.getRemoteUserDetails(token);

      // Store the new user details
      localStorage.setItem("user", JSON.stringify(userDetails));
    }

    // Now with the user details, lets modify the content of the page to show them
    let img = document.getElementById("user-data-avatar");
    let username = document.getElementById("user-data-name");
    let usercreated = document.getElementById("user-data-created");
    let usertoken = document.getElementById("user-data-token");
    let usertokenclipboard = document.getElementById("user-data-token-clipboard");

    img.style.backgroundImage = `url(${userDetails.avatar})`;
    username.textContent = userDetails.username;
    usercreated.textContent = `Account Created: ${new Date(userDetails.created_at).toISOString().slice(0, 10)}`;
    usertoken.value = userDetails.token;
    usertokenclipboard.dataset.clipboard = userDetails.token;
  },

  getLocalUserDetails() {
    if (this.isLoggedIn()) {
      return JSON.parse(localStorage.getItem("user"));
    } else {
      // The user expects to get locally saved account data, but is not logged
      // in. Redirect to login.
      window.location.href = "https://packages.pulsar-edit.dev/login";
    }
  },

  async getRemoteUserDetails(token) {
    try {
      const response = await fetch("https://api.pulsar-edit.dev/api/users", {
        method: "GET",
        headers: {
          "Authorization": token,
          "Access-Control-Allow-Credentials": true
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        console.error("Failed to get remote user data!");
        console.error(response);
      }
    } catch(err) {
      console.error("Failed to get remote user data!");
      console.error(err);
    }
  }
};

{
  const SearchForm = document.getElementById('search');

  SearchForm?.addEventListener('submit', () => {
    // Strip empty fields from the URL. Ideally empty URL parameters would be
    // treated identically to missing parameters on the backend; failing that, we
    // can disable the empty fields just before submission.
    for (let control of document.querySelectorAll('input, select')) {
      if (control.value === '') {
        control.disabled = true;
      }
    }
  });

  function annotateSelectElement (select) {
    if (select.value !== '') {
      select.classList.remove('empty');
    } else {
      select.classList.add('empty');
    }
  }

  let serviceTypeSelect = document.getElementById('service-type');
  if (serviceTypeSelect) {
    annotateSelectElement(serviceTypeSelect);
    serviceTypeSelect.addEventListener('change', () => {
      annotateSelectElement(event.target);
    });
  }

  let url = new URL(location.toString());

  window.addEventListener('pageshow', () => {
    // Once we disable the empty fields, they'll stay disabled if the user
    // navigates backward to the page via the bfcache… unless we listen for
    // `pageshow` and un-disable them.
    for (let control of document.querySelectorAll('input, select')) {
      control.disabled = false;
      let filled = false;
      if (control.type === 'radio' || control.type === 'checkbox') {
        if (control.value === url.searchParams.get(control.name)) {
          control.checked = true;
          filled = true;
        }
      } else if (url.searchParams.has(control.name)) {
        control.value = url.searchParams.get(control.name);
        filled = true;
      }
      if (filled && control.name !== 'q') {
        let details = document.querySelector('.search-area__advanced-search');
        if (details) {
          details.open = true;
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  AccountActions.setup();
  ThemeSwitcher.setup();
  CopyToClipboard.setup();
});
