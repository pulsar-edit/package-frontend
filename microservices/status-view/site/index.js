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

class Status {
  constructor() {
    this.elements = {
      homepage: document.getElementById("homepage-status"),
      docs: document.getElementById("docs-status"),
      blog: document.getElementById("blog-status"),
      api: document.getElementById("api-status"),
      image: document.getElementById("image-status"),
      db: document.getElementById("db-status"),
      download: document.getElementById("download-status")
    };
    this.status = {};

    this.getStatus();
  }

  getStatus() {
    fetch("https://storage.googleapis.com/pulsar-system-status/status.json")
      .then((res) => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${res.status}`);
        }
        return res.json();
      })
      .then((res) => {
        this.status = res;
        this.update();
      })
      .catch((err) => {
        this.status = {
          homepage: {
            ok: false,
            updated: Date.now(),
            details: err.toString(),
            condition: "unknown"
          },
          docs: {
            ok: false,
            updated: Date.now(),
            details: err.toString(),
            condition: "unknown"
          },
          blog: {
            ok: false,
            updated: Date.now(),
            details: err.toString(),
            condition: "unknown"
          },
          api: {
            ok: false,
            updated: Date.now(),
            details: err.toString(),
            condition: "unknown"
          },
          image: {
            ok: false,
            updated: Date.now(),
            details: err.toString(),
            condition: "unknown"
          },
          db: {
            ok: false,
            updated: Date.now(),
            details: err.toString(),
            condition: "unknown"
          },
          download: {
            ok: false,
            updated: Date.now(),
            details: err.toString(),
            condition: "unknown"
          }
        };
        this.update();
      });
  }

  update() {
    for (const service in this.elements) {
      if (this.status?.[service]?.ok) {
        this.elements[service].classList.add("tip");
      } else {
        this.elements[service].classList.add("danger");
      }
      this.elements[service].classList.add("alert");
      this.elements[service].innerText = `${this.status?.[service]?.condition ?? "unknown"}: ${this.status?.[service]?.details ?? ""}`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ThemeSwitcher.setup();
  const status = new Status();
});
