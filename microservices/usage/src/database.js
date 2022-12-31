const fs = require("fs");
const postgres = require("postgres");

let sqlStorage; // SQL Object to interact with the DB

function setupSQL() {
  return process.env.PULSAR_STATUS === "dev"
    ? postgres({
        host: process.env.DB_HOST,
        username: process.env.DB_USER,
        database: process.env.DB_DB,
        port: process.env.DB_PORT
      })
    : postgres({
        host: process.env.DB_HOST,
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_DB,
        port: process.env.DB_PORT,
        ssl: {
          rejectUnauthorized: true,
          ca: fs.readFileSync(process.env.DB_SSL_CERT).toString()
        }
      });
}

async function shutdownSQL() {
  if (sqlStorage !== undefined) {
    sqlStorage.end();
    console.log("SQL Server Shutdown");
  }
}

async function addData(service, resource) {
  
}

module.exports = {
  setupSQL,
  shutdownSQL,
};
