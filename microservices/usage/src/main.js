const express = require("express");
const app = express();
const database = require("./database.js");

let valid_services = [];
let valid_resources = [];

console.log(`Are we able to set process variables at runtime: ${process.env.TEST}`);
// Enabled to allow proper IP logging in Google App Engine
app.set("trust proxy", true);

// Declare Middleware to Parse Body content.
app.use(express.json());

app.use((req, res, next) => {
  // used to add the start time of the request to every request.
  req.start = Date.now();
  next();
});

app.get("/", async (req, res) => {
  // This should be the handler to actually display results.
});

app.post("/api", async (req, res) => {
  let params = {
    service: req.body.service ?? null,
    resource: req.body.resource ?? null
  };
  // The Service is the service that is reporting a new addition to the values.
  // The Resource is the resource value that should be incremented.

  // Lets first ensure the service is of a valid value.
  if (!valid_services.includes(params.service)) {
    // Return error
  }

  // Then check that our resource is valid as well.
  if (!valid_resources.includes(params.resource)) {
    // Return error
  }

  // Now lets add the data to the DB

});

// 404 Handler, leave at last position
app.use((req, res) => {

});

module.exports = app;
