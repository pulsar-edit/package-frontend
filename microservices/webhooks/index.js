const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const superagent = require("superagent");
const port = parseInt(process.env.PORT) || 8080;
const token = process.env.WEBHOOKS_MICROSERVICE_TOKEN;
const discordSponsorWebhook = process.env.DISCORD_SPONSOR_WEBHOOK;

const jsonParser = bodyParser.json();

// Environment Variables Check

if (typeof token === "undefined" || typeof discordSponsorWebhook === "undefined") {
  if (process.env.PULSAR_STATUS === "dev") {
    // We are in dev mode, assign dev values.
    token = "1234566";
    discordSponsorWebhook = "";

  } else {
    // We are not in dev mode. Our secrets are gone and the application will fail to work.
    console.log("Missing Required Environment Variables! Something has gone wrong!");

    process.exit(1);
  }
}

app.post("/github_sponsors", jsonParser, async (req, res) => {
  let params = {
    token: req.query.token ?? ""
  };

  // The token above is used to ensure only authenticated services can send a request.
  // The token used here will be set when creating the WebHook on GitHub as a parameter
  // in the URL, rather than actual authentication.
  // Then for simplicity we will have a list of valid tokens imported as environment
  // variables that we can then check against.

  if (params.token !== token) {
    console.log("Returning Not Authorized");
    // The request doesn't contain one of our tokens
    res.status(401).json({ message: "Not Authorized" });
    return;
  }

  try {
    // We are authorized, lets parse our data.
    let webhookObj = {
      content: `New GitHub Sponsor Contribution: ${req.body.sender.login} gave ${req.body.sponsorship.tier.name} to Pulsar-Edit!`,
    };

    console.log(`Serving Custom response for ${req.body.sender.login} Sponsorship`);

    const webhook = await superagent.post(discordSponsorWebhook).send(webhookObj);
    // It didn't error we can assume it succeeded.
    res.status(200).end();

  } catch(err) {
    console.log("Caught an error serving our custom response");
    console.log(err);
    res.status(500).json({ message: "Error Occured sending message" });
  }
});

app.use(async (req, res) => {
  res.status(404).json({ message: "Seems this page doesn't exist" });
});

app.listen(port, () => {
  console.log(`Webooks Microservice Exposed on port: ${port}`);
});
