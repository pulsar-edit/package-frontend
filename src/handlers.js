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
    const pagination = utils.getPagination(req, res, api);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.render("package_list", { packages: obj, pagination, timecop: timecop.timetable, page: {
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
      og_image: `https://image.pulsar-edit.dev/packages/${obj.name}`,
      og_image_type: "image/png",
      og_image_width: 1200,
      og_image_height: 600,
    }});
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
    const pagination = utils.getPagination(req, res, api);
    timecop.end("api-request");
    timecop.start("transcribe-json");
    let obj = await utils.prepareForListing(api.body);
    timecop.end("transcribe-json");
    res.render("search", { packages: obj, search: req.query.q, pagination, timecop: timecop.timetable, page: {
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

async function downloadLink(req, res) {
  let params = {
    os: req.query.os ?? "",
    type: req.query.type ?? ""
  };

  if (params.os === "" || params.type === "") {
    res.status(503).json({ message: "Invalid Download Parameters provided." });
    return;
  }

  try {
    let baseQuery = `
      query getRepositoryBuildStatuses {
        repository(id: 6483909499158528) {
          builds(branch: "master", last: 10) {
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
            edges {
              cursor
              node {
                id
                status
              }
            }
          }
        }
      }
    `;

    let baseGraph = await superagent.post("https://api.cirrus-ci.com/graphql")
                          .set("Content-Type", "application/json").set("Accept", "application/json")
                          .send({ query: baseQuery });

    let baseResponse = baseGraph.body;

    let buildID;

    for (let i = 0; i < baseResponse.data.repository.builds.edges.length; i++) {
      if (baseResponse.data.repository.builds.edges[i].node.status === "COMPLETED") {
        buildID = baseResponse.data.repository.builds.edges[i].node.id;
        break;
      }
    }

    let buildQuery = `
      query GetTasksFromBuild {
        build(id: "${buildID}") {
          status
          tasks {
            name
            id
          }
        }
      }
    `;

    let buildGraph = await superagent.post("https://api.cirrus-ci.com/graphql")
                            .set("Content-Type", "application/json").set("Accept", "application/json")
                            .send({ query: buildQuery });

    let buildResponse = buildGraph.body;

    let taskid = undefined;

    const findID = function (name, builds) {
      for (let i = 0; i < builds.length; i++) {
        if (builds[i].name == name) {
          return builds[i].id;
        }
      }
      return undefined;
    };

    // While it seems to make total sense to just run `findID(params.os, buildResponse.data.build.tasks)`
    // The reason this was done, so that if these names change at all or more are added, the bulk
    // of responsibility to update will lie soley here. Rather than let possible external links fail and expire.
    // Such as `linux` changing to `Linux`, would only have to be done here rather than every location the link appears.
    switch(params.os) {
      case "linux":
        taskid = findID("linux", buildResponse.data.build.tasks);
        break;
      case "arm_linux":
        taskid = findID("arm_linux", buildResponse.data.build.tasks);
        break;
      case "silicon_mac":
        taskid = findID("silicon_mac", buildResponse.data.build.tasks);
        break;
      case "intel_mac":
        taskid = findID("intel_mac", buildResponse.data.build.tasks);
        break;
      case "windows":
        taskid = findID("windows", buildResponse.data.build.tasks);
        break;
      default:
        taskid = undefined;
        break;
    }

    if (taskid === undefined) {
      res.status(503).json({ message: "Invalid Download Parameters provided." });
      return;
    }

    let taskQuery = `
      query GetTaskDetails {
        task(id: ${taskid}) {
          name
          status
          artifacts {
            name
            type
            format
            files {
              path
              size
            }
          }
        }
      }
    `;

    let taskGraph = await superagent.post("https://api.cirrus-ci.com/graphql")
                          .set("Content-Type", "application/json").set("Accept", "application/json")
                          .send({ query: taskQuery });

    let binaryPath = undefined;

    const findBinary = function (ext, loc, binaries) {
      for (let i = 0; i < binaries.length; i++) {
        if (loc === "start") {
          if (binaries[i].path.startsWith(ext)) {
            return binaries[i].path;
          }
        } else if (loc === "end") {
          if (binaries[i].path.endsWith(ext)) {
            return binaries[i].path;
          }
        }
      }
      return undefined;
    };

    switch(params.type) {
      // Linux Binaries
      case "linux_appimage":
        binaryPath = findBinary(".AppImage", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      case "linux_tar":
        binaryPath = findBinary(".tar.gz", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      case "linux_rpm":
        binaryPath = findBinary(".rpm", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      case "linux_deb":
        binaryPath = findBinary(".deb", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      // Windows Binaries
      case "windows_setup":
        binaryPath = findBinary("binaries/Pulsar Setup", "start", taskGraph.body.data.task.artifacts[0].files);
        break;
      case "windows_portable":
        binaryPath = findBinary(".exe", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      case "windows_blockmap":
        binaryPath = findBinary(".exe.blockmap", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      // MacOS Builds
      case "mac_zip":
        binaryPath = findBinary(".zip", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      case "mac_zip_blockmap":
        binaryPath = findBinary(".zip.blockmap", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      case "mac_dmg":
        binaryPath = findBinary(".dmg", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      case "mac_dmg_blockmap":
        binaryPath = findBinary(".dmb.blockmap", "end", taskGraph.body.data.task.artifacts[0].files);
        break;
      default:
        binaryPath = undefined;
        break;
    }

    if (binaryPath === undefined) {
      res.status(503).json({ message: "Invalid Download Parameters provided." });
      return;
    }

    // Now that we have the binary, it's time to return a redirect.

    res.status(302).redirect(`https://api.cirrus-ci.com/v1/artifact/task/${taskid}/binary/${binaryPath}`);

  } catch(err) {
    console.log(err);
    utils.displayError(req, res, err);
  }
}

async function loginHandler(req, res, timecop) {
  // This is a very simple return with no api, so we will just render
  res.render("login", { timecop: timecop.timetable, page: {
    name: "Pulsar Sign In/Up",
    og_url: "https://web.pulsar-edit.dev/login",
    og_description: "The Pulsar User Sign In Page",
    og_image: "https://web.pulsar-edit.dev/public/pulsar_name.svg",
    og_image_type: "image/svg+xml"
  }});
}

async function logoutHandler(req, res, timecop) {
  // This is a very simple return with no api, so we will just render
  res.render("logout", { timecop: timecop.timetable, page: {
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
  res.render("user_page", { timecop: timecop.timetable, page: {
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
  downloadLink,
  loginHandler,
  logoutHandler,
  userPageHandler,
};
