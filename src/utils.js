
const puppeteer = require("puppeteer");
const fs = require("fs");
const ejs = require("ejs");

const MarkdownIt = require("markdown-it");
let md = new MarkdownIt({
  html: true
}).use(require("markdown-it-highlightjs"), {
  auto: true,
  code: true,
  inline: true
}).use(require("markdown-it-emoji"), {

});

const reg = require("./reg.js");

// Collection of utility functions for the frontend

async function displayError(req, res, errStatus) {
  switch(errStatus) {
    case 404:
      res.status(404).render('404');
      break;
    case 505:
      res.status(505).render('505');
      break;
    default:
      res.status(505).render('505');
      break;
  }
}

function prepareForListing(obj) {
  // Takes a package and prepares it for the short-form listing.
  // Simplifying it's structure and ensuring data accuracy
  return new Promise((resolve, reject) => {
    let packList = [];

    for (let i = 0; i < obj.length; i++) {
      try {
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

        packList.push(pack);
      } catch(err) {
        console.log(err);
        console.log("Error Caused by:");
        console.log(obj[i]);
        reject(err);
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

    // Add custom handling of image links. This aims to fix the common issue of users specifying local paths in their links.
    // Which result in them not loading here since they live on GitHub.
    // This is declared here, since this needs access to the repo the package is on.
    let defaultImageRender = md.renderer.rules.image;

    md.renderer.rules.image = function(tokens, idx, options, env, self) {
      let token = tokens[idx];
      let aIndex = token.attrIndex('src');

      // Lets say a user adds: ./my-cool-image.png
      // We need to turn it into this:
      // https://github.com/USER/REPO/raw/HEAD/my-cool-image.png
      // While we could reference git.usercontent This seems more straightforward.
      // Additionally GitHub does support us using `HEAD` here, to avoid having to know the master branch.
      // We also have to ensure that the repo doesn't use .git at the end.
      if (reg.localLinks.currentDir.test(token.attrGet('src'))) {

        // Lets prepare our links.
        let cleanRepo = pack.repoLink.replace(".git", "");
        let rawLink = token.attrGet('src');
        rawLink = rawLink.replace(reg.localLinks.currentDir, "");
        token.attrSet('src', `${cleanRepo}/raw/HEAD/${rawLink}`);
      } else if (reg.localLinks.rootDir.test(token.attrGet('src'))) {
        // Lets prepare our links.
        let cleanRepo = pack.repoLink.replace(".git", "");
        let rawLink = token.attrGet('src');
        rawLink = rawLink.replace(reg.localLinks.rootDir, "");
        token.attrSet('src', `${cleanRepo}/raw/HEAD/${rawLink}`);
      } else if (!token.attrGet('src').startsWith("http")) {
        // Check for implicit relative urls
        let cleanRepo = pack.repoLink.replace(".git", "");
        let rawLink = token.attrGet('src');
        token.attrSet('src', `${cleanRepo}/raw/HEAD/${rawLink}`);
      }

      // pass token to default renderer.
      return defaultImageRender(tokens, idx, options, env, self);
    }
    // Since filters are rendered at compile time they won't work the way I'd hoped to display
    // Markdown on the page, by using the `markdown-it` filter.
    // So the best method will likely be to instead provide the `readme` key as straight HTML.
    pack.readme = md.render(obj.readme);

    // Then we want to do some cleanup on these final values. Mostly ensuring numbers look pretty enough
    pack.stars = Number(pack.stars).toLocaleString();
    pack.downloads = Number(pack.downloads).toLocaleString();

    resolve(pack);
  });
}

function findAuthorField(obj) {
  let author = "";
  if (typeof obj.metadata.author === "string") {

    // We know this is not an object, but we must ensure this isn't a compressed author object.
    if (reg.author.compact.test(obj.metadata.author)) {
      // It matches, so we know we have to parse it
      let constru = obj.metadata.author.match(reg.author.compact);
      author = constru[1];
    } else {
      // It doesn't match, and we will assume it's a basic author field.
      author = obj.metadata.author;
    }
    author = obj.metadata.author;
  } else if (typeof obj.metadata.author === "object" && obj.metadata.author.hasOwnProperty("name")) {
    author = obj.metadata.author.name;
  } else {
    // If no standards are found, lets instead use the name pulled from the repo.
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
  let repo = (typeof obj.metadata.repository === "string" ? obj.metadata.repository :
                (typeof obj.metadata.repository === "object" ? obj.metadata.repository.url : "" ));
  /**
    * For Information: ./docs/repository-urls.md
  */

  if (reg.repoLink.standard.test(repo)) {
    // Standard repo definition, it's a valid link. Return
    return repo;
  } else if (reg.repoLink.protocol.test(repo)) {
    // Git Protocol Defined. Create normalized link.
    let constru = repo.match(reg.repoLink.protocol);
    return `https://github.com/${constru[1]}/${constru[2].replace(".git","")}`;
  } else {
    // We couldn't determine what to do here. Just return.
    return repo;
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

async function generateImage(obj) {
  // The below functionality enables custom created sharing images.
  // For reference on implmentation see:
  //  - https://github.blog/2021-06-22-framework-building-open-graph-images/
  //  - https://github.com/vercel/og-image
  try {
    // In an effort to support multiple types of images to return, we will determine them before here.
    // But for now will set the default

    let kind = "default";

    const html = await generateImageHTML(obj, kind);
    const file = await getScreenshot(html);
    return file;
  } catch(err) {
    console.log(err);
    return null;
  }
}

async function generateImageHTML(obj, kind) {
  console.log(obj);
  let css = getCss(kind);
  let html = getHtml(kind);

  // Now before calling ejs.render because EJS doesn't have access to our function scope,
  // Meaning we can't call any functions in here, we need to expose them to the ejs instance
  // by attaching the helper functions to the object.

  let final = ejs.render(html, { stylesheet: css, obj: obj, utils: require("./template-utils.js") });
  return final;
}

function getCss(kind) {
  try {
    switch(kind) {
      case "iconic":
        return fs.readFileSync("./src/image-templates/iconic-mascot/template.css", { encoding: "utf8" });
      case "default":
      default:
        return fs.readFileSync("./src/image-templates/default/template.css", { encoding: "utf8" });
    }
  } catch(err) {
    console.log(err);
    return "";
  }
}

function getHtml(kind) {
  try {
    switch(kind) {
      case "iconic":
        return fs.readFileSync("./src/image-templates/iconic-mascot/template.ejs", { encoding: "utf8" });
      case "default":
      default:
        return fs.readFileSync("./src/image-templates/default/template.ejs", { encoding: "utf8" });
    }
  } catch(err) {
    console.log(err);
    return "";
  }
}

async function getScreenshot(html) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 600 });
  await page.setContent(html);
  await page.evaluateHandle('document.fonts.ready');
  const file = await page.screenshot({ type: 'png' });
  return file;
}

module.exports = {
  displayError,
  prepareForListing,
  prepareForDetail,
  Timecop,
  generateImage,
};
