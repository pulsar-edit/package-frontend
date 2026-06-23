const app = require("./app.js");
const { PORT } = require("./config.js")();

const serve = app.listen(PORT, () => {
  console.log(`Pulsar Admin Dashboard listening on port: ${PORT}`);
});

process.on("SIGTERM", async () => {
  await exterminate("SIGTERM");
});

process.on("SIGINT", async () => {
  await exterminate("SIGINT");
});

async function exterminate(callee) {
  console.log(`${callee} signal received: closing HTTP server.`);
  // shutdown funcs
  serve.close(() => {
    console.log("HTTP Server Closed");
  });
}
