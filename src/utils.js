
const MarkdownIt = require("markdown-it");
const url = require('url');
const ghurl = require("parse-github-url");
let md = new MarkdownIt({
  html: true
}).use(require("markdown-it-highlightjs"), {
  auto: false,
  code: true,
  inline: false
}).use(require("markdown-it-emoji"), {

}).use(require("markdown-it-github-headings"), {

}).use(require("markdown-it-task-checkbox"), {
  disabled: true,
  divWrap: false
});

const reg = require("./reg.js");

// Collection of utility functions for the frontend

async function displayError(req, res, details) {
  console.error(details);
  if (typeof details?.status_to_display === "number") {
    res.status(details.status_to_display).render("error", details);
  } else {
    res.status(500).render("error", details);
  }
}

let currentPackage = null;
let addedCustomMarkdownHandling = false;

function addCustomMarkdownHandling () {
  if (addedCustomMarkdownHandling) return;

  // Add custom handling of image links. This aims to fix the common issue of
  // users specifying local paths in their links — which results in them not
  // loading here since they live on GitHub.
  let defaultImageRender = md.renderer.rules.image;

  md.renderer.rules.image = function(tokens, idx, options, env, self) {
    // HACK: Get the `pack` object from an outer scope so that we don't have
    // to redefine this handler on every request.
    let pack = currentPackage;
    let token = tokens[idx];
    let aIndex = token.attrIndex('src');

    // Let's say a user adds: ./my-cool-image.png
    // We need to turn it into this:
    // https://github.com/USER/REPO/raw/HEAD/my-cool-image.png
    // While we could reference git.usercontent This seems more straightforward.
    // Additionally GitHub does support us using `HEAD` here, to avoid having to know the master branch.
    // We also have to ensure that the repo doesn't use .git at the end.
    if (reg.localLinks.currentDir.test(token.attrGet('src'))) {
      // Let's prepare our links.
      let cleanRepo = pack.repoLink.replace(".git", "");
      let rawLink = token.attrGet('src');
      rawLink = rawLink.replace(reg.localLinks.currentDir, "");
      token.attrSet('src', `${cleanRepo}/raw/HEAD/${rawLink}`);
    } else if (reg.localLinks.rootDir.test(token.attrGet('src'))) {
      // Let's prepare our links.
      let cleanRepo = pack.repoLink.replace(".git", "");
      let rawLink = token.attrGet('src');
      rawLink = rawLink.replace(reg.localLinks.rootDir, "");
      token.attrSet('src', `${cleanRepo}/raw/HEAD/${rawLink}`);
    } else if (!token.attrGet('src').startsWith("http")) {
      // Check for implicit relative urls
      let cleanRepo = pack.repoLink.replace(".git", "");
      let rawLink = token.attrGet('src');
      token.attrSet('src', `${cleanRepo}/raw/HEAD/${rawLink}`);
    } else if ([".gif", ".png", ".jpg", ".jpeg", ".webp"].find(ext => token.attrGet("src").endsWith(ext)) && token.attrGet("src").startsWith("https://github.com") && token.attrGet("src").includes("blob")) {
      // Should match on any image being distributed from GitHub that's using `blob` instead of `raw` causing images to not load correctly
      let rawLink = token.attrGet("src");
      token.attrSet("src", rawLink.replace("blob", "raw"));
    }

    // pass token to default renderer.
    return defaultImageRender(tokens, idx, options, env, self);
  }

  // Let's fix any links pointing to Atom, and links that expect to only live
  // on GitHub.
  md.core.ruler.after("inline", "fix-atom-links", (state) => {
    state.tokens.forEach((blockToken) => {
      // HACK: Get the `pack` object from an outer scope so that we don't have
      // to redefine this handler on every request.
      let pack = currentPackage;
      if (blockToken.type === "inline" && blockToken.children) {
        blockToken.children.forEach((token) => {
          if (token.type === "link_open") {
            token.attrs.forEach((attr) => {
              if (attr[0] === "href") {
                let link = attr[1];
                if (reg.atomLinks.package.test(link)) {
                  // Fix any links that attempt to point to packages on `https://atom.io/packages/...`
                  attr[1] = `https://web.pulsar-edit.dev/packages/${link.match(reg.atomLinks.package)[1]}`;

                } else if (pack && reg.localLinks.currentDir.test(link)) {
                  // Since we are here let's check for any other links to
                  // github Fix links that use `./` expecting to use the
                  // current dir of the github repo
                  let cleanRepo = pack.repoLink.replace(".git", "");
                  let tmpLink = link.replace(reg.localLinks.currentDir, "");
                  attr[1] = `${cleanRepo}/raw/HEAD/${tmpLink}`;

                } else if (pack && reg.localLinks.rootDir.test(link)) {
                  // Fix links that use `/` expecting to use the root dir of github repo
                  let cleanRepo = pack.repoLink.replace(".git", "");
                  let tmpLink = link.replace(reg.localLinks.rootDir, "");
                  attr[1] = `${cleanRepo}/raw/HEAD/${tmpLink}`;

                } else if (pack && !link.startsWith("http")) {
                  // attempt to fix any links not starting with http to point to github
                  let cleanRepo = pack.repoLink.replace(".git", "");
                  let tmpLink = link.replace(".git", "");
                  attr[1] = `${cleanRepo}/raw/HEAD/${tmpLink}`;

                } else if (reg.atomLinks.flightManual.test(link)) {
                  // Resolve any links to the flight manual to web archive
                  attr[1] = link.replace(
                    reg.atomLinks.flightManual,
                    "https://web.archive.org/web/20221215003438/https://flight-manual.atom.io/"
                  );
                }
              }
            });
          }
        });
      }
    });
  });

  addedCustomMarkdownHandling = true;
}

function modifyErrorText(err) {
  // This function takes an error object, or error message string, and attempts
  // to find the optimal formatting of the message to display to users.

  if (typeof err === "object") {
    if (typeof err.status === "number") {
      // This is likely an error thrown from `superagent`
      let text = `'${err.status}' Received from '${err?.response?.req?.host}${err?.response?.req?.path}'\n\t\t ${err.toString()}`;
      return text;
    } else {
      // TODO Additional possibilities added here
      return err;
    }
  } else {
    // We likely already have an error message string
    return err;
  }
}

function prepareForListing(obj) {
  // Takes a package and prepares it for the short-form listing.
  // Simplifying it's structure and ensuring data accuracy
  return new Promise((resolve, reject) => {
    let packList = [];

    for (let i = 0; i < obj.length; i++) {
      try {
        // Let's first check that we can safely grab all the data we need
        // https://github.com/pulsar-edit/package-frontend/issues/74
        const valid = (obj[i]?.name ?? false) &&
                      (obj[i]?.downloads ?? false) &&
                      (obj[i]?.stargazers_count ?? false) &&
                      (typeof obj[i]?.metadata === "object");
        if (!valid) {
          // One of our strict checks has failed, so we know the object is invalid
          // Instead of appending placeholder data like below for a single
          // check failing, we will add in data asking for users to alert us of
          // this broken package, so that it can be repaired
          let brokenPack = {
            name: obj[i]?.name || "Malformed Package", // We still want to report a name for users to submit
            description: "Whoops! Seems this package has severely malformed data. Please submit an issue to https://github.com/pulsar-edit/package-backend/issues with the package's name. Thank you!",
            keywords: [ "malformed" ],
            badges: [],
            author: "malformed",
            downloads: 0,
            stars: 0,
            install: ""
          };
          packList.push(brokenPack);
          continue;
        }

        let pack = {};

        pack.name = obj[i].name ? obj[i].name : "";
        pack.description = obj[i].metadata.description ? obj[i].metadata.description : "";
        pack.keywords = obj[i].metadata.keywords ? obj[i].metadata.keywords : [ "no-keywords" ];
        pack.author = findAuthorField(obj[i]);
        pack.downloads = obj[i].downloads ? obj[i].downloads : 0;
        pack.stars = obj[i].stargazers_count ? obj[i].stargazers_count : 0;
        pack.install = `atom://settings-view/show-package?package=${pack.name}`;

        // Cleanup the data
        pack.stars = Number(pack.stars).toLocaleString();
        pack.downloads = Number(pack.downloads).toLocaleString();

        pack.badges = obj[i].badges ?? [];

        // Apply any bundled package logic
        if (isBundledPackage(pack.name)) {
          pack.isBundled = true;
          pack.badges.push({
            type: "info",
            title: "Bundled",
            link: "https://github.com/pulsar-edit/package-backend/blob/main/docs/reference/badge_spec.md#bundled"
          });
        }

        packList.push(pack);
      } catch(err) {
        console.log(err);
        console.log("Error Caused by:");
        console.log(obj[i]);

        // But we should no longer reject and cause the page to crash. Instead provide malformed error.
        let brokenPack = {
          name: obj[i]?.name || "Malformed Package",
          description: "Whoops! Seems this package has malformed data that caused the package parser to crash! Please submit an issue to https://github.com/pulsar-edit/package-backend/issues with the package's name. Thank you!",
          keywords: [ "malformed" ],
          badges: [],
          author: "malformed",
          downloads: 0,
          stars: 0,
          install: ""
        };

        packList.push(brokenPack);
      }
    }

    resolve(packList);
  });
}

function prepareForDetail(obj) {
  return new Promise((resolve, reject) => {
    let pack = {};

    pack.name = obj.name ? obj.name : "";
    pack.description = obj.metadata.description ? obj.metadata.description : "";
    pack.keywords = obj.metadata.keywords ? obj.metadata.keywords : [];
    pack.author = findAuthorField(obj);
    pack.downloads = obj.downloads ? obj.downloads : 0;
    pack.stars = obj.stargazers_count ? obj.stargazers_count : 0;
    pack.license = obj.metadata.license ? obj.metadata.license : "";
    pack.version = obj.metadata.version ? obj.metadata.version : "";
    pack.repoLink = findRepoField(obj);
    pack.bugLink = obj.metadata.bugs ? obj.metadata.bugs.url : "";
    pack.install = `atom://settings-view/show-package?package=${pack.name}`;

    pack.providedServices = obj.metadata.providedServices ?? null;
    pack.consumedServices = obj.metadata.consumedServices ?? null;

    // Since filters are rendered at compile time, they won't work the way I'd
    // hoped to display Markdown on the page — by using the `markdown-it`
    // filter. So the best method will likely be to instead provide the
    // `readme` key as straight HTML.

    // HACK: The ambient `currentPackage` declaration above is the simplest way
    // for us to make `pack` available to the Markdown handler that rewrites
    // URLs.
    currentPackage = pack;
    pack.readme = md.render(obj.readme);
    currentPackage = null;

    // Then we want to do some cleanup on these final values. Mostly ensuring
    // numbers look pretty enough
    pack.stars = Number(pack.stars).toLocaleString();
    pack.downloads = Number(pack.downloads).toLocaleString();

    // Add Sharing data to it for easy access to the package_listing
    pack.share = {
      pageLink: `https://web.pulsar-edit.dev/packages/${pack.name}`,
      mdLink: {
        default: `[![${pack.name}](https://image.pulsar-edit.dev/packages/${pack.name})](https://web.pulsar-edit.dev/packages/${pack.name})`,
        iconic: `[![${pack.name}](https://image.pulsar-edit.dev/packages/${pack.name}?image_kind=iconic)](https://web.pulsar-edit.dev/packages/${pack.name})`
      }
    };

    pack.badges = obj.badges ?? [];

    // Apply any bundled package logic
    if (isBundledPackage(pack.name)) {
      pack.isBundled = true;
      pack.badges.push({
        type: "info",
        title: "Bundled",
        link: "https://github.com/pulsar-edit/package-backend/blob/main/docs/reference/badge_spec.md#bundled"
      });
    }

    resolve(pack);
  });
}

function findAuthorField(obj) {
  let author = "";
  if (typeof obj.metadata.author === "string") {

    // We know this is not an object, but we must ensure this isn't a compressed author object.
    if (reg.author.optional_compact.test(obj.metadata.author)) {
      // It matches, so we know we have to parse it
      let constru = obj.metadata.author.match(reg.author.optional_compact);
      author = constru[1]?.trim();
    } else {
      // It doesn't match, and we will assume it's a basic author field.
      author = obj.metadata.author;
    }
  } else if (typeof obj.metadata.author === "object" && obj.metadata.author.hasOwnProperty("name")) {
    author = obj.metadata.author.name;
  } else {
    // If no standards are found, let's instead use the name pulled from the
    // repo.
    let repo = findRepoField(obj);
    let repoConstru = repo.match(reg.repoLink.standard);

    if (repoConstru !== null && repoConstru.length > 1) {
      author = repoConstru[1];
    } else {
      author = repo;
    }
  }

  return author;
}

function findRepoField(obj) {
  let repo;

  if (typeof obj.metadata.repository === "string") {
    repo = obj.metadata.repository;
  } else if (typeof obj.metadata.repository === "object" && typeof obj.metadata.repository?.url === "string") {
    repo = obj.metadata.repository.url;
  } else if (typeof obj.repository === "string") {
    repo = obj.repository;
  } else if (typeof obj.repository === "object" && typeof obj.repository?.url === "string") {
    repo = obj.repository.url;
  } else {
    // We return early here to avoid passing an empty string to `parse-github-url` which would throw an exception.
    return "";
  }
  /**
    * For Information: ./docs/repository-urls.md
    * Now we are using `https://github.com/jonschlinkert/parse-github-url`
    * So there's no need to manually maintain this full code, but instead of complete deletion
    * it will be mothballed by being commented out until a later time.
  */


  // if (reg.repoLink.standard.test(repo)) {
  //   // Standard repo definition, it's a valid link. Return
  //   return repo;
  // } else if (reg.repoLink.protocol.test(repo)) {
  //   // Git Protocol Defined. Create normalized link.
  //   let constru = repo.match(reg.repoLink.protocol);
  //   return `https://github.com/${constru[1]}/${constru[2].replace(".git","")}`;
  // } else if (reg.repoLink.githubAssumedShorthand.test(repo)) {
  //   return `https://github.com/${repo.match(reg.repoLink.githubAssumedShorthand)[0]}`;
  // } else if (reg.repoLink.githubShorthand.test(repo)) {
  //   return `https://github.com/${repo.match(reg.repoLink.githubShorthand)[1]}`;
  // } else {
  //   // We couldn't determine what to do here. Just return.
  //   return repo;
  // }

  let repoObj = ghurl(repo);

  if (repoObj.hasOwnProperty("repo")) {
    return `https://github.com/${repoObj.repo}`;
  } else {
    // Unable to parse URL, return as is
    return repo;
  }

}

function getPagination(req, api) {
  // Parameters obtained from request and response info
  let {link, 'query-total': total, 'query-limit': limit } = api.headers
  if (!link || !total || !limit) { return null }
  const { pathname, query } = url.parse(req.url, true);
  const payloadLength = api.body.length || 0;
  const page = parseInt(query.page) || 1;

  // Convert headers into usable format
  total = parseInt(total);
  limit = parseInt(limit);
  pages = parseInt(link.split(', ')[1]?.match(/(\d+)/)[0] || '1');

  // Helper functions
  const getNextPos = () => options[options.length - 1] + 1;
  const getPrevPos = () => options[0] - 1;
  const getRouteUrl = (page) => `${pathname}?${new URLSearchParams({ ...query, page }).toString()}`;

  // Calculate pagination option links
  const pageOptions = 5; // This should be an odd number in order to be pretty.
  let options = [page];
  [...Array(pageOptions - 1).keys()].forEach(index => {
    let mid = Math.floor(pageOptions / 2);
    if (index < mid) {
      // Try to add next options
      // Note - These functions are the same, just switching priority
      if (getNextPos() <= pages) {
        options.push(getNextPos());
      } else if (getPrevPos() >= 1) {
        options.unshift(getPrevPos());
      }
    } else {
      // Try to add prev options
      // Note - These functions are the same, just switching priority
      if (getPrevPos() >= 1) {
        options.unshift(getPrevPos());
      } else if (getNextPos() <= pages) {
        options.push(getNextPos());
      }
    }
  });
  options = options.map(page => ({
    label: page,
    value: getRouteUrl(page)
  }));

  // Calculate to / from numbers
  const from = page === 1 ? 1 : ((page - 1) * limit) + 1;
  const to = (from + payloadLength) - 1;

  return {
    from,
    to,
    page,
    pages,
    total,
    options,
    routes: {
      first: page > 1 ? getRouteUrl(1) : null,
      prev: page > 1 ? getRouteUrl(page - 1) : null,
      next: page < pages ? getRouteUrl(page + 1) : null,
      last: page < pages ? getRouteUrl(pages) : null,
    }
  }
}

function isBundledPackage(name) {
  // Takes the name of a package and returns true if that package is bundled
  // within the Pulsar editor
  const bundledPackages = [
    "about", "archive-view", "atom-dark-syntax", "atom-dark-ui", "atom-light-syntax",
    "atom-light-ui", "autocomplete-atom-api", "autocomplete-css", "autocomplete-html",
    "autocomplete-plus", "autocomplete-snippets", "autoflow", "autosave", "background-tips",
    "base16-tomorrow-dark-theme", "base16-tomorrow-light-theme", "bookmarks",
    "bracket-matcher", "command-palette", "dalek", "deprecation-cop", "dev-live-reload",
    "encoding-selector", "exception-reporting", "find-and-replace", "fuzzy-finder",
    "git-diff", "go-to-line", "grammar-selector", "image-view", "incompatible-packages",
    "keybinding-resolver", "language-c", "language-clojure", "language-coffee-script",
    "language-csharp", "language-css", "language-gfm", "language-git", "language-go",
    "language-html", "language-hyperlink", "language-java", "language-javascript",
    "language-json", "language-less", "language-make", "language-mustache",
    "language-objective-c", "language-perl", "language-php", "language-property-list",
    "language-python", "language-ruby-on-rails", "language-ruby", "language-rust-bundled",
    "language-sass", "language-shellscript", "language-source", "language-sql",
    "language-text", "language-todo", "language-toml", "language-typescript",
    "language-xml", "language-yaml", "line-ending-selector", "link", "markdown-preview",
    "notifications", "one-dark-syntax", "one-dark-ui", "one-light-syntax", "one-light-ui",
    "open-on-github", "package-generator", "settings-view", "solarized-dark-syntax",
    "solarized-light-syntax", "status-bar", "styleguide", "tabs", "timecop", "tree-view",
    "update-package-dependencies", "welcome", "whitespace", "wrap-guide",
    "snippets", "symbols-view", "github", "spell-check"
  ];

  if (bundledPackages.includes(name)) {
    return true;
  } else {
    return false;
  }
}

class Timecop {
  constructor() {
    this.timetable = {};
  }
  start(service) {
    this.timetable[service] = {
      start: performance.now(),
      end: undefined,
      duration: undefined
    }
  }

  end(service) {
    this.timetable[service].end = performance.now();
    this.timetable[service].duration =
      this.timetable[service].end -
      this.timetable[service].start;
  }
}

addCustomMarkdownHandling();

module.exports = {
  displayError,
  prepareForListing,
  prepareForDetail,
  getPagination,
  Timecop,
  modifyErrorText
};
