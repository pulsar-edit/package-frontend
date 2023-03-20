const puppeteer = require("puppeteer");
const ejs = require("ejs");
const fs = require("fs");

async function displayError(req, res, errStatus) {
  switch(errStatus) {
    case 404:
      res.status(404).json({ message: "Not Found" });
      break;
    case 505:
    default:
      res.status(505).json({ message: "Server Error" });
      break;
  }
}

function queryKind(req) {
  const def = "default";
  const valid = [ "default", "iconic" ];
  const prov = req.query.image_kind ?? def;

  return valid.includes(prov) ? prov : def;
}

function queryTheme(req) {
  const def = "light";
  const valid = [ "light", "github-dark", "dracula" ];
  const prov = req.query.theme ?? def;

  return valid.includes(prov) ? prov : def;
}

async function generateImageHTML(obj, kind) {
  let css = getCss(kind);
  let html = getHtml(kind);

  // Now before calling ejs.render because EJS doesn't have access to our function scope,
  // Meaning we can't call any functions in here, we need to expose them to the ejs instance
  // by attaching the helper functions to the object.

  let final = ejs.render(html, { stylesheet: css, obj: obj, utils: require("./template-utils.js") });
  return final;
}

async function generateImage(obj, kind, theme) {
  // The below functionality enables custom created sharing images.
  // For reference on implmentation see:
  //  - https://github.blog/2021-06-22-framework-building-open-graph-images/
  //  - https://github.com/vercel/og-image
  try {

    const html = await generateImageHTML(obj, kind);
    const file = await getScreenshot(html, theme);
    return file;

  } catch(err) {
    console.log(err);
    return null;
  }
}

function getCss(kind) {
  try {
    switch(kind) {
      case "iconic":
        return fs.readFileSync("./template/iconic-mascot/template.css", { encoding: "utf8" });
        break;
      case "default":
      default:
        return fs.readFileSync("./template/default/template.css", { encoding: "utf8" });
        break;
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
        return fs.readFileSync("./template/iconic-mascot/template.ejs", { encoding: "utf8" });
        break;
      case "default":
      default:
        return fs.readFileSync("./template/default/template.ejs", { encoding: "utf8" });
        break;
    }
  } catch(err) {
    console.log(err);
    return "";
  }
}

async function getScreenshot(html, theme) {
  const browser = (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD)
    ? await puppeteer.launch({ executablePath: 'google-chrome-stable', args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    : await puppeteer.launch();
  // ^^ The above adds support to be able to test locally with an installed puppeteer instance,
  // while still letting our microservice take advantage of the binary installed in
  // the image.
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 600 });
  await page.setContent(html);
  await page.evaluateHandle("document.fonts.ready");
  await page.evaluate((t) => {
    document.body.setAttribute("theme", t);
  }, theme); // https://stackoverflow.com/a/69038149/12707685
  const file = await page.screenshot({ type: "png" });
  await browser.close();
  return file;
}

module.exports = {
  displayError,
  queryKind,
  queryTheme,
  generateImageHTML,
  generateImage,
  getCss,
  getHtml,
  getScreenshot,
};
