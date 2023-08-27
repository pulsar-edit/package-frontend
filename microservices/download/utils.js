const https = require("node:https");

function doRequest() {

  const options = {
    hostname: 'api.github.com',
    path: '/repos/pulsar-edit/pulsar-rolling-releases/releases',
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'pulsar-edit/package-frontend/microservices/download'
    }
  };

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

function query_os(req) {
  let raw = req; // The URL string containing any number of query params.
  let prov = undefined;

  let full = raw.split("&");

  for (const param of full) {
    if (param.startsWith("os=")) {
      prov = param.split("=")[1];
      break;
    }
  }

  if (prov === undefined) {
    return false;
  }

  let valid = [ "linux", "arm_linux", "silicon_mac", "intel_mac", "windows" ];

  return valid.includes(prov) ? prov : false;
}

function query_type(req) {
  let raw = req;
  let prov = undefined;

  let full = raw.split("&");

  for (const param of full) {
    if (param.startsWith("type=")) {
      prov = param.split("=")[1];
      break;
    }
  }

  if (prov === undefined) {
    return false;
  }

  let valid = [
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

  return valid.includes(prov) ? prov : false;
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

    // Now these releases should be sorted already, if we find they aren't we might
    // have to add semver as a dep on this microservice, which is no fun since this
    // microservice has 0 deps currently. For now lets assume it's a sorted array
    // This same assumption is made on the `pulsar-updater` core package

    for (let version of releases) {
      for (let asset of version.assets) {

        let name = asset?.name;

        let returnObj = {
          ok: true,
          content: asset?.browser_download_url
        };

        // Ensure we have valid data to work with
        if (typeof name !== "string" && typeof returnObj.content !== "string") {
          continue;
        }

        if (os === "windows") {
          if (
            type === "windows_setup" &&
            name.startsWith("Pulsar.Setup") &&
            name.endsWith(".exe")
          ) {

            return returnObj;

          } else if (
            type === "windows_portable" &&
            name.endsWith("-win.zip")
          ) {

            return returnObj;

          } else if (
            type === "windows_blockmap" &&
            name.startsWith("Pulsar.Setup") &&
            name.endsWith(".exe.blockmap")
          ) {

            return returnObj;

          }
        } else if (os === "silicon_mac") {
          if (
            type === "mac_zip" &&
            name.endsWith("-arm64-mac.zip")
          ) {

            return returnObj;

          } else if (
            type === "mac_zip_blockmap" &&
            name.endsWith("-arm64-mac.zip.blockmap")
          ) {

            return returnObj;

          } else if (
            type === "mac_dmg" &&
            name.endsWith("-arm64.dmg")
          ) {

            return returnObj;

          } else if (
            type === "mac_dmg_blockmap" &&
            name.endsWith("-arm64.dmg.blockmap")
          ) {

            return returnObj;

          }
        } else if (os === "intel_mac") {
          if (
            type === "mac_zip" &&
            name.endsWith("-mac.zip") &&
            !name.endsWith("-arm64-mac.zip")
          ) {

            return returnObj;

          } else if (
            type === "mac_zip_blockmap" &&
            name.endsWith("-mac.zip.blockmap") &&
            !name.endsWith("-arm64-mac.zip.blockmap")
          ) {

            return returnObj;

          } else if (
            type === "mac_dmg" &&
            name.endsWith(".dmg") &&
            !name.endsWith("-arm64.dmg")
          ) {

            return returnObj;

          } else if (
            type === "mac_dmg_blockmap" &&
            name.endsWith(".dmg.blockmap") &&
            !name.endsWith("-arm64.dmg.blockmap")
          ) {

            return returnObj;

          }
        } else if (os === "arm_linux") {
          if (
            type === "linux_appimage" &&
            name.endsWith("-arm64.AppImage")
          ) {

            return returnObj;

          } else if (
            type === "linux_tar" &&
            name.endsWith("-arm64.tar.gz")
          ) {

            return returnObj;

          } else if (
            type === "linux_rpm" &&
            name.endsWith(".aarch64.rpm")
          ) {

            return returnObj;

          } else if (
            type === "linux_deb" &&
            name.endsWith("_arm64.deb")
          ) {

            return returnObj;

          }
        } else if (os === "linux") {
          if (
            type === "linux_appimage" &&
            name.endsWith(".AppImage") &&
            !name.endsWith("-arm64.AppImage")
          ) {

            return returnObj;

          } else if (
            type === "linux_tar" &&
            name.endsWith(".tar.gz") &&
            !name.endsWith("-arm64.tar.gz")
          ) {

            return returnObj;

          } else if (
            type === "linux_rpm" &&
            name.endsWith(".x86_64.rpm")
          ) {

            return returnObj;

          } else if (
            type === "linux_deb" &&
            name.endsWith("_amd64.deb")
          ) {

            return returnObj;

          }
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
      code: 505,
      msg: "Server Error"
    };
  }
}

module.exports = {
  query_os,
  query_type,
  displayError,
  findLink,
};
