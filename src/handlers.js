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
    res.render("package_list", { packages: obj, timecop: timecop.timetable, page: {
      name: "All Pulsar Packages",
      og_url: "https://web.pulsar-edit.dev/packages",
      og_description: "The Pulsar Package Repository",
      og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
      og_image_type: "image/svg+xml"
    }});
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
    res.render("package_detail", { pack: obj, timecop: timecop.timetable, page: {
      name: obj.name,
      og_url: `https://web.pulsar-edit.dev/packages/${obj.name}`,
      og_description: obj.description,
      og_image: `https://web.pulsar-edit.dev/image/packages/${obj.name}`,
      og_image_type: "image/png",
      og_image_width: 1200,
      og_image_height: 600,
    }});
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

async function devPackageImage(req, res) {
  if (process.env.PULSAR_STATUS === "dev") {
    try {
      let api = await superagent.get(`${apiurl}/api/packages/${decodeURIComponent(req.params.packageName)}`).query(req.query);
      let page = await utils.generateImageHTML(api.body, "default");
      res.send(page);
    } catch(err) {
      console.log(err);
      utils.displayError(req, res, err);
    }
  } else {
    res.status(503).json({ message: "This service is only available during Development Runtime" });
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
    res.render("package_list", { packages: obj, timecop: timecop.timetable, page: {
      name: "Featured Packages",
      og_url: "https://web.pulsar-edit.dev/packages/featured",
      og_description: "The Pulsar Package Repository",
      og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
      og_image_type: "image/svg+xml"
    }});
  } catch(err) {
    utils.displayError(req, res, err);
  }
}

async function homePage(req, res, timecop) {
  timecop.start("cache-check");
  let cached = await cache.getFeatured();

  let homePage = {
    name: "Pulsar Package Explorer",
    og_url: "https://web.pulsar-edit.dev/",
    og_description: "The Pulsar Package Repository",
    og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
    og_image_type: "image/svg+xml"
  };

  if (cached !== null) {
    timecop.end("cache-check");
    // We know our cache is good and lets serve the data
    res.render("home", { featured: cached, timecop: timecop.timetable, page: homePage });
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
      res.render("home", { featured: obj, timecop: timecop.timetable, page: homePage });
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
    res.render("search", { packages: obj, search: req.query.q, timecop: timecop.timetable, page: {
      name: `Search ${req.query.q}`,
      og_url: "https://web.pulsar-edit.dev/packages/search",
      og_description: "The Pulsar Package Repository",
      og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
      og_image_type: "image/svg+xml"
    }});
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
  devPackageImage,
};
