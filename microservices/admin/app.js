const express = require("express");
const passport = require("passport");
const session = require("express-session");
const SessionFileStore = require("session-file-store")(session);
const GitHubStrategy = require("passport-github2");
const compression = require("compression");
const ejs = require("ejs");
const config = require("./config.js")();

const app = express();

// --- View Engine Setup ---
app.set("views", "./views");
app.set("view engine", "ejs");

// --- Webserver Setup ---
app.use("/", express.static("./static"));
app.set("trust proxy", true);

// --- Authentication Setup ---
app.use(
  session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new SessionFileStore({
      path: "./sessions",
      ttl: 3600
    }),
  }),
);

app.use(passport.authenticate("session"));

passport.serializeUser((user, cb) => {
  process.nextTick(() => {
    cb(null, user);
    // This will allow the user object being passed to be available via
    // req.session.passport.user
  });
});

passport.deserializeUser((user, cb) => {
  process.nextTick(() => {
    return cb(null, user);
  });
});

passport.use(
  "github",
  new GitHubStrategy({
    clientID: config.GITHUB_CLIENT_ID,
    clientSecret: config.GITHUB_CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:8080/auth/github/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    if (config.ALLOWED_NODE_IDS.includes(profile.nodeId)) {
      const usrObj = {
        id: profile.id,
        nodeId: profile.nodeId,
        displayName: profile.displayName,
        username: profile.username,
        avatar: profile.photos[0].value
      };

      return done(null, usrObj);

    } else {
      console.error(`${profile.nodeId}:${profile.username} attempted to authenticate!`);
      return done(
        `Unallowed user attempted to authenticate: '${profile.username}'!`,
        null
      );
    }
  })
);

// --- Compression Setup ---
app.use(compression());

// --- Authentication Routes ---

app.get("/auth/github",
  passport.authenticate("github", { scope: [ "user:email" ] })
);

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: "/login"
  }),
  (req, res) => {
    // successful authentication, redirect home
    res.redirect("/");
  }
);

// --- Regular Routes ---

const authMiddleware = (req, res, next) => {
  if (config.ALLOWED_NODE_IDS.includes(req.user?.nodeId)) {
    // the user is successfully signed in, and still allowed to view this content
    console.log(`Authenticated '${req.user.username}' to '${req.url}'`);
    next();
  } else {
    // the user is NOT successfully logged in
    res.redirect("/login");
  }
};

app.get("/", authMiddleware, async (req, res) => {

  const template = await ejs.renderFile(
    "./views/home.ejs",
    {
      page: {
        name: "Pulsar Admin Dashboard",
        description: "The dashboard to help manage Pulsar's cloud resources."
      },
      user: req.user
    }
  );

  res.set("Content-Type", "text/html");
  res.status(200).send(template);
  return;
});

app.get("/login", async (req, res) => {

  const template = await ejs.renderFile(
    "./views/login.ejs",
    {
      page: {
        name: "Pulsar Admin Dashboard",
        description: "The dashboard to help manage Pulsar's cloud resources."
      }
    }
  );

  res.set("Content-Type", "text/html");
  res.status(200).send(template);
});

app.use(async (err, req, res, next) => {
  // Having this as the last positional route, ensures it will handle all other
  // unknown routes. Can either be not found or an error from another endpoint
  if (err) {
    console.error(err);
    console.error(`An error was encountered handling the request: ${err.toString()}`);

    const template = await ejs.renderFile(
      "./views/error.ejs",
      {
        page: {
          name: "Error"
        },
        content: err
      }
    );

    res.set("Content-Type", "text/html");
    res.status(500).send(template);
    return;
  } else {
    // return not found page
    const template = await ejs.renderFile(
      "./views/not_found.ejs",
      {
        page: {
          name: "Not Found"
        },
        path: req.path
      }
    );

    res.set("Content-Type", "text/html");
    res.status(404).send(template);
    return;
  }
});

module.exports = app;
