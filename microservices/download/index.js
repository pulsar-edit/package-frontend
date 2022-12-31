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
    await utils.displayError(req, res, {
      code: 503,
      msg: "Missing Required Download Parameters"
    });
    console.log("Download Returned 503 due to missing os or type.");
    return;
  }

  let redirLink = await utils.findLink(params.os, params.type);

  if (!redirLink.ok) {
    await utils.displayError(req, res, redirLink);
    console.log(`Download Returned Error from findLink: ${redirLink.msg}`);
    return;
  }

  res.status(302).redirect(redirLink.content);
  console.log(`Download Returned: OS: ${params.os} - TYPE: ${params.type} - URL: ${redirLink.content}`);
});

app.use(async (req, res) => {
  await utils.displayError(req, res, {
    code: 404,
    msg: "Not Found"
  });
});

app.listen(port, () => {
  console.log(`Download Microservice Exposed on port: ${port}`);
});
