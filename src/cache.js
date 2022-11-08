const { Storage } = require("@google-cloud/storage");
const { GCLOUD_STORAGE_BUCKET, GOOGLE_APPLICATION_CREDENTIALS } = require("./config.js").getConfig();
const logger = require("./logger.js");

let gcs_storage;

let local_cache = {
  featured: undefined,
};

function checkGCS() {
  if (gcs_storage === undefined) {
    gcs_storage = new Storage({
      keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
    });
  }
}

async function getFeatured() {

  if (local_cache.featured !== undefined) {
    // We have a local cache, lets return that
    logger.debugLog("Utilizing Local Cache - Featured");
    return local_cache.featured;

  } else {
    if (GOOGLE_APPLICATION_CREDENTIALS == "no-file") {
      // Having this set as no-file is a supported way to fail gracefully on cache checks.
      return null;
    } else {
      checkGCS();

      try {
        let contents = await gcs_storage
          .bucket(GCLOUD_STORAGE_BUCKET)
          .file("featured-cache.json")
          .download();

        logger.debugLog("Utilizing Remote Cache - Featured");

        local_cache.featured = JSON.parse(contents);
        return local_cache.featured;

      } catch(err) {
        logger.errorLog(`ERROR: ${err}`);
        return null;
      }
    }
  }
}

async function setFeatured(data) {
  if (GOOGLE_APPLICATION_CREDENTIALS == "no-file") {
    logger.debugLog("Application Credentials have been set as special 'no-file', skipping setting Featured Cache.");
  } else {
    checkGCS();

    try {

      await gcs_storage
        .bucket(GCLOUD_STORAGE_BUCKET)
        .file("featured-cache.json")
        .save(JSON.stringify(data, null, 2));

      logger.debugLog(`Featured Remote Cache Updated - ${Date.now()}`);
    } catch(err) {
      logger.errorLog(`Error Updating Featured Remote Cache - ${err}`);
    }
  }
}

module.exports = {
  getFeatured,
  setFeatured,
};
