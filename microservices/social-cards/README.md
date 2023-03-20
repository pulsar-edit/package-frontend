# Social Image Cards

This Microservice contains the code used for the Social Image Cards.

That is cards that are used when sharing a link to a specific Package on the Pulsar Package Registry.

Social Image Cards are created on demand and use HTML that's then converted to a PNG to be served back to the client.

These images can be displayed by services where this link is shared automatically, or a link can be used directly to the social image cards like below:

```
https://image.pulsar-edit.dev/packages/:packageName
```

Additionally different styles of social image cards are supported by using the `image_kind` query parameter like so:

```
https://image.pulsar-edit.dev/packages/:packageName?image_kind=IMAGEKIND
```

The following image kinds are supported:

* default : The generic Social Image Card that is automatically used when sharing the image on the web.
* iconic : The hidden Social Image Card displaying the Pulsar Mascot.

Also while not yet exposed via the share menu for the Social Image Cards, it is possible to apply themes to the images that will be returned.

Via the `theme=` query parameter on the URL you are able to apply the following themes:

* `light`: The default light theme, that was previously used
* `github-dark`: A GitHub based Dark Theme, modeled after the same theme available on the Frontend Pulsar Package Website.
* `dracula`: A Dracula Theme, again modeled after the same theme available on the Frontend Pulsar Package Website.

```
https://image.pulsar-edit.dev/packages/:packageName?theme=THEME
```

## Running Microservice
* `npm start`: Can be used to start up the server normally.
* `npm run start:dev`: Exposes a secret API endpoint.`/dev/packages/:packageName` will be available when in dev mode, and gives direct access to the HTML code used to display the Social Cards. Using this can allow easier modification and editing of our Social Cards. A warning, themes are not yet supported on the special development endpoint.

## Add New Social Image Cards

To add a new Social Image card create a new folder within `./template` containing both `template.css` and `template.ejs`. Using EJS Syntax you can craft the image that will be displayed following the objects that are provided to the template, which will match the return from the backend API for a specific package.

Additionally when crafting the template there are some functions available to help work with the data returned in `template-utils.js`.

If needed you can use `npm run start:dev` which exposes the endpoint `https://image.pulsar-edit.dev/dev/packages/:packageName` for use, which will return the image as an HTML page to aid in editing your template.


---

Publishing:

Since we need to have our image published to the Google Artifact Registry but also wanted to prioritize having the container published to the GitHub Repo publicly, the publish process can be semi complex to achieve both.

First when changes to the social image card microservice has occurred we need to build locally:

```bash
docker build -t ghcr.io/pulsar-edit/social-cards:1.0 .
```

Once built we and tested we can go ahead and push this image out to GitHub Packages Registry.

```bash
docker push ghcr.io/pulsar-edit/social-cards:1.0
```

Now that the image exists on GitHub we need to actually get it into the Google Artifact Registry to be able to use it during Build and execution of the microservice.

And to do so we should start be retagging it to something compatible with Google.

```bash
docker tag ghcr.io/pulsar-edit/social-cards:1.0 us-west2-docker.pkg.dev/pulsar-357404/package-frontend/social-cards:1.0
```

Now we can push our retagging image.

```bash
docker push us-west2-docker.pkg.dev/pulsar-357404/package-frontend/social-cards:1.0
```

---

It's also likely helpful to note down some special commands that may be needed in future work here to avoid the documentation deep dives.

#### Modify Image Services and/or change networking settings:

> MUST USE `us-west1` in order for domain mapping to function.

```bash
gcloud run services set-iam-policy social-cards policy.yaml
```

#### Update the Image Used for the microservice (Or any other config in `service.yaml`)

> MUST USE `us-west1` in order for domain mapping to function.

```bash
gcloud run services replace service.yaml
```
