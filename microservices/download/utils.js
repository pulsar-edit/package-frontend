const superagent = require("superagent");

function query_os(req) {
  let prov = req.query.os ?? "";
  let valid = [ "linux", "arm_linux", "silicon_mac", "intel_mac", "windows" ];

  return valid.includes(prov) ? prov : false;
}

function query_type(req) {
  let prov = req.query.type ?? "";
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
    res.status(errMsg.code).json(errMsg.msg);
    return;
  } else {
    // Have a default error handler
    res.status(505).json({ message: "Server Error" });
    return;
  }
}

async function findLink(os, type) {
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
                          .set("Content-Type", "application/json")
                          .set("Accept", "application/json")
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
                            .set("Content-Type", "application/json")
                            .set("Accept", "application/json")
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
    switch(os) {
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
      return {
        ok: false,
        code: 503,
        msg: "Invalid OS Download Parameters Provided."
      };
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
                          .set("Content-Type", "application/json")
                          .set("Accept", "application/json")
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

    switch(type) {
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
      return {
        ok: false,
        code: 503,
        msg: "Invalid TYPE Download Parameters Provided"
      };
    }

    // Now that we have the binary, it's time to return a redirect.
    return {
      ok: true,
      content: `https://api.cirrus-ci.com/v1/artifact/task/${taskid}/binary/${binaryPath}`
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
