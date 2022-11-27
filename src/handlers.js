const superagent = require("superagent");
const utils = require("./utils.js");
const server_version = require("../package.json").version;
const { apiurl } = require("./config.js").getConfig();
const cache = require("./cache.js");

async function statusPage(req, res) {
  res.render('status', { message: `Server is up and running ${server_version}` });
}

async function fullListingPage(req, res, timecop) {
  timecop.start("api-request");
  try {
    let api = await superagent.get(`${apiurl}/api/packages`).query(req.query);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.render("package_list", { packages: obj, timecop: timecop.timetable });
  } catch(err) {
    utils.displayError(req, res, err);
  }
}

async function singlePackageListing(req, res, timecop) {
  timecop.start("api-request");
  try {
    let api = await superagent.get(`${apiurl}/api/packages/${decodeURIComponent(req.params.packageName)}`).query(req.query);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForDetail(api.body);
    timecop.end("transcribe-json");
    res.render("package_detail", { pack: obj, timecop: timecop.timetable });
  } catch(err) {
    utils.displayError(req, res, err);
  }
}

async function packageImage(req, res) {
  try {
    let api = await superagent.get(`${apiurl}/api/packages/${decodeURIComponent(req.params.packageName)}`).query(req.query);
    let img = await utils.generateImage(api.body);
    res.status(200).setHeader('Content-Type', 'image/png').end(img);
  } catch(err) {
    utils.displayError(req, res, err);
  }
}

async function featuredPackageListing(req, res, timecop) {
  timecop.start("api-request");
  try {
    let api = await superagent.get(`${apiurl}/api/packages/featured`).query(req.query);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.render("package_list", { packages: obj, timecop: timecop.timetable });
  } catch(err) {
    utils.displayError(req, res, err);
  }
}

async function homePage(req, res, timecop) {
  timecop.start("cache-check");
  let cached = await cache.getFeatured();

  if (cached !== null) {
    timecop.end("cache-check");
    // We know our cache is good and lets serve the data
    res.render("home", { featured: cached, timecop: timecop.timetable });
  } else {
    // the cache is invalid.
    timecop.end("cache-check");
    timecop.start("api-request");
    try {
      let api = await superagent.get(`${apiurl}/api/packages/featured`);
      timecop.end("api-request");
      timecop.start("transcribe-json");
      let obj = await utils.prepareForListing(api.body);
      timecop.end("transcribe-json");
      res.render("home", { featured: obj, timecop: timecop.timetable });
      // then set featured cache
      cache.setFeatured(obj);
    } catch(err) {
      utils.displayError(req, res, err);
    }
  }
}

async function searchHandler(req, res, timecop) {
  timecop.start("api-request");
  try {
    let api = await superagent.get(`${apiurl}/api/packages/search`).query(req.query);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.render("search", { packages: obj, search: req.query.q, timecop: timecop.timetable });
  } catch(err) {
    console.log(err);
    utils.displayError(req, res, err);
  }
}

module.exports = {
  statusPage,
  homePage,
  searchHandler,
  fullListingPage,
  singlePackageListing,
  featuredPackageListing,
  packageImage,
};
