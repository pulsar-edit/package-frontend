const http = require("http");
const utils = require("./utils.js");
const port = parseInt(process.env.PORT) || 8080;

const server = http.createServer(async (req, res) => {
  // Since req.url is our URL plus query params, lets split them first.
  const url = req.url.split("?");
  const path = url[0];
  const queryParams = url[1];

  // Set our Request Route
  if (path === "/" && req.method === "GET") {

    let params = {
      os: utils.query_os(queryParams),
      type: utils.query_type(queryParams)
    };

    if (!params.os || !params.type) {
      await utils.displayError(req, res, {
        code: 503,
        msg: "Missing Required Download Parameters"
      });
      console.log("Download Returned 503 due to missing os or type");
      return;
    }

    let redirLink = await utils.findLink(params.os, params.type);

    if (!redirLink.ok) {
      await utils.displayError(req, res, redirLink);
      console.log(`Download Returned Error from findLink: ${redirLink.msg}`);
      return;
    }

    res.writeHead(307, {
      Location: redirLink.content
    }).end();

    console.log(`Download Returned: OS: ${params.os} - TYPE: ${params.type} - URL: ${redirLink.content}`);


  } else {
    // If we find no match to our route.

    await utils.displayError(req, res, {
      code: 404,
      msg: "Not Found"
    });
  }
});

server.listen(port, () => {
  console.log(`Download Microservice Exposed on port: ${port}`);
});
