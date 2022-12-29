
// This File will contian setup of both production server and dev server.

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
  }

  // Importing after Dev handling to ensure any env vars are set properly before
  // module import.
  const app = require("./main.js");
  const port = parseInt(process.env.PORT) || 8080;
  const database = require("./database.js");

  const serve = app.listen(port, () => {
    console.log(`Pulsar Usage Server Listening on Port ${port}`);
  });

  const exterminate - async function (callee) {
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
