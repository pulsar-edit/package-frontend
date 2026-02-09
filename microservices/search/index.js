const express = require("express");
const Search = require("./search.js");

const app = express();
const port = parseInt(process.env.PORT) || 8080;
const apiurl = process.env.APIURL || "https://search.pulsar-edit.dev";
const DOMAIN_MAP = {
  "docs": "docs.pulsar-edit.dev",
  "blog": "blog.pulsar-edit.dev"
};
const INDEXES = {}; // Instances of the search class w/ domain as the key

app.get("/file", async (req, res) => {
  const path = require("path");
  res.sendFile(path.join(__dirname, "search-index.jsonl"));
});

app.post("/reindex/:domain", async (req, res) => {
  // Endpoint to trigger a re-index of content for a given sub-domain
  let domain = req.params.domain;
  domain = DOMAIN_MAP[domain];

  if (!domain) {
    // We don't support whatever domain was provided
    res.status(400).json({ err: "The Domain provided is not supported." });
    return;
  }

  const idx = new Search(domain);
  try {
    await idx.reindex();
  } catch(err) {
    console.error(err);
    res.status(500).json({ err: err.toString() });
    return;
  }

  INDEXES[domain] = idx;

  res.status(201).json({ message: "Successfully reindexed" });

  // After we have returned our response to the user, save our new index
  INDEXES[domain].save();
});

app.get("/search/:domain", async (req, res) => {
  // Endpoint to preform a search of a given sub-domain
  let domain = req.params.domain;
  domain = DOMAIN_MAP[domain];

  if (!domain) {
    // We don't support whatever domain was provided
    res.status(400).json({ err: "The Domain provided is not supported." });
    return;
  }

  if (!INDEXES[domain]) {
    // We don't have the search index for this domain loaded yet
    const idx = new Search(domain);
    try {
      await idx.load();
    } catch(err) {
      console.error(err);
      res.status(500).json({ err: err.toString() });
      return;
    }

    INDEXES[domain] = idx;
  }

  const result = INDEXES[domain].search(req.query.q);

  res.status(200).json({ results: result });
});

app.use(async (req, res) => {
  // 404 error
  res.status(404).json({ message: "Not Found" });
});

app.use((err, req, res, _next) => {
  // Global error handler, for internal logic & ExpressJS errors
  console.error(err);
  res.status(500).json({ err: err.toString() });
});

app.listen(port, () => {
  console.log(`Search Microservice exposed on port: ${port}`);
});
