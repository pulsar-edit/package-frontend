const express = require("express");
const app = express();
const path = require("path");
const handlers = require("./handlers.js");
const utils = require("./utils.js");

app.set("views", "./ejs-views");
app.set("view engine", "ejs");

//app.set("views", "./views");
//app.set("view engine", "pug");


app.use((req, res, next) => {
  req.start = Date.now();
  next();
});

app.use("/public", express.static("./public"));

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
  //await handlers.singlePackageListing(req, res, timecop);
  await handlers.singlePackageListingEJS(req, res, timecop);
});

app.get("/image/packages/:packageName", async (req, res) => {
  await handlers.packageImage(req, res);
});

// Static specfic files to send.

app.get("/robots.txt", (req, res) => {
  res.sendFile(path.resolve("./static/robots.txt"));
});

app.get("/sitemap.xml", (req, res) => {
  res.sendFile(path.resolve("./static/sitemap.xml"));
});

app.use(async (req, res) => {
  // 404 here, keep at last position
  await utils.displayError(req, res, 404);
});

module.exports = app;
