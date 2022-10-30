/**
 * @module logger
 * @desc Allows easy logging of the server. Allowing it to become simple to add additional
 * logging methods if a log server is ever implemented.
 * @implements {config}
 */

const { debug } = require("./config.js").getConfig();

/**
 * @function httpLog
 * @desc The standard logger for HTTP calls. Logging in a modified 'Apache Combined Log Format'.
 * @param {object} req - The `Request` object inherited from the Express endpoint.
 * @param {object} res - The `Response` object inherited from the Express endpoint.
 * @example <caption>Logging Output Format</caption>
 * HTTP:: IP [DATE (as ISO String)] "HTTP_METHOD URL PROTOCOL" STATUS_CODE DURATION_OF_REQUESTms
 */
function httpLog(req, res) {
  let date = new Date();
  let duration = Date.now() - req.start;
  console.log(
    `HTTP:: ${req.ip} [${date.toISOString()}] "${req.method} ${req.url} ${
      req.protocol
    }" ${res.statusCode} ${duration}ms`
  );
}

/**
 * @function errorLog
 * @desc An endpoint to log errors, as well as exactly where they occured. Allowing some insight into what caused
 * them, as well as how the server reacted to the end user.
 * @param {object} req - The `Request` object inherited from the Express endpoint.
 * @param {object} res - The `Response` object inherited from the Express endpoint.
 * @param {object|string} err - The error of what happened. Will take a raw error value, or a string created one.
 * @example <caption>Logging Output Format</caption>
 * ERROR:: IP "HTTP_METHOD URL PROTOCOL" STATUS_CODE DURATION_OF_REQUESTms ! ERROR
 */
function errorLog(req, res, err) {
  // this will be a generic error logger to grab some stats about what happened, how the server handled it. And of course the error.
  let duration = Date.now() - req.start;
  console.log(
    `ERROR:: ${req.ip} "${req.method} ${req.url} ${req.protocol}" ${res.statusCode} ${duration}ms ! ${err}`
  );
}

/**
 * @function warningLog
 * @desc An endpoint to log warnings. This should be used for when an error recovered, but the server
 * did its best to recover from it. Providing no error to the end user.
 * @param {object} [req] - The Optional `Request` object inherited from the Express endpoint.
 * @param {object} [res] - The Optional `Response` object inherited from the Express endpoint.
 * @param {object|string} err - The error of what happened. And like `ErrorLog` takes the raw error, or a string created one.
 * @example <caption>Logging Output Format w/ Req and Res.</caption>
 * WARNING:: IP "HTTP_METHOD URL PROTOCOL" STATUS_CODE DURATION_OF_REQUESTms ! ERROR
 * @example <caption>Logging Output Format w/o Req and Res.</caption>
 * WARNING:: ERROR
 */
function warningLog(req, res, err) {
  if (req === undefined || res === undefined || req === null || res === null) {
    console.log(`WARNING:: ${err}`);
  } else {
    let duration = Date.now() - req.start;
    console.log(
      `WARNING:: ${req.ip} "${req.method} ${req.url} ${req.protocol}" ${res.statusCode} ${duration}ms ! ${err}`
    );
  }
}

/**
 * @function infoLog
 * @desc An endpoint to log information only. Used sparingly, but may be helpful.
 * @param {string} value - The value of whatever is being logged.
 * @example <caption>Logging Output Format</caption>
 * INFO:: VALUE
 */
function infoLog(value) {
  console.log(`INFO:: ${value}`);
}

/**
 * @function debugLog
 * @desc An endpoint to log debug information only. This log will only show if enabled in the Config file.
 * That is if the `app.yaml` file has DEBUG as true.
 * @param {string} value - The value of whatever is being logged.
 * @example <caption>Logging Output Format</caption>
 * DEBUG:: VALUE
 */
function debugLog(value) {
  if (debug) {
    console.log(`DEBUG:: ${value}`);
  }
}

module.exports = {
  httpLog,
  errorLog,
  warningLog,
  infoLog,
  debugLog,
};
