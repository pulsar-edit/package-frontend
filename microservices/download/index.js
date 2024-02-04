const http = require("http");
const utils = require("./utils.js");
const port = parseInt(process.env.PORT) || 8080;

const server = http.createServer(async (req, res) => {
  if (typeof req?.url !== "string"){
    // Not sure if this error condition is even possible, but handling it anyway
    await utils.displayError(req, res, {
      code: 500,
      msg: "Internal Server Error: Misformed URL"
    });
    console.log("Download Returned 500 due to the requested URL not being received as a string internally");
    return;
  }

  // Since req.url is our URL plus query params, lets split them first.
  const url = req.url.split("?");
  const path = url[0];
  const queryParams = url[1];

  // Set our Request Route
  if (path === "/" && req.method === "GET") {

    if (typeof queryParams !== "string"){
      await utils.displayError(req, res, {
        code: 400,
        msg: "Missing Query Parameters"
      });
      console.log("Download Returned 400 due to the requested URL having no query parameters");
      return;
    }

    if (queryParams.length > 100){
      // Longest valid combo is 36 characters ("os=silicon_mac&type=mac_zip_blockmap"),
      // But leaving extra room to update the parameters in the future.
      await utils.displayError(req, res, {
        code: 414,
        msg: "Requested Parameters are Too Long"
      });
      console.log("Download Returned 414 due to the provided parameters being too long");
      return;
    }

    let validatedParams = {
      os: utils.query_os(queryParams),
      type: utils.query_type(queryParams)
    };

    if (!validatedParams.os || !validatedParams.type) {
      await utils.displayError(req, res, {
        code: 400,
        msg: "Required Download Parameters Missing or Invalid"
      });
      console.log("Download Returned 400 due to missing or invalid os or type");
      return;
    }

    let redirLink = await utils.findLink(validatedParams.os, validatedParams.type);

    if (!redirLink.ok) {
      await utils.displayError(req, res, redirLink);
      console.log(`Download Returned Error from findLink: ${redirLink.msg}`);
      return;
    }

    res.writeHead(307, {
      Location: redirLink.content
    }).end();

    console.log(`Download Returned: OS: ${validatedParams.os} - TYPE: ${validatedParams.type} - URL: ${redirLink.content}`);


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
