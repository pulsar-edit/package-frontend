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
  superagent
    .get(`${apiurl}/api/packages`)
    .query(req.query)
    .then(ret => {
      timecop.end("api-request");
      timecop.start("transcribe-json");
      utils.prepareForListing(ret.body)
        .then(pack => {
          timecop.end("transcribe-json");
          res.render('package_list', { packages: pack, timecop: timecop.timetable });
        });
    })
    .catch(err => {
      utils.displayError(req, res, err.status);
    });
}

async function singlePackageListing(req, res, timecop) {
  timecop.start("api-request");
  superagent
    .get(`${apiurl}/api/packages/${decodeURIComponent(req.params.packageName)}`)
    .query(req.query)
    .then(ret => {
      timecop.end("api-request");
      timecop.start("transcribe-json");
      utils.prepareForDetail(ret.body)
        .then(pack => {
          timecop.end("transcribe-json");
          res.render('package_detail', { pack: pack, timecop: timecop.timetable });
        });
    })
    .catch(err => {
      utils.displayError(req, res, err.status);
    });
}

async function singlePackageListingEJS(req, res, timecop) {
  timecop.start("api-request");
  superagent
    .get(`${apiurl}/api/packages/${decodeURIComponent(req.params.packageName)}`)
    .query(req.query)
    .then(ret => {
      timecop.end("api-request");
      timecop.start("transcribe-json");
      utils.prepareForDetail(ret.body)
        .then(pack => {
          timecop.end("transcribe-json");
          res.render('package_detail', { pack: pack, timecop: timecop.timetable });
        });
    })
    .catch(err => {
      utils.displayError(req, res, err.status);
    });
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
  superagent
    .get(`${apiurl}/api/packages/featured`)
    .query(req.query)
    .then(ret => {
      timecop.end("api-request");
      timecop.start("transcribe-json");
      utils.prepareForListing(ret.body)
        .then(pack => {
          timecop.end("transcribe-json");
          res.render('package_list', { packages: pack, timecop: timecop.timetable });
        });
    })
    .catch(err => {
      utils.displayError(req, res, err.status);
    });
}

async function homePage(req, res, timecop) {
  // First lets check the cache
  timecop.start("cache-check");
  let cached = await cache.getFeatured();

  if (cached !== null) {
    timecop.end("cache-check");
    // We know our cache is good and lets serve the data
    res.render('home', { featured: cached, timecop: timecop.timetable });
  } else {
    // the cache is invalid. We need to find the data, and cache it
    timecop.end("cache-check");
    timecop.start("api-request");
    superagent
      .get(`${apiurl}/api/packages/featured`)
      .then(ret => {
        timecop.end("api-request");
        timecop.start("transcribe-json");
        utils.prepareForListing(ret.body)
          .then(pack => {
            timecop.end("transcribe-json");
            res.render('home', { featured: pack, timecop: timecop.timetable });
            // then set featured cache
            cache.setFeatured(pack);
          });
      });
  }
}

async function searchHandler(req, res, timecop) {
  timecop.start("api-request");
  superagent
    .get(`${apiurl}/api/packages/search`)
    .query(req.query)
    .then(ret => {
      timecop.end("api-request");
      timecop.start("transcribe-json");
      utils.prepareForListing(ret.body)
        .then(pack => {
          timecop.end("transcribe-json");
          res.render('search', { packages: pack, search: req.query.q, timecop: timecop.timetable });
        });
    })
    .catch(err => {
      utils.displayError(req, res, err.status);
    });
}

module.exports = {
  statusPage,
  homePage,
  searchHandler,
  fullListingPage,
  singlePackageListing,
  featuredPackageListing,
  singlePackageListingEJS,
  packageImage,
};
