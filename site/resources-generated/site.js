
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
      // The user expects to get locally saved account data, but is not logged in
      // Redirect to login
      window.location.href = "https://packages.pulsar-edit.dev/login";
    }
  },

  async getRemoteUserDetails(token) {
    try {
      const res = await fetch("https://api.pulsar-edit.dev/api/users", {
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

class AdvancedSearch {
  /**
  * The advanced search form is a secondary form element.
  * This means by default any values there are not associated with the proper
  * 'search' form during the submit event.
  * But we can assign each individual input to the 'search' form at will.
  * Except we **must** ensure to not assign any empty values or else those can
  * cause a failed search, such as search for packages that provide the service '',
  * since none do, nothing would be returned.
  * So that means we can't just assign every input the 'form="search"' attribute,
  * and we have to do it dynamically.
  */
  constructor() {
    // Opts contains all advanced search options matching how they are specified in the document
    this.opts = [ "sort", "direction", "fileExtension", "serviceType", "service", "serviceVersion", "owner" ];
    this.forms = {};
    this.advancedOptsSet = false; // Knowing if any advanced parameters have been set
  }

  setup() {
    for (const opt of this.opts) {
      this.forms[opt] = {
        form: document.getElementById(`search__${opt}`)
      };

      this.forms[opt].form.addEventListener("input", this.changed.bind(this));
    }

    this.applyDefaults();
    this.applyParams();
    this.setupControlBtn();
  }

  changed(event) {
    if (event.type === "input" && event.target.form !== "search") {
      // Assign the input to the 'search' form to associate it's value to that form element
      event.target.setAttribute("form", "search");
    }

    // But if it's a text value that's now empty, we **must** make sure to remove the association
    if (event.target.type === "text" && event.target.value == "" && event.target.form === "search") {
      event.target.removeAttribute("form");
    }
  }

  applyDefaults() {
    // Apply the default values to the advanced search forms

    // Default values are only for some items
    document.getElementById("search__sort--downloads").checked = true;
    document.getElementById("search__direction--desc").checked = true;
  }

  applyParams() {
    // Apply the paramaters from the URL to the advanced search forms
    const urlParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlParams.entries());

    for (const param in params) {
      switch(param) {
        case "sort":
          document.querySelector(`input[value="${params[param]}"]`).checked = true;
          this.advancedOptsSet = true;
          break;
        case "direction":
          document.querySelector(`input[value="${params[param]}"]`).checked = true;
          this.advancedOptsSet = true;
          break;
        case "fileExtension":
          document.getElementById("search__fileExtension--input").value = params[param];
          this.advancedOptsSet = true;
          break;
        case "serviceType":
          document.querySelector(`input[value="${params[param]}"]`).checked = true;
          this.advancedOptsSet = true;
          break;
        case "service":
          document.getElementById("search__service--input").value = params[param];
          this.advancedOptsSet = true;
          break;
        case "serviceVersion":
          document.getElementById("search__serviceVersion--input").value = params[param];
          this.advancedOptsSet = true;
          break;
        case "owner":
          document.getElementById("search__owner--input").value = params[param];
          this.advancedOptsSet = true;
          break;
      }
    }
  }

  setupControlBtn() {
    // Setup the advanced search button that controls expanding or collapsing
    // the advanced search sidebar
    document.getElementById("advanced-search-control").addEventListener("click", this.toggleControlBtn);

    if (this.advancedOptsSet) {
      // This means the previous search query was an advanced one, and the advanced options
      // have been modified from the default
      // We will want to immediately toggle the advanced sidebar from the default of
      // disabled to enabled
      this.toggleControlBtn();
    }
  }

  toggleControlBtn() {
    // Toggle the advanced search button
    const btn = document.getElementById("advanced-search-control");
    const sidebar = document.getElementById("advanced-search-sidebar");
    const enabled = (btn.dataset.enabled.toLowerCase() == "true");
    // The dataset value will be set here, so if it's enabled we know the user
    // intends to disable it & vice versa

    if (enabled) {
      // It's enabled, the user intends to disable it
      btn.classList.remove("icon-jump-right");
      btn.classList.add("icon-jump-left");
      sidebar.classList.add("hidden");
      btn.dataset.enabled = "false";
    } else {
      // It's disabled, the user intends to enable it
      btn.classList.remove("icon-jump-left");
      btn.classList.add("icon-jump-right");
      sidebar.classList.remove("hidden");
      btn.dataset.enabled = "true";
    }
  }
}

window.onload = () => {
  AccountActions.setup();
  ThemeSwitcher.setup();
  CopyToClipboard.setup();

  if (document.getElementById("advanced-search-sidebar")) {
    const advancedSearch = new AdvancedSearch();
    advancedSearch.setup();
  }
};
