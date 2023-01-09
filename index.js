const express = require("express");

const app = express();
const port = 3000;

require("dotenv").config();

const session = require("express-session");

const secret = process.env.SESSION_SECRET;
const store = new session.MemoryStore();
const protect = (req, res, next) => {
  const { authenticated } = req.session;

  if (!authenticated) {
    res.sendStatus(401);
  } else {
    next();
  }
};

const rateLimit = require("express-rate-limit");

const winston = require("winston");
const expressWinston = require("express-winston");
const responseTime = require("response-time");

app.use(
  session({
    secret,
    resave: false,
    saveUninitialized: true,
    store,
  })
);

app.use(responseTime());

app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.json(),
    statusLevels: true,
    meta: false,
    msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
    expressFormat: true,
    ignoreRoute() {
      return false;
    },
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 calls
  })
);

app.get("/", (req, res) => {
  const { name = 'user' } = req.query;
  res.send(`Hello ${name}!`);
});

app.get("/login", (req, res) => {
  const { authenticated } = req.session;

  if (!authenticated) {
    req.session.authenticated = true;
    res.send("Successfully authenticated");
  } else {
    res.send("Already authenticated");
  }
});

app.get("/logout", protect, (req, res) => {
  req.session.destroy(() => {
    res.send("Successfully logged out");
  });
});

app.get("/protected", protect, (req, res) => {
  const { name = "user" } = req.query;
  res.send(`Hello ${name}!`);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

