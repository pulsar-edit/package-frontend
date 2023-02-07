/**
 * The essential Idea on how to test the frontend with the very minimum knowledge
 * about how the frontend is setup:
 *  - Use Supertest to request the HTML of certain pages against the `main.js`
 *  - Use Puppeteer to then emulate viewing those pages in Google Chrome
 *  - Use Jest to evaluate conditions of the page.
 */

const request = require("supertest");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const axeFile = fs.readFileSync(path.resolve("./node_modules/axe-core/axe.min.js"), { encoding: "utf8" });
let browser;
let app;

//jest.setTimeout(30000);

beforeAll(async () => {
  // Setup Our Dev Server Instance

  // Setup Env Vars
  process.env.PORT = 8080;
  process.env.APIURL = "https://api.pulsar-edit.dev";
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "no-file";
  process.env.GCLOUD_STORAGE_BUCKET = "";
  process.env.DEBUG = true;

  app = require("../main.js");

  // Setup Puppeteer
  browser = await puppeteer.launch();
});

afterAll(async () => {
  await browser.close();
});


describe("Tests against the homepage", () => {
  let page;

  beforeAll(async () => {
    page = await browser.newPage();
    const response = await request(app).get("/");
    await page.setContent(response.text);
    await page.evaluateHandle("document.fonts.ready");
    await page.addScriptTag({ content: axeFile });
  });

  test("test", async () => {
    const title = await page.title();
    console.log(title);
    const metrics = await page.metrics();
    console.log(metrics);

    const axeRes = await page.evaluate(_ => {
      axe
        .run()
        .then(results => {
          console.log(results);
        })
        .catch(err => {
          console.log(err);
        });
    });
    console.log(axeRes);
  });
});
