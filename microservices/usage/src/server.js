
// This File will contian setup of both production server and dev server.

const env = require("../env.json");

let dbSetup, dbTeardown;
// We define ^^^ just in case we are in a dev instance.

async function setup() {
  if (process.env.PULSAR_STATUS === "dev") {
    // we are in dev mode
    dbSetup = require("../node_modules/@databases/pg-test/jest/globalSetup");
    dbTeardown = require("../node_modules/@databases/pg-test/jest/globalTeardown");

    await dbSetup();

    let db_url = process.env.DATABASE_URL;
    let db_url_reg = /postgres:\/\/([\/\S]+)@([\/\S]+):(\d+)\/([\/\S]+)/;
    let db_url_parsed = db_url_reg.exec(db_url);

    process.env.DB_HOST = db_url_parsed[2];
    process.env.DB_USER = db_url_parsed[1];
    process.env.DB_DB = db_url_parsed[4];
    process.env.DB_PORT = db_url_parsed[3];

    process.env.PORT = 8080;
  } else {
    // Now when not in Dev Mode, we need to configure our environment variables from the env JSON file.
    process.env.DB_HOST = env.DB_HOST;
    process.env.DB_USER = env.DB_USER;
    process.env.DB_DB = env.DB_DB;
    process.env.DB_PASS = env.DB_PASS;
    process.env.DB_PORT = env.DB_PORT;
    process.env.DB_SSL_CERT = env.DB_SSL_CERT;
    process.env.PORT = env.PORT;
    process.env.TEST = env.TEST;
  }

  // Importing after Dev handling to ensure any env vars are set properly before
  // module import.
  const app = require("./main.js");
  const port = parseInt(process.env.PORT) || 8080;
  const database = require("./database.js");

  const serve = app.listen(port, () => {
    console.log(`Pulsar Usage Server Listening on Port ${port}`);
  });

  const exterminate = async function (callee) {
    console.log(`${callee} signal received: closing HTTP server`);
    await database.shutdownSQL();
    if (dbTeardown) {
      await dbTeardown();
    }
    serve.close(() => {
      console.log("HTTP Server Closed.");
    });
  };

  process.on("SIGTERM", async () => {
    await exterminate("SIGTERM");
  });

  process.on("SIGINT", async () => {
    await exterminate("SIGINT");
  });
}

setup();
