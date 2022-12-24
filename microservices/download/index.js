const express = require("express");
const utils = require("./utils.js");
const app = express();
const port = parseInt(process.env.PORT) || 8080;

app.get("/", async (req, res) => {
  let params = {
    os: utils.query_os(req),
    type: utils.query_type(req)
  };

  if (!params.os || !params.type) {
    await utils.displayError(req, res, 503);
    console.log("Download Returned 503 due to missing os or type.");
    return;
  }

  let redirLink = await utils.findLink(params.os, params.type);

  if (!redirLink.ok) {
    await utils.displayError(req, res, 505);
    console.log(`Download Returned Error from findLink: ${redirLink.content}`);
    return;
  }

  res.status(302).redirect(redirLink.content);
  console.log(`Download Returned: ${redirLink.content}`);
});

app.use(async (req, res) => {
  await utils.displayError(req, res, 404);
});

app.listen(port, () => {
  console.log(`Download Microservice Exposed on port: ${port}`);
});
