const fs = require("fs");
const yaml = require("js-yaml");

module.exports =
function getConfig() {
  try {
    let data = null;

    try {
      let fileContent = fs.readFileSync("./env.yaml", "utf8");
      data = yaml.load(fileContent);
    } catch(err) {
      if (process.env.PULSAR_STATUS !== "dev") {
        console.error(`Failed to load env.yaml in non-dev env! ${err}`);
        process.exit(1);
      } else {
        data = {};
      }
    }

    const findValue = (key, def) => {
      return process.env[key] ?? data[key] ?? def;
    };

    return {
      PORT: findValue("PORT", 8080),
      GITHUB_CLIENT_ID: findValue("GITHUB_CLIENT_ID"),
      GITHUB_CLIENT_SECRET: findValue("GITHUB_CLIENT_SECRET"),
      SESSION_SECRET: findValue("SESSION_SECRET"),
      ALLOWED_NODE_IDS: findValue("ALLOWED_NODE_IDS")
    };

  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}
