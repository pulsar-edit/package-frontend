# Download Endpoint

This Microservice allows easy linking to any Pulsar Rolling Release Binary.

This binaries are no longer downloaded directly from CirrusCI. Instead these binaries are now uploaded to [`pulsar-edit/pulsar-rolling-releases`](https://github.com/pulsar-edit/pulsar-rolling-releases).

Feel free to refer to the [download table](/docs/download_links.md) to use this endpoint.

## Running Microservice

* `npm start`: Can be used to start up the server normally.

> There is no supported dev mode for the microservice.

---

Publishing:

Since like the Social Image Cards we want to host this Docker Image on Both GitHub Packages and need to have it on the Google Artifact Registry the below is needed to publish.

First build image locally:

```bash
docker build -t ghcr.io/pulsar-edit/download:1.0 .
```

Once built we can then push to the GitHub Packages Registry:

```bash
docker push ghcr.io/pulsar-edit/download:1.0
```

Now once on GitHub we need to retag to push to Google Artifact Registry:

```bash
docker tag ghcr.io/pulsar-edit/download:1.0 us-west2-docker.pkg.dev/pulsar-357404/package-frontend/download:1.0
```

Then we want to push this new tagged image to the Google Artifact Registry:

```bash
docker push us-west2-docker.pkg.dev/pulsar-357404/package-frontend/download:1.0
```

---

It's also helpful to note some commands used to aid in publishing.

#### Modify Image Services and/or change networking settings:

> MUST USE `us-west1` for domain mapping to work.

```bash
gcloud run services set-iam-policy download policy.yaml
```

#### Update the Image used for the microservice (Or any other config in `service.yaml`)

> MUST USE `us-west1` for domain mapping to work.

```bash
gcloud run services replace service.yaml
```
