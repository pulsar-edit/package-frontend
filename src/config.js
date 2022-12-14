const fs = require("fs");
const yaml = require("js-yaml");

function getConfig() {
  try {
    let data = null;

    try {
      let fileContent = fs.readFileSync("./app.yaml", "utf8");
      data = yaml.load(fileContent);
    } catch(err) {
      if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
        console.error(`Failed to load app.yaml in non-production env! ${err}`);
        process.exit(1);
      } else {
        data = {
          env_variables: {}
        };
      }
    }

    return {
      port: process.env.PORT ? process.env.PORT : data.env_variables.PORT,
      apiurl: process.env.APIURL ? process.env.APIURL : data.env_variables.APIURL,
      debug: process.env.DEBUG ? process.env.DEBUG : data.env_variables.DEBUG,
      GCLOUD_STORAGE_BUCKET: process.env.GCLOUD_STORAGE_BUCKET ? process.env.GCLOUD_STORAGE_BUCKET : data.env_variables.GCLOUD_STORAGE_BUCKET,
      GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? process.env.GOOGLE_APPLICATION_CREDENTIALS : data.env_variables.GOOGLE_APPLICATION_CREDENTIALS,
    };

  } catch(err) {
    console.error(err);
    process.exit(1);
  }
}

module.exports = {
  getConfig
};
