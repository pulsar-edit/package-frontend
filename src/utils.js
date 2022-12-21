
const { createCanvas, loadImage, registerFont } = require('canvas');
const MarkdownIt = require("markdown-it");
const utils = require('./template-utils');

let md = new MarkdownIt({
  html: true
}).use(require("markdown-it-highlightjs"), {
  auto: true,
  code: true,
  inline: true
}).use(require("markdown-it-emoji"), {

});

const reg = require("./reg.js");

registerFont('src/fonts/Jura/Jura-Bold.ttf', { family: 'Jura' });
registerFont('src/fonts/Jura/Jura-Light.ttf', { family: 'Jura-Light' })

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

    const [width, height] = [1200, 600];
    const c = createCanvas(width, height);
    const ctx = c.getContext('2d');

    const [github, download, star, flag, logo] = await Promise.all([
      loadImage('data:image/svg+xml;base64,ICAgICAgICAgICAgPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgdmlld0JveD0iMCAwIDQ5NiA1MTIiPjwhLS0hIEZvbnQgQXdlc29tZSBQcm8gNi4yLjEgYnkgQGZvbnRhd2Vzb21lIC0gaHR0cHM6Ly9mb250YXdlc29tZS5jb20gTGljZW5zZSAtIGh0dHBzOi8vZm9udGF3ZXNvbWUuY29tL2xpY2Vuc2UgKENvbW1lcmNpYWwgTGljZW5zZSkgQ29weXJpZ2h0IDIwMjIgRm9udGljb25zLCBJbmMuIC0tPjxwYXRoIGQ9Ik0xNjUuOSAzOTcuNGMwIDItMi4zIDMuNi01LjIgMy42LTMuMy4zLTUuNi0xLjMtNS42LTMuNiAwLTIgMi4zLTMuNiA1LjItMy42IDMtLjMgNS42IDEuMyA1LjYgMy42em0tMzEuMS00LjVjLS43IDIgMS4zIDQuMyA0LjMgNC45IDIuNiAxIDUuNiAwIDYuMi0ycy0xLjMtNC4zLTQuMy01LjJjLTIuNi0uNy01LjUuMy02LjIgMi4zem00NC4yLTEuN2MtMi45LjctNC45IDIuNi00LjYgNC45LjMgMiAyLjkgMy4zIDUuOSAyLjYgMi45LS43IDQuOS0yLjYgNC42LTQuNi0uMy0xLjktMy0zLjItNS45LTIuOXpNMjQ0LjggOEMxMDYuMSA4IDAgMTEzLjMgMCAyNTJjMCAxMTAuOSA2OS44IDIwNS44IDE2OS41IDIzOS4yIDEyLjggMi4zIDE3LjMtNS42IDE3LjMtMTIuMSAwLTYuMi0uMy00MC40LS4zLTYxLjQgMCAwLTcwIDE1LTg0LjctMjkuOCAwIDAtMTEuNC0yOS4xLTI3LjgtMzYuNiAwIDAtMjIuOS0xNS43IDEuNi0xNS40IDAgMCAyNC45IDIgMzguNiAyNS44IDIxLjkgMzguNiA1OC42IDI3LjUgNzIuOSAyMC45IDIuMy0xNiA4LjgtMjcuMSAxNi0zMy43LTU1LjktNi4yLTExMi4zLTE0LjMtMTEyLjMtMTEwLjUgMC0yNy41IDcuNi00MS4zIDIzLjYtNTguOS0yLjYtNi41LTExLjEtMzMuMyAyLjYtNjcuOSAyMC45LTYuNSA2OSAyNyA2OSAyNyAyMC01LjYgNDEuNS04LjUgNjIuOC04LjVzNDIuOCAyLjkgNjIuOCA4LjVjMCAwIDQ4LjEtMzMuNiA2OS0yNyAxMy43IDM0LjcgNS4yIDYxLjQgMi42IDY3LjkgMTYgMTcuNyAyNS44IDMxLjUgMjUuOCA1OC45IDAgOTYuNS01OC45IDEwNC4yLTExNC44IDExMC41IDkuMiA3LjkgMTcgMjIuOSAxNyA0Ni40IDAgMzMuNy0uMyA3NS40LS4zIDgzLjYgMCA2LjUgNC42IDE0LjQgMTcuMyAxMi4xQzQyOC4yIDQ1Ny44IDQ5NiAzNjIuOSA0OTYgMjUyIDQ5NiAxMTMuMyAzODMuNSA4IDI0NC44IDh6TTk3LjIgMzUyLjljLTEuMyAxLTEgMy4zLjcgNS4yIDEuNiAxLjYgMy45IDIuMyA1LjIgMSAxLjMtMSAxLTMuMy0uNy01LjItMS42LTEuNi0zLjktMi4zLTUuMi0xem0tMTAuOC04LjFjLS43IDEuMy4zIDIuOSAyLjMgMy45IDEuNiAxIDMuNi43IDQuMy0uNy43LTEuMy0uMy0yLjktMi4zLTMuOS0yLS42LTMuNi0uMy00LjMuN3ptMzIuNCAzNS42Yy0xLjYgMS4zLTEgNC4zIDEuMyA2LjIgMi4zIDIuMyA1LjIgMi42IDYuNSAxIDEuMy0xLjMuNy00LjMtMS4zLTYuMi0yLjItMi4zLTUuMi0yLjYtNi41LTF6bS0xMS40LTE0LjdjLTEuNiAxLTEuNiAzLjYgMCA1LjkgMS42IDIuMyA0LjMgMy4zIDUuNiAyLjMgMS42LTEuMyAxLjYtMy45IDAtNi4yLTEuNC0yLjMtNC0zLjMtNS42LTJ6Ii8+PC9zdmc+Cg=='),
      loadImage('data:image/svg+xml;base64,ICAgICAgICA8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1kb3dubG9hZCI+PHBhdGggZD0iTTIxIDE1djRhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJ2LTQiPjwvcGF0aD48cG9seWxpbmUgcG9pbnRzPSI3IDEwIDEyIDE1IDE3IDEwIj48L3BvbHlsaW5lPjxsaW5lIHgxPSIxMiIgeTE9IjE1IiB4Mj0iMTIiIHkyPSIzIj48L2xpbmU+PC9zdmc+Cg=='),
      loadImage('data:image/svg+xml;base64,ICAgICAgICA8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1zdGFyIj48cG9seWdvbiBwb2ludHM9IjEyIDIgMTUuMDkgOC4yNiAyMiA5LjI3IDE3IDE0LjE0IDE4LjE4IDIxLjAyIDEyIDE3Ljc3IDUuODIgMjEuMDIgNyAxNC4xNCAyIDkuMjcgOC45MSA4LjI2IDEyIDIiPjwvcG9seWdvbj48L3N2Zz4K'),
      loadImage('data:image/svg+xml;base64,ICAgICAgICA8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iY3VycmVudENvbG9yIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9ImZlYXRoZXIgZmVhdGhlci1mbGFnIj48cGF0aCBkPSJNNCAxNXMxLTEgNC0xIDUgMiA4IDIgNC0xIDQtMVYzcy0xIDEtNCAxLTUtMi04LTItNCAxLTQgMXoiPjwvcGF0aD48bGluZSB4MT0iNCIgeTE9IjIyIiB4Mj0iNCIgeTI9IjE1Ij48L2xpbmU+PC9zdmc+Cg=='),
      loadImage('public/pulsar_name.svg')
    ]);

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height);
    
    // Title
    ctx.font = '70pt Jura'
    ctx.fillStyle = 'black';
    ctx.fillText(obj.name, 50, 100)

    // Repo
    ctx.drawImage(github, 50, 150, 50, 50);
    ctx.font = '30pt Jura'
    ctx.fillStyle = 'blue';
    ctx.fillText(utils.getOwnerRepo(obj), 120, 188)

    // Version
    const repoDims = ctx.measureText(utils.getOwnerRepo(obj));
    const posX = 120 + repoDims.width + 20;
    ctx.font = '30pt Jura-Light'
    ctx.fillStyle = 'grey';
    ctx.fillText(`v${obj.metadata.version}`, posX, 188);

    // Description
    ctx.fillStyle = 'black';
    getLines(ctx, obj.metadata.description, width - 100).forEach((line, index) => 
      ctx.fillText(line, 50, 270 + (50 * index))
    );

    // Downloads
    const downloadDims = ctx.measureText(obj.downloads);
    ctx.drawImage(download, 50, height - 90, 50, 50);
    ctx.fillText(obj.downloads, 120, height - 50);

    // Stargazers
    const starDims = ctx.measureText(obj.stargazers_count);
    ctx.drawImage(star, 120 + downloadDims.width + 50, height - 90, 50, 50);
    ctx.fillText(obj.stargazers_count, 120 + downloadDims.width + 120, height - 50);

    // License
    ctx.drawImage(flag, 120 + downloadDims.width + starDims.width + 170, height - 90, 50, 50);
    ctx.fillText(obj.metadata.license, 120 + downloadDims.width + starDims.width + 240, height - 50);

    // Bars
    ctx.fillStyle = 'lightgray';
    ctx.fillRect(120 + downloadDims.width + 25, height - 95, 2, 60);
    ctx.fillRect(120 + downloadDims.width + starDims.width + 145, height - 95, 2, 60);

    // Logo
    ctx.drawImage(logo, width - 250, height - 200, 200, 160);

    return c.toBuffer('image/png');
  } catch(err) {
    console.log(err);
    return null;
  }
}

function getLines(ctx, text, maxWidth) {
  var words = text.split(" ");
  var lines = [];
  var currentLine = words[0];

  for (var i = 1; i < words.length; i++) {
      var word = words[i];
      var width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
          currentLine += " " + word;
      } else {
          lines.push(currentLine);
          currentLine = word;
      }
  }
  lines.push(currentLine);
  return lines;
}

module.exports = {
  displayError,
  prepareForListing,
  prepareForDetail,
  Timecop,
  generateImage,
};
