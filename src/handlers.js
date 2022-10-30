const superagent = require("superagent");
const utils = require("./utils.js");
const server_version = require("../package.json").version;
const { apiurl } = require("./config.js").getConfig();

async function statusPage(req, res) {
  res.render('status', { message: `Server is up and running ${server_version}` });
}

async function fullListingPage(req, res) {
  superagent
    .get(`${apiurl}/api/packages`)
    .query(req.query)
    .then(ret => {
      res.render('package_list', { packages: ret.body });
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
      res.render('package_list', { packages: ret.body });
    })
    .catch(err => {
      utils.displayError(req, res, err.status);
    });
}

module.exports = {
  statusPage,
  fullListingPage,
  singlePackageListing,
  featuredPackageListing,
};
