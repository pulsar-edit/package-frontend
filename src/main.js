const express = require("express");
const app = express();
const handlers = require("./handlers.js");
const utils = require("./utils.js");

app.set("views", "./views");
app.set("view engine", "pug");

app.use((req, res, next) => {
  req.start = Date.now();
  next();
});

app.use("/public", express.static("./public"));

app.get("/", async (req, res) => {
  // This should later on include features like a search bar, and likely showing the featured packages section
  // and so on.
  await handlers.homePage(req, res);
});

app.get("/status", async (req, res) => {
  await handlers.statusPage(req, res);
});

app.get("/packages", async (req, res) => {
  // the main package listing
  await handlers.fullListingPage(req, res);
});

app.get("/packages/featured", async (req, res) => {
  // view list of featured packages
  await handlers.featuredPackageListing(req, res);
});

app.get("/packages/search", async (req, res) => {
  // execute a search for packages
  await handlers.searchHandler(req, res);
});

app.get("/packages/:packageName", async (req, res) => {
  // view details of a package
  await handlers.singlePackageListing(req, res);
});

// Static specfic files to send.

app.get("/robots.txt", (req, res) => {
  res.sendFile("./static/robots.txt");
});

app.get("/sitemap.xml", (req, res) => {
  res.sendFile("./static/sitemap.xml");
});

app.use(async (req, res) => {
  // 404 here, keep at last position
  await utils.displayError(req, res, 404);
});

module.exports = app;
