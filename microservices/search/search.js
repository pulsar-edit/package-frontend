const fs = require("node:fs");
const lunr = require("lunr");

module.exports =
class Search {
  constructor(domain) {
    this.domain = domain; // The domain this search is for
    this.index; // The in-memory index from lunr
    this.isLoaded = false; // If the search index is currently loaded
    this.dirty = false; // If our working index is different from the one on disk
    this.devEnv = false; // If we are in a dev environment
    this.devFileIndex = "./search-index.jsonl";
  }

  // Create a new index
  async reindex() {
    const readline = require("node:readline");

    let stream;
    if (this.devEnv) {
      stream = fs.createReadStream(this.devFileIndex);
    } else {
      const https = require("node:https");
      const assignStream = async () => {
        return new Promise((resolve) => {
          https.get(`https://${this.domain}/search-index.jsonl`, (res) => {
            resolve(res);
          }).on("error", (err) => {
            throw err;
          });
        });
      };

      stream = await assignStream();
    }

    if (!stream) {
      // Failed to create a readable stream
      throw new Error("The data stream is undefined!");
    }

    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    const documents = [];

    rl.on("line", (line) => {
      documents.push(JSON.parse(line));
    });

    rl.on("close", () => {
      // Once we've read the entire stream, we can create our new index
      this.index = lunr(function () {
        this.ref("url");
        this.field("title");
        this.field("body");
        this.metadataWhitelist = ["position"];

        documents.forEach(function (doc) {
          this.add(doc);
        }, this);
      });

      this.isLoaded = true;
      this.dirty = true;
    });
  }

  // Load a search index for this domain
  load() {
    if (this.isLoaded) {
      // We've already loaded an index, we don't need to do it again.
      return;
    }
    // Load index from disk
    const file = fs.readFileSync(`./mnt/${this.domain}.index.json`, { encoding: "utf8" });
    this.index = lunr.Index.load(JSON.parse(file));
  }

  // Save the search engine for this domain to disk
  save() {
    if (this.dirty) {
      // Only save when we have a different copy of the index in memory than on disk
      fs.writeFileSync(`./mnt/${this.domain}.index.json`, JSON.stringify(this.index), { encoding: "utf8" });
    }
  }

  // Search the index
  search(query) {
    if (!query) {
      // We didn't get anything to search with, lets return empty results
      return [];
    }

    if (!this.isLoaded) {
      // Our index isn't loaded, lets load it first
      this.load();
    }

    return this.index.search(query);
  }
}
