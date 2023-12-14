const express = require("express");
const app = express();
const path = require("path");
const handlers = require("./handlers.js");
const utils = require("./utils.js");

const DEV = process.env.PULSAR_STATUS === "dev" ? true : false;

app.set("views", "./ejs-views/pages");
app.set("view engine", "ejs");

app.use((req, res, next) => {
  req.start = Date.now();
  next();
});

app.use("/public", express.static("./public"));

app.use("/", express.static("./static"));

app.get("/", async (req, res) => {
  let timecop = new utils.Timecop();
  await handlers.homePage(req, res, timecop);
});

app.get("/status", async (req, res) => {
  await handlers.statusPage(req, res);
});

app.get("/packages", async (req, res) => {
  // the main package listing
  let timecop = new utils.Timecop();
  await handlers.fullListingPage(req, res, timecop);
});

app.get("/packages/featured", async (req, res) => {
  // view list of featured packages
  let timecop = new utils.Timecop();
  await handlers.featuredPackageListing(req, res, timecop);
});

app.get("/packages/search", async (req, res) => {
  // execute a search for packages
  let timecop = new utils.Timecop();
  await handlers.searchHandler(req, res, timecop);
});

app.get("/packages/:packageName", async (req, res) => {
  // view details of a package
  let timecop = new utils.Timecop();
  await handlers.singlePackageListing(req, res, timecop);
});

app.get("/users", async (req, res) => {
  // The Signed in User Details Page
  let timecop = new utils.Timecop();
  await handlers.userPageHandler(req, res, timecop);
});

app.get("/login", async (req, res) => {
  // The Login/Sign Up Page showing all sign in options
  let timecop = new utils.Timecop();
  await handlers.loginHandler(req, res, timecop);
});

app.get("/logout", async (req, res) => {
  // The Login/Sign Up Page showing all sign in options
  let timecop = new utils.Timecop();
  await handlers.logoutHandler(req, res, timecop);
});

app.use(async (req, res) => {
  // 404 here, keep at last position
  await utils.displayError(req, res, {
      error: `The page '${req.url}' cannot be found.`,
      dev: DEV,
      timecop: false,
      page: {
        name: "PPR Error Page",
        og_url: "https://web.pulsar-edit.dev/packages",
        og_description: "The Pulsar Package Repository",
        og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
        og_image_type: "image/svg+xml"
      },
      status_to_display: 404
    });
});

module.exports = app;
