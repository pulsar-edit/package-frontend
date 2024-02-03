const https = require("node:https");
const bins = require("./bins.js");
let TOKEN = process.env.GH_TOKEN_DOWNLOAD_MICROSERVICE;

// Environment Variables Check

if (typeof TOKEN === "undefined") {
  if (process.env.PULSAR_STATUS !== "dev") {
    // We are not in dev mode. Our auth token is gone, and the application may fail to work
    // due to rate limiting by GitHub for unauthenticated API requests.
    console.log("Missing Required Environment Variable: 'GH_TOKEN_DOWNLOAD_MICROSERVICE'!");
    process.exit(1);
  }
}

function doRequest() {

  const options = {
    hostname: 'api.github.com',
    path: '/repos/pulsar-edit/pulsar-rolling-releases/releases',
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'pulsar-edit/package-frontend/microservices/download',
      'Authorization': `Bearer ${TOKEN}`
    }
  };

  if (process.env.PULSAR_STATUS === "dev") {
    // We don't expect to be authed in dev mode.
    // Fetching releases from GitHub without authentication is fine in dev mode.
    delete options.headers['Authorization'];
  }

  return new Promise((resolve, reject) => {
    let data = '';

    const req = https.request(options, (res) => {
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        // No more data in response.
        resolve(JSON.parse(data));
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
};

function query_os(queryString) {
  if (typeof queryString !== "string") {
    return false;
  }

  const allParams = queryString.split("&");
  const valid = [ "linux", "arm_linux", "silicon_mac", "intel_mac", "windows" ];

  for (const param of allParams) {
    if (param.startsWith("os=")) {
      // Returning a result based on the first "os=" param we encounter.
      // Users should not provide the same param twice, that would be invalid.
      const prov = param.split("=")[1];
      return valid.includes(prov) ? prov : false;
    }
  }

  // No "os" query param was provided, return false
  return false;
}

function query_type(queryString) {
  if (typeof queryString !== "string") {
    return false;
  }

  const allParams = queryString.split("&");
  const valid = [
    "linux_appimage",
    "linux_tar",
    "linux_rpm",
    "linux_deb",
    "windows_setup",
    "windows_portable",
    "windows_blockmap",
    "mac_zip",
    "mac_zip_blockmap",
    "mac_dmg",
    "mac_dmg_blockmap"
  ];

  for (const param of allParams) {
    if (param.startsWith("type=")) {
      // Returning a result based on the first "type=" param we encounter.
      // Users should not provide the same param twice, that would be invalid.
      const prov = param.split("=")[1];
      return valid.includes(prov) ? prov : false;
    }
  }

  // No "type" query param was provided, return false
  return false;
}

async function displayError(req, res, errMsg) {
  if (errMsg.code && errMsg.msg) {

    res.writeHead(errMsg.code, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: errMsg.msg }));
    res.end();

  } else {
    // Default Error Handler
    res.writeHead(500, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: "Server Error" }));
    res.end();
  }
}

async function findLink(os, type) {
  try {

    let releases = await doRequest();

    if (!Array.isArray(releases)) {
      console.error("GitHub Returned invalid data on release request!");
      console.error(releases);

      return {
        ok: false,
        code: 500,
        msg: "Request to GitHub for releases failed."
      };
    }

    // Now these releases should be sorted already, if we find they aren't we might
    // have to add semver as a dep on this microservice, which is no fun since this
    // microservice has 0 deps currently. For now lets assume it's a sorted array
    // This same assumption is made on the `pulsar-updater` core package

    for (const version of releases) {
      for (const asset of version.assets) {

        let name = asset.name;

        let returnObj = {
          ok: true,
          content: asset?.browser_download_url
        };

        // Ensure we have valid data to work with
        if (typeof name !== "string" || typeof returnObj.content !== "string") {
          continue;
        }

        if (stringMatchesBin(name, bins[os][type])) {
          return returnObj;
        }

      }
    }

    // If we get to this point it means the above loop didn't return.
    // Meaning we couldn't find a single valid asset among any versions
    // So we will return an error

    return {
      ok: false,
      code: 404,
      msg: `Unable to find any assets matching the provided parameters: os=${os};type=${type}`
    };

  } catch(err) {
    console.log(err);
    return {
      ok: false,
      code: 500,
      msg: "Server Error While Finding Link"
    };
  }
}

function stringMatchesBin(str, bin = {}) {
  // Takes an object from the `bins.js` file and checks it against the provided
  // string.

  let checkCount = 0;
  let passingCheckCount = 0;

  if (typeof bin.startsWith === "string") {
    checkCount++;
    if (str.startsWith(bin.startsWith)) {
      passingCheckCount++;
    }
  }

  if (typeof bin.endsWith === "string") {
    checkCount++;
    if (str.endsWith(bin.endsWith)) {
      passingCheckCount++;
    }
  }

  if (typeof bin.endsWithNot === "string") {
    checkCount++;
    if (!str.endsWith(bin.endsWithNot)) {
      passingCheckCount++;
    }
  }

  if (passingCheckCount === checkCount && checkCount != 0) {
    // if we passed all checks, and there were actual checks
    return true;
  } else {
    return false;
  }
}

module.exports = {
  query_os,
  query_type,
  displayError,
  findLink,
};
