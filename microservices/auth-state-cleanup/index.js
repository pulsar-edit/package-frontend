const http = require("http");
const port = parseInt(process.env.PORT) || 8080;

// DB variables
const db_host = process.env.DB_HOST;
const db_user = process.env.DB_USER;
const db_pass = process.env.DB_PASS;
const db_db = process.env.DB_DB;
const db_port = process.env.DB_PORT;
const db_ssl_cert = process.env.DB_SSL_CERT;

const sql;

const server = http.createServer(async (req, res) => {
  const path = req.url.split("?"); // strip any query params

  if (path[0] === "/" && req.method === "POST") {

    console.log(`Auth-State-Cleanup Job Triggered: ${req.url} - ${req.getHeader("User-Agent")}`);

    let job = await runJob();

    if (!job.ok) {
      console.log(`Auth-State-Cleanup Job FAILED: ${job}`);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.write(JSON.stringify({ message: "The Job Failed" }));
      res.end();
    }

    // The job succeeded
    console.log(`Auth-State-Cleanup Job SUCCESS: ${job.content}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: "Success!" }));
    res.end();

    // Disconnect our DB connection
    shutdownSQL();

  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.write(JSON.stringify({ message: "Location Not Found" }));
    res.end();
  }
});

server.listen(port, () => {
  console.log(`Auth-State-Cleanup Microservice Exposed on Port: ${port}`);
});

function setupSQL() {
  return process.env.PULSAR_STATUS === "dev"
    ? postgres({
      host: db_host,
      username: db_username,
      database: db_db,
      port: db_port
    })
    : postgres({
      host: db_host,
      username: db_username,
      password: db_pass,
      database: db_db,
      port: db_port,
      ssl: {
        rejectUnauthorized: true,
        ca: db_ssl_cert
      }
    });
}

function shutdownSQL() {
  if (sql !== undefined) {
    sql.end();
    console.log("Auth-State-Cleaup Shutdown SQL Connection!");
  }
  return;
}

async function runJob() {
  try {
    sql ??= setupSQL();

    const command = await sql`
      DELETE FROM authstate
      WHERE created < CURRENT_TIMESTAMP - INTERVAL '10 minutes';
    `;

    console.log("Auth-State-Cleanup Run with output below:");
    console.log(command);

    return {
      ok: true,
      content: command
    };

  } catch(err) {
    console.log("Auth-State-Cleanup Encountered an Error!");
    console.log(err);
    return {
      ok: false,
      content: err
    };
  }
}
