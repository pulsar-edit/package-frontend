
// Badge Form Logic

const BADGE_CONSTS = {
  "Outdated": {
    type: "info",
    text: "GitHub Installation recommended"
  },
  "Broken": {
    type: "warn",
    text: "Known to be non-functional"
  },
  "Archived": {
    type: "info",
    text: "Source Code has been archived"
  },
  "Deprecated": {
    type: "warn",
    text: "Installation of fork recommended"
  }
};

const badgeFormEle = document.querySelector("#badge_form");
const badgeForm = new FormData(badgeFormEle);

badgeFormEle.querySelector("#enable_alt").onchange = () => {
  badgeFormEle.querySelector("#alt").disabled = !badgeFormEle.querySelector("#enable_alt").checked;
};

badgeFormEle.querySelector("#title").onchange = () => {
  // Hide all other descriptions
  let eles = document.querySelectorAll("[data-meta='title_description']");

  for (let i = 0; i < eles.length; i++) {
    eles[i].classList.add("hidden");
  }

  // Show the one that matches the current title
  let val = badgeFormEle.querySelector("#title").value;
  let ele = document.getElementById(`${val.toLowerCase()}_description`);
  ele.classList.remove("hidden");

  // set other common defaults for this title
  let defs = BADGE_CONSTS[val];
  badgeFormEle.querySelector("#type").value = defs?.type;
  badgeFormEle.querySelector("#text").value = defs?.text;
  badgeFormEle.querySelector("#text").dispatchEvent(new Event("input", { bubbles: true }));
  // ^^ Trigger the input event so the form auto scales to width
};

badgeFormEle.querySelector("#text").oninput = () => {
  badgeFormEle.querySelector("#text").size = badgeFormEle.querySelector("#text").value.length;
};
