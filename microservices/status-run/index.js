const http = require("node:http");
const https = require("node:https");
const { Storage } = require("@google-cloud/storage");

const PORT = parseInt(process.env.PORT) || 8080;
const GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const GCLOUD_STORAGE_BUCKET = process.env.GCLOUD_STORAGE_BUCKET;

const server = http.createServer(async (req, res) => {
  const path = req.url.split("?"); // strip any query params

  if (path[0] === "/" && req.method === "POST") {
    console.log(`Status-Run triggered by '${req.headers["user-agent"]}'`);

    const job = await run();

    // With our status check done, lets write it to GCP storage
    const storage = new StorageHandler();
    try {
      storage.setup();
      await storage.overwriteStatusFile(JSON.stringify(job));
      res.writeHead(201, { "Content-Type": "application/json" });
      res.write(JSON.stringify({ message: "Successfully updated status file." }));
      res.end();
    } catch(err) {
      console.error(err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.write(JSON.stringify({ message: "Failed to write new status file details", err: err.toString() }));
      res.end();
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: "Location Not Found" }));
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Status-Run Microservice exposed on port: ${PORT}`);
});

async function run() {
  // The bulk of functionality of actually checking the status of various services

  // Initialize an empty, fail first status object
  const status = {
    homepage: { // https://pulsar-edit.dev
      ok: false,
      updated: Date.now(),
      details: null,
      condition: "unknown"
    },
    docs: { // https://docs.pulsar-edit.dev
      ok: false,
      updated: Date.now(),
      details: null,
      condition: "unknown"
    },
    blog: { // https://blog.pulsar-edit.dev
      ok: false,
      updated: Date.now(),
      details: null,
      condition: "unknown"
    },
    api: { // https://api.pulsar-edit.dev
      ok: false,
      updated: Date.now(),
      details: null,
      condition: "unknown"
    },
    image: { // https://image.pulsar-edit.dev
      ok: false,
      updated: Date.now(),
      details: null,
      condition: "unknown"
    },
    download: { // https://download.pulsar-edit.dev
      ok: false,
      updated: Date.now(),
      details: null,
      condition: "unknown"
    }
  };

  // === Homepage Check
  try {
    const homepage = await request({
      hostname: "pulsar-edit.dev",
      path: "/",
      method: "GET",
      headers: {
        "Accept": "text/html",
        "User-Agent": "pulsar-edit/package-frontend/microservices/status-run"
      }
    });

    if (homepage.status === 200 && homepage.headers.server === "GitHub.com") {
      status.homepage.ok = true;
      status.homepage.condition = "Healthy";
      status.homepage.details = "Service is Operational";
    } else {
      status.homepage.ok = false;
      status.homepage.condition = "Unhealthy";
      status.homepage.details = homepage.statusMsg;
    }
  } catch(err) {
    status.homepage.ok = false;
    status.homepage.condition = "Unhealthy";
    status.homepage.details = err.toString();
  }

  // === Docs Check
  try {
    const docs = await request({
      hostname: "docs.pulsar-edit.dev",
      path: "/",
      method: "GET",
      headers: {
        "Accept": "text/html",
        "User-Agent": "pulsar-edit/package-frontend/microservices/status-run"
      }
    });
    if (docs.status === 200 && docs.headers.server === "GitHub.com") {
      status.docs.ok = true;
      status.docs.condition = "Healthy";
      status.docs.details = "Service is Operational";
    } else {
      status.docs.ok = false;
      status.docs.condition = "Unhealthy";
      status.docs.details = docs.statusMsg;
    }
  } catch(err) {
    status.docs.ok = false;
    status.docs.condition = "Unhealthy";
    status.docs.details = err.toString();
  }

  // === Blog Check
  try {
    const blog = await request({
      hostname: "blog.pulsar-edit.dev",
      path: "/",
      method: "GET",
      headers: {
        "Accept": "text/html",
        "User-Agent": "pulsar-edit/package-frontend/microservices/status-run"
      }
    });
    if (blog.status === 200 && blog.headers.server === "GitHub.com") {
      status.blog.ok = true;
      status.blog.condition = "Healthy";
      status.blog.details = "Service is Operational";
    } else {
      status.blog.ok = false;
      status.blog.condition = "Unhealthy";
      status.blog.details = blog.statusMsg;
    }
  } catch(err) {
    status.blog.ok = false;
    status.blog.condition = "Unhealthy";
    status.blog.details = err.toString();
  }

  // === API Check
  try {
    const api = await request({
      hostname: "api.pulsar-edit.dev",
      path: "/",
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "pulsar-edit/package-frontend/microservices/status-run"
      }
    });
    if (api.status === 200 && api.body.includes("Server is up and running")) {
      // TODO: The API has no real status check, but this at least ensures it
      // is up for the most part
      status.api.ok = true;
      status.api.condition = "Healthy";
      status.api.details = "Service is Operational";
    } else {
      status.api.ok = false;
      status.api.condition = "Unhealthy";
      status.api.condition = api.statusMsg;
    }
  } catch(err) {
    status.api.ok = false;
    status.api.condition = "Unhealthy";
    status.api.details = err.toString();
  }

  // === Image Check
  try {
    const image = await request({
      hostname: "image.pulsar-edit.dev",
      path: "/",
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "pulsar-edit/package-frontend/microservices/status-run"
      }
    });
    const imageBody = JSON.parse(image.body);
    if (image.status === 404 && imageBody.message === "Not Found") {
      // TODO: The image microservice contains no health check, so we check that
      // it's running and properly returning a 404 on the homepage
      status.image.ok = true;
      status.image.condition = "Healthy";
      status.image.details = "Service is Operational";
    } else {
      status.image.ok = false;
      status.image.condition = "Unhealthy";
      status.image.details = image.statusMsg;
    }
  } catch(err) {
    status.image.ok = false;
    status.image.condition = "Unhealthy";
    status.image.details = err.toString();
  }

  // === Download Check
  try {
    const download = await request({
      hostname: "download.pulsar-edit.dev",
      path: "/?os=linux&type=linux_appimage",
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "pulsar-edit/package-frontend/microservice/status-run"
      }
    });
    if (download.status === 307 && download.headers.location.startsWith("https://github.com")) {
      // We expect the download microservice to successfully redirect us to GitHub
      status.download.ok = true;
      status.download.condition = "Healthy";
      status.download.details = "Service is Operational";
    } else {
      status.download.ok = false;
      status.download.condition = "Unhealthy";
      status.download.details = download.statusMsg;
    }
  } catch(err) {
    status.download.ok = false;
    status.download.condition = "Unhealthy";
    status.download.details = err.toString();
  }

  // === Return Results
  return status;
}

function request(options) {
  return new Promise((resolve, reject) => {
    let data = {
      body: "",
      status: null,
      statusMsg: null,
      headers: null
    };

    const req = https.request(options, (res) => {
      data.status = res.statusCode;
      data.statusMsg = res.statusMessage;
      data.headers = res.headers;
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data.body += chunk;
      });
      res.on("end", () => {
        resolve(data);
      });
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.end();
  });
}

class StorageHandler {
  constructor() {
    this.gcs;
    this.keyfile = GOOGLE_APPLICATION_CREDENTIALS;
    this.bucketName = GCLOUD_STORAGE_BUCKET;
  }

  setup() {
    this.gcs = new Storage({ keyFilename: this.keyfile });
  }

  async overwriteStatusFile(contents) {
    await this.gcs.bucket(this.bucketName).file("status.json").save(contents);
    return;
  }

}
