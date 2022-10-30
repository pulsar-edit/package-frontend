const app = require("./main.js");
const { port } = require("./config.js").getConfig();
const logger = require("./logger.js");

const serve = app.listen(port, () => {
  logger.infoLog(`Pulsar Package Web Server Listening on port ${port}`);
});

process.on("SIGTERM", async () => {
  await exterminate("SIGTERM");
});

process.on("SIGINT", async () => {
  await exterminate("SIGINT");
});

async function exterminate(callee) {
  console.log(`${callee} signal received: closing HTTP Server.`);
  // any shutdown functions here.
  serve.close(() => {
    console.log("HTTP Server Closed.");
  });
}
