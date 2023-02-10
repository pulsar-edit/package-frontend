#!/usr/bin/env node

/**
 * ============================================================================
 * Description: This script will do all of the following:
 *    - Bump the `package.json` version
 *    - Bump the Docker Artifact Image version in `service.yaml`
 *    - Build the new Image with Docker
 *    - Push this new version up to GitHub
 *    - Push this new version to the Google Cloud Artifact Registry
 *    - Replace the `service.yaml` used in Google App Run
 *    - Optionally replace the `policy.yaml` used in Google App Run
 *
 *
 * Usage: `node ./scripts/bump-microservices`
 * Arguments:
 *    --service=VALUE: The exact name of the microserivce
 *    --bump=VALUE: The type of version bump. Following npm-version [1]
 *    --policy=VALUE: Boolean on whether to update the `policy.yaml`
 *
 * [1]: https://docs.npmjs.com/cli/v9/commands/npm-version
 *
 * author: confused-Techie
 * license: MIT
 * ============================================================================
 */

const shell = require("shelljs");
const yaml = require("js-yaml");
const fs = require("fs");

let rawArgs = process.argv.slice(2);

let service, bump, policy;

for (let i = 0; i < rawArgs.length; i++) {
  if (rawArgs[i].startsWith("--service")) {
    service = rawArgs[i].replace("--service=", "");
  }
  if (rawArgs[i].startsWith("--bump")) {
    bump = rawArgs[i].replace("--bump=", "");
  }
  if (rawArgs[i].startsWith("--policy")) {
    let tmp = rawArgs[i].replace("--policy=", "");
    tmp = tmp.toLowerCase();

    if (tmp === "true") {
      policy = true;
    } else {
      policy = false;
    }
  }
}

if (typeof service !== "string" || typeof bump !== "string") {
  shell.echo("No Microservice or Bump Provided!");
  shell.exit(1);
}

shell.echo(`Bumping Microservice: ${service} - ${bump}`);

// ================================
// Bump package.json Version
// ================================

// Get the old version

if (!shell.which("npm")) {
  shell.echo("Sorry, this script requires npm");
  shell.exit(1);
}

shell.cd(`./microservices/${service}`);

const oldPack = fs.readFileSync("./package.json");
const oldVer = JSON.parse(oldPack).version;

if (shell.exec(`npm version ${bump} --git-tag-version=false`).code !== 0) {
  shell.echo("Error: NPM Command Failed!");
  shell.exit(1);
}

// ================================
// Bump service.yaml Version
// ================================

// Get the doc first
let nameVer;

try {
  const doc = yaml.load(fs.readFileSync("./service.yaml"));

  const image = doc.spec.template.spec.containers[0].image;

  // Get our newest package.json version
  const curPack = fs.readFileSync("./package.json");
  const curVer = JSON.parse(curPack).version;

  const newImage = image.replace(oldVer, curVer);

  shell.echo(`Replacing: ${image} => ${newImage}`);

  doc.spec.template.spec.containers = [];
  doc.spec.template.spec.containers.push({ image: `"${newImage}"` });
  const newService = yaml.dump(doc);

  fs.writeFileSync("./service.yaml", newService);

  nameVer = `${service}:${curVer}`;

} catch(err) {
  shell.echo("An error occured while modifying the service.yaml!");
  shell.echo(err);
  shell.exit(1);
}

// ================================
// Execute Docker Build and Push Steps
// ================================

if (!shell.which("docker")) {
  shell.echo("Sorry, this Script Requires Docker");
  shell.exit(1);
}

shell.echo(`Executing the following Docker changes with: ${nameVer}`);

if (shell.exec(`docker build -t ghcr.io/pulsar-edit/${nameVer} .`).code !== 0) {
  shell.echo("Error: Docker Build Command Failed!");
  shell.exit(1);
}

if (shell.exec(`docker push ghcr.io/pulsar-edit/${nameVer}`).code !== 0) {
  shell.echo("Error: Docker Push (GitHub) Command Failed!");
  shell.exit(1);
}

if (shell.exec(`docker tag ghcr.io/pulsar-edit/${nameVer} us-west2-docker.pkg.dev/pulsar-357404/package-frontend/${nameVer}`).code !== 0) {
  shell.echo("Error: Docker Tag (Retag) Command Failed!");
  shell.exit(1);
}

if (shell.exec(`docker push us-west2-docker.pkg.dev/pulsar-357404/package-frontend/${nameVer}`).code !== 0) {
  shell.echo("Error: Docker Push (Google) Command Failed!");
  shell.exit(1);
}

// ================================
// Now Update the Google Specific Files
// ================================

if (!shell.which("gcloud")) {
  shell.echo("Sorry, this script Requires Gcloud");
  shell.exit(1);
}

if(shell.exec("gcloud run services replace service.yaml --region=us-west1").code !== 0) {
  shell.echo("Error: Gcloud Services Replace Command Failed!");
  shell.exit(1);
}

if (policy) {
  if (shell.exec(`gcloud run services set-iam-policy ${service} policy.yaml --region=us-west1`).code !== 0) {
    shell.echo("Error: Gcloud Services Set-IAM-Policy Failed!");
    shell.exit(1);
  }
}

shell.echo("Done!");
shell.exit(0);
