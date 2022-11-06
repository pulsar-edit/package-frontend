const superagent = require("superagent");
const utils = require("./utils.js");
const server_version = require("../package.json").version;
const { apiurl } = require("./config.js").getConfig();
const cache = require("./cache.js");

async function statusPage(req, res) {
  res.render('status', { message: `Server is up and running ${server_version}` });
}

async function fullListingPage(req, res) {
  superagent
    .get(`${apiurl}/api/packages`)
    .query(req.query)
    .then(ret => {

      utils.prepareForListing(ret.body)
        .then(pack => {
          res.render('package_list', { packages: pack });
        });
    })
    .catch(err => {
      utils.displayError(req, res, err.status);
    });
}

async function singlePackageListing(req, res) {
  superagent
    .get(`${apiurl}/api/packages/${decodeURIComponent(req.params.packageName)}`)
    .query(req.query)
    .then(ret => {
      utils.prepareForDetail(ret.body)
        .then(pack => {
          res.render('package_detail', { pack: pack });
        });
    })
    .catch(err => {
      utils.displayError(req, res, err.status);
    });
}

async function featuredPackageListing(req, res) {
  superagent
    .get(`${apiurl}/api/packages/featured`)
    .query(req.query)
    .then(ret => {
      utils.prepareForListing(ret.body)
        .then(pack => {
          res.render('package_list', { packages: pack });
        });
    })
    .catch(err => {
      utils.displayError(req, res, err.status);
    });
}

async function homePage(req, res) {
  // First lets check the cache
  let cached = await cache.getFeatured();

  if (cached !== null) {
    // We know our cache is good and lets serve the data
    res.render('home', { featured: cached });
  } else {
    // the cache is invalid. We need to find the data, and cache it
    superagent
      .get(`${apiurl}/api/packages/featured`)
      .then(ret => {
        utils.prepareForListing(ret.body)
          .then(pack => {
            res.render('home', { featured: pack });
            // then set featured cache
            cache.setFeatured(pack);
          });
      });
  }
}

async function searchHandler(req, res) {
  superagent
    .get(`${apiurl}/api/packages/search`)
    .query(req.query)
    .then(ret => {
      utils.prepareForListing(ret.body)
        .then(pack => {
          res.render('search', { packages: pack, search: req.query.q });
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
};
