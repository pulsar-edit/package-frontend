const express = require("express");
const app = express();

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
  
});

// 404 Handler, leave at last position
app.use((req, res) => {

});

module.exports = app;
