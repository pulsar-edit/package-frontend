const path = require("node:path");
const express = require("express");
const server_version = require("./package.json").version;
const Search = require("./search.js");

const app = express();
const port = parseInt(process.env.PORT) || 8080;
const apiurl = process.env.APIURL || "https://search.pulsar-edit.dev";
const DOMAIN_MAP = {
  "docs": "docs.pulsar-edit.dev",
  "blog": "blog.pulsar-edit.dev"
};
const INDEXES = {}; // Instances of the search class w/ domain as the key

app.use((req, res, next) => {
  res.append("Server", `Pulsar Search Microservice/${server_version} (${process.platform})`);
  res.append("Access-Control-Allow-Methods", "GET");

  next();
});

app.post("/reindex/:domain", async (req, res) => {
  // Endpoint to trigger a re-index of content for a given sub-domain
  let domain = req.params.domain;
  domain = DOMAIN_MAP[domain];

  if (!domain) {
    // We don't support whatever domain was provided
    res.status(400).append("Content-Type", "application/problem+json").json({
      type: `${apiurl}/problems/unsupported-domain`,
      status: 400,
      title: "The Domain provided is not supported."
    });
    return;
  }

  const idx = new Search(domain);
  try {
    await idx.reindex();
  } catch(err) {
    console.error("An error occurred when attempting to reindex the domain!");
    console.error(err);

    if (err.toString() === "The data stream is undefined!") {
      res.status(500).append("Content-Type", "application/problem+json").json({
        type: `${apiurl}/problems/unknown-data-stream`,
        status: 500,
        title: "The data stream location couldn't be identified."
      });
    } else {
      res.status(500).append("Content-Type", "application/problem+json").json({
        type: "about:blank",
        status: 500,
        title: "An unexpected problem occurred when attempting to reindex this domain.",
        detail: err.toString()
      });
    }
    return;
  }

  INDEXES[domain] = idx;

  res.status(201).send();
});

app.get("/search/:domain", async (req, res) => {
  // Endpoint to preform a search of a given sub-domain
  let domain = req.params.domain;
  domain = DOMAIN_MAP[domain];

  if (!domain) {
    // We don't support whatever domain was provided
    res.status(400).append("Content-Type", "application/problem+json").json({
      type: `${apiurl}/problems/unsupported-domain`,
      status: 400,
      title: "The Domain provided is not supported."
    });
    return;
  }

  // Add the Access-Control-Allow-Origin for the specific origin we received
  // a request from
  res.append("Access-Control-Allow-Origin", `https://${domain}`);

  if (!INDEXES[domain]) {
    // We don't have the search index for this domain loaded yet
    const idx = new Search(domain);
    try {
      await idx.load();
    } catch(err) {
      console.error(err);
      res.status(500).append("Content-Type", "application/problem+json").json({
        type: "about:blank",
        status: 500,
        title: "An error occurred when attempting to load the needed search index.",
        detail: err.toString()
      });
      return;
    }

    INDEXES[domain] = idx;
  }

  const result = INDEXES[domain].search(req.query.q);

  res.status(200).json({ results: result });
});

app.get("/", async (req, res) => {
  res.sendFile(path.join(__dirname, "resources/index.html"));
});

app.get("/problems/unsupported-domain", async (req, res) => {
  res.sendFile(path.join(__dirname, "resources/problems/unsupported-domain.html"));
});

app.get("/problems/unknown-data-stream", async (req, res) => {
  res.sendFile(path.join(__dirname, "resources/problems/unknown-data-stream.html"));
});

app.get("/robots.txt", async (req, res) => {
  res.sendFile(path.join(__dirname, "resources/robots.txt"));
});

app.get("/sitemap.xml", async (req, res) => {
  res.sendFile(path.join(__dirname, "resources/sitemap.xml"));
});

app.use(async (req, res) => {
  // 404 error
  res.status(404).append("Content-Type", "application/problem+json").json({
    type: "about:blank",
    status: 404,
    title: "Not Found"
  });
});

app.use((err, req, res, _next) => {
  // Global error handler, for internal logic & ExpressJS errors
  console.error(err);
  res.status(500).append("Content-Type", "application/problem+json").json({
    type: "about:blank",
    status: 500,
    title: "An error occurred when attempting to respond to your request.",
    detail: err.toString()
  });
});

app.listen(port, () => {
  console.log(`Search Microservice exposed on port: ${port}`);
});

process.on("SIGTERM", async () => {
  await exterminate();
});

process.on("SIGINT", async () => {
  await exterminate();
});

async function exterminate() {
  app.close();
}
