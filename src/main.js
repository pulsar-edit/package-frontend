const express = require("express");
const app = express();
const path = require("path");
const utils = require("./utils.js");
const superagent = require("superagent");
const server_version = require("../package.json").version;
const { apiurl } = require("./config.js").getConfig();
const cache = require("./cache.js");

const DEV = process.env.PULSAR_STATUS === "dev" ? true : false;

app.set("views", "./site/templates");
app.set("view engine", "ejs");

app.use((req, res, next) => {
  // Setup redirect of all `web` requests to `packages`
  if (req.subdomains[0] === "web") {
    res.status(301).redirect(`https://packages.pulsar-edit.dev${req.originalUrl}`);
  }
  req.start = Date.now();
  res.append("Server", `Pulsar Package Frontend/${server_version} (${process.platform})`);
  next();
});

app.use("/resources", express.static("./site/resources-generated-serve"));

app.use("/", express.static("./site/resources-static"));

app.get("/", async (req, res) => {
  let timecop = new utils.Timecop();
  timecop.start("cache-check");
  let cached = await cache.getFeatured();

  if (cached !== null) {
    timecop.end("cache-check");
    // We know our cache is good and lets serve the data
    res.append("Server-Timing", timecop.toHeader());
    res.render("home", {
      dev: DEV,
      featured: cached,
      page: utils.getOpenGraphData()
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
      res.append("Server-Timing", timecop.toHeader());
      res.render("home", { dev: DEV, featured: obj, page: utils.getOpenGraphData() });
      // then set featured cache
      cache.setFeatured(obj);
    } catch(err) {
      utils.displayError(req, res, err);
    }
  }
});

app.get("/packages", async (req, res) => {
  // the main package listing
  let timecop = new utils.Timecop();
  timecop.start("api-request");
  try {
    let api = await superagent.get(`${apiurl}/api/packages`)
      .query(req.query);
    const pagination = utils.getPagination(req, api);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.append("Server-Timing", timecop.toHeader());
    res.render(
      "package_list",
      {
        dev: DEV,
        packages: obj,
        pagination,
        serviceName: req.query.service,
        serviceType: req.query.serviceType,
        page: utils.getOpenGraphData({ og_url: "https://packages.pulsar-edit.dev/packages" })
      }
    );
  } catch(err) {
    utils.displayError(req, res, {
      error: utils.modifyErrorText(err),
      dev: DEV,
      page: utils.getOpenGraphData({ og_url: "https://packages.pulsar-edit.dev/packages" })
    });
  }
});

app.get("/packages/featured", async (req, res) => {
  // view list of featured packages
  let timecop = new utils.Timecop();
  timecop.start("api-request");
  try {
    let api = await superagent.get(`${apiurl}/api/packages/featured`).query(req.query);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.append("Server-Timing", timecop.toHeader());
    res.render("package_list", {
      dev: DEV,
      packages: obj,
      page: utils.getOpenGraphData({ name: "Featured Packages", og_url: "https://web.pulsar-edit.dev/packages/featured" })
    });
  } catch(err) {
    utils.displayError(req, res, err);
  }
});

app.get("/packages/search", async (req, res) => {
  // execute a search for packages
  let timecop = new utils.Timecop();
  timecop.start("api-request");
  try {
    let api = await superagent.get(`${apiurl}/api/packages/search`).query(req.query);

    const pagination = utils.getPagination(req, api);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.append("Server-Timing", timecop.toHeader());
    res.render(
      "package_list",
      {
        dev: DEV,
        packages: obj,
        search: req.query.q,
        serviceName: req.query.service,
        serviceType: req.query.serviceType,
        pagination,
        page: utils.getOpenGraphData({
          name: `${req.query.q} - Pulsar Package Search`,
          og_url: `https://packages.pulsar-edit.dev/packages/search?q=${req.query.q}`
        })
      }
    );
  } catch(err) {
    console.log(err);
    utils.displayError(req, res, err);
  }
});

app.get("/packages/:packageName", async (req, res) => {
  // view details of a package
  let timecop = new utils.Timecop();
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
    res.append("Server-Timing", timecop.toHeader());
    res.render("package_page", {
      dev: DEV,
      pack: obj,
      page: utils.getOpenGraphData({
        name: obj.name,
        og_url: `https://packages.pulsar-edit.dev/packages/${obj.name}`,
        og_description: obj.description,
        og_image: `https://image.pulsar-edit.dev/packages/${obj.name}?image_kind=${og_image_kind}&theme=${og_image_theme}`,
        og_image_type: "image/png",
        og_image_width: 1200,
        og_image_height: 600
      })
    });
  } catch(err) {
    let status_to_display = false; // Since the status is ignored if not a number,
    // we initialize as boolean to no-op in the case we don't find a proper status

    const validStatusIs = (val, key) => {
      if (typeof val?.response?.[key] === "boolean" && val.response[key]) {
        return true;
      } else {
        return false;
      }
    };

    if (validStatusIs(err, "notFound")) {
      status_to_display = 404;
    } else if (validStatusIs(err, "unauthorized")) {
      status_to_display = 401;
    } else if (validStatusIs(err, "forbidden")) {
      status_to_display = 403;
    } else if (validStatusIs(err, "badRequest")) {
      status_to_display = 400;
    }

    utils.displayError(req, res, {
      error: utils.modifyErrorText(err),
      dev: DEV,
      page: utils.getOpenGraphData({ og_url: "https://packages.pulsar-edit.dev/packages" }),
      status_to_display: status_to_display
    });
  }
});

app.get("/users", async (req, res) => {
  // The Signed in User Details Page

  // This is the signed in user page.
  // Since we will let the JavaScript on the page handle any API call needed here lets just
  // render a page and not do anything
  res.render("user_page", { dev: DEV, page: utils.getOpenGraphData({
    name: "Pulsar User Account",
    og_url: "https://packages.pulsar-edit.dev/users"
  })});
});

app.get("/login", async (req, res) => {
  // The Login/Sign Up Page showing all sign in options

  // This is a very simple return with no api, so we will just render
  res.render("login", { dev: DEV, page: utils.getOpenGraphData({
    name: "Pulsar Sign In/Up",
    og_url: "https://packages.pulsar-edit.dev/login",
    og_description: "The Pulsar User Sign In Page"
  })});
});

app.get("/logout", async (req, res) => {
  // The Login/Sign Up Page showing all sign in options

  // This is a very simple return with no api, so we will just render
  res.render("logout", { dev: DEV, page: utils.getOpenGraphData({
    name: "Pulsar Logout",
    og_url: "https://packages.pulsar-edit.dev/logout",
    og_description: "The Pulsar Log Out Page"
  })});
});

app.use(async (req, res) => {
  // 404 here, keep at last position
  await utils.displayError(req, res, {
    error: `The page '${req.url}' cannot be found.`,
    dev: DEV,
    page: utils.getOpenGraphData(),
    status_to_display: 404
  });
});

module.exports = app;
