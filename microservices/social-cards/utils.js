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

function query(req) {
  const def = "default";
  const valid = [ "default", "iconic" ];
  const prov = req.query.image_kind ?? def;

  return valid.includes(prov) ? prov : def;
}

async function generateImageHTML(obj, kind) {
  let css = getCss(kind);
  let html = getHtml(kind);

  let final = ejs.render(html, { stylesheet: css, obj: obj, utils: require("./template-utils.js") });
  return final;
}

async function generateImage(obj, kind) {
  try {

    const html = await generateImageHTML(obj, kind);
    const file = await getScreenshot(html);
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

async function getScreenshot(html) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 600 });
  await page.setContent(html);
  await page.evaluateHandle("document.fonts.ready");
  const file = await page.screenshot({ type: "png" });
  await browser.close();
  return file;
}

module.exports = {
  displayError,
  query,
  generateImageHTML,
  generateImage,
  getCss,
  getHtml,
  getScreenshot,
};
