const superagent = require("superagent");
const utils = require("./utils.js");
const server_version = require("../package.json").version;
const { apiurl } = require("./config.js").getConfig();
const cache = require("./cache.js");

const DEV =  process.env.PULSAR_STATUS === "dev" ? true : false;

async function statusPage(req, res) {
  res.render('status', { message: `Server is up and running ${server_version}` });
}

async function fullListingPage(req, res, timecop) {
  timecop.start("api-request");
  try {
    let api = await superagent.get(`${apiurl}/api/packages`)
      .query(req.query);
    const pagination = utils.getPagination(req, api);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.render(
      "package_list",
      {
        dev: DEV,
        packages: obj,
        pagination,
        serviceName: req.query.service,
        serviceType: req.query.serviceType,
        timecop: timecop.timetable,
        page: {
          name: "All Pulsar Packages",
          og_url: "https://web.pulsar-edit.dev/packages",
          og_description: "The Pulsar Package Repository",
          og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
          og_image_type: "image/svg+xml"
        }
      }
    );
  } catch(err) {
    utils.displayError(req, res, {
      error: utils.modifyErrorText(err),
      dev: DEV,
      timecop: false,
      page: {
        name: "PPR Error Page",
        og_url: "https://web.pulsar-edit.dev/packages",
        og_description: "The Pulsar Package Repository",
        og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
        og_image_type: "image/svg+xml"
      }
    });
  }
}

async function singlePackageListing(req, res, timecop) {
  timecop.start("api-request");

  // See if there are any query parameters we want to pass to our OG images.
  let og_image_kind = req.query.image_kind ?? "default";
  let og_image_theme = req.query.theme ?? "light";

  try {
    let api = await superagent.get(`${apiurl}/api/packages/${decodeURIComponent(req.params.packageName)}`).query(req.query);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForDetail(api.body);
    timecop.end("transcribe-json");
    res.render("package_detail", {
      dev: DEV,
      pack: obj,
      timecop: timecop.timetable,
      page: {
        name: obj.name,
        og_url: `https://web.pulsar-edit.dev/packages/${obj.name}`,
        og_description: obj.description,
        og_image: `https://image.pulsar-edit.dev/packages/${obj.name}?image_kind=${og_image_kind}&theme=${og_image_theme}`,
        og_image_type: "image/png",
        og_image_width: 1200,
        og_image_height: 600,
      }
    });
  } catch(err) {
    utils.displayError(req, res, {
      error: utils.modifyErrorText(err),
      dev: DEV,
      timecop: false,
      page: {
        name: "PPR Error Page",
        og_url: "https://web.pulsar-edit.dev/packages",
        og_description: "The Pulsar Package Repository",
        og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
        og_image_type: "image/svg+xml"
      }
    });
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
    res.render("package_list", {
      dev: DEV,
      packages: obj,
      timecop: timecop.timetable,
      page: {
        name: "Featured Packages",
        og_url: "https://web.pulsar-edit.dev/packages/featured",
        og_description: "The Pulsar Package Repository",
        og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
        og_image_type: "image/svg+xml"
      }
    });
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
    res.render("home", {
      dev: DEV,
      featured: cached,
      timecop: timecop.timetable,
      page: homePage
    });
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
      res.render("home", { dev: DEV, featured: obj, timecop: timecop.timetable, page: homePage });
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

    const pagination = utils.getPagination(req, api);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.render(
      "search",
      {
        dev: DEV,
        packages: obj,
        search: req.query.q,
        serviceName: req.query.service,
        serviceType: req.query.serviceType,
        pagination,
        timecop: timecop.timetable,
        page: {
          name: `Search ${req.query.q}`,
          og_url: "https://web.pulsar-edit.dev/packages/search",
          og_description: "The Pulsar Package Repository",
          og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
          og_image_type: "image/svg+xml"
        }
      }
    );
  } catch(err) {
    console.log(err);
    utils.displayError(req, res, err);
  }
}

async function loginHandler(req, res, timecop) {
  // This is a very simple return with no api, so we will just render
  res.render("login", { dev: DEV, timecop: timecop.timetable, page: {
    name: "Pulsar Sign In/Up",
    og_url: "https://web.pulsar-edit.dev/login",
    og_description: "The Pulsar User Sign In Page",
    og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
    og_image_type: "image/svg+xml"
  }});
}

async function logoutHandler(req, res, timecop) {
  // This is a very simple return with no api, so we will just render
  res.render("logout", { dev: DEV, timecop: timecop.timetable, page: {
    name: "Pulsar Logout",
    og_url: "https://web.pulsar-edit.dev/logout",
    og_description: "The Pulsar Log Out Page",
    og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
    og_image_type: "image/svg+xml"
  }});
}

async function userPageHandler(req, res, timecop) {
  // This is the signed in user page.
  // Since we will let the JavaScript on the page handle any API call needed here lets just
  // render a page and not do anything
  res.render("user_page", { dev: DEV, timecop: timecop.timetable, page: {
    name: "Pulsar User Account",
    og_url: "https://web.pulsar-edit.dev/users",
    og_description: "The Pulsar User Account Page",
    og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
    org_image_type: "image/svg+xml"
  }});
}

module.exports = {
  statusPage,
  homePage,
  searchHandler,
  fullListingPage,
  singlePackageListing,
  featuredPackageListing,
  loginHandler,
  logoutHandler,
  userPageHandler,
};
