const express = require("express");
const utils = require("./utils.js");
const superagent = require("superagent");
const app = express();
const port = parseInt(process.env.PORT) || 8080;
const apiurl = process.env.APIURL || "https://api.pulsar-edit.dev";

app.get("/packages/:packageName", async (req, res) => {
  let params = {
    kind: utils.queryKind(req),
    theme: utils.queryTheme(req)
  };

  try {

    let api = await superagent.get(`${apiurl}/api/packages/${decodeURIComponent(req.params.packageName)}`).query(req.query);
    let img = await utils.generateImage(api.body, params.kind, params.theme);
    res.status(200).setHeader('Content-Type', 'image/png').end(img);
    console.log(`Served Social Image Card: ${params.kind} for ${req.params.packageName}`);

  } catch(err) {
    console.log(`Error on /packages/${req.params.packageName}: ${err}`);
    await utils.displayError(req, res, 505);
  }
});

app.get("/dev/packages/:packageName", async (req, res) => {
  let params = {
    kind: utils.queryKind(req),
    theme: utils.queryTheme(req),
  };

  if (process.env.PULSAR_STATUS === "dev") {
    try {

      let api = await superagent.get(`${apiurl}/api/packages/${decodeURIComponent(req.params.packageName)}`).query(req.query);
      let page = await utils.generateImageHTML(api.body, params.kind);
      res.send(page);
      console.log(`Served Dev Social Image Card: ${params.kind} for ${req.params.packageName}`);

    } catch(err) {
      console.log(err);
      await utils.displayError(req, res, 505);
    }
  } else {
    res.status(503).json({ message: "This service is only available during Development Runtime" });
  }
});

app.use(async (req, res) => {
  await utils.displayError(req, res, 404);
});

app.listen(port, () => {
  console.log(`Social Image Card Microservice Exposed on port: ${port}`);
});
