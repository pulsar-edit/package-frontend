# Package Frontend

The purpose of this repo is two-fold. Firstly this contains the code for the visual Web Browser for the Pulsar Package Registry Backend, as well as the source code for many of the Microservices that are in use either to assist the Package Frontend, or the Pulsar Organization as a whole.

## Pulsar Package Frontend

Serves as a visual Web Browser for the [`package-backend`](https://github.com/pulsar-edit/package-backend). Otherwise known as the Pulsar Package Registry Frontend.

The Pulsar Package Registry Frontend allows users to browse the available community packages from Pulsar from any device on the web by simply navigating to [`https://web.pulsar-edit.dev`](https://web.pulsar-edit.dev/).

## Microservices

Some tasks within the frontend are run in their own dedicated microservice. To read more about why some aspects are moved to a microservice and how they behave read [here](./microservices/README.md).

### Social Image Cards

Social Image Cards allow the creation of dynamic Package Cards to be displayed, either when linked to directly, or when a link to a packages page on the frontend has been shared to services that displays [Open Graph Protocol](https://ogp.me/) Compliant Rich Metadata.

To learn more about Social Image Cards, how they behave, and how to contribute take a look at the [Social Image Cards Readme](./microservices/social-cards/README.md).

### Download Link

The Download Link allows automated linking to our most recent Cirrus CI or 'alpha' builds of Pulsar. This lets the microservice worry about finding the relevant link rather than contributors having to do it by hand.

To learn more about the Download Link Microservice take a look at its [Readme](./microservices/download/README.md).

Additionally for easy access on how to use the download link, take a look at the [Download Link Table](/docs/download_links.md).

### Webhooks

The Webhooks Microservice exists as a translation tool from the GitHub Sponsors Webhooks to our Discord server since this type of webhook is not natively supported by Discord.

This allows the Pulsar Discord to get GitHub Sponsors notifications directly, and lets us thank those who donate right away.

For more information, take a look at the [Webhooks Microservice Readme](./microservices/webhooks/README.md).

### Auth State Cleanup

The Auth State Cleanup Microservice is a scheduled task that helps to cleanup the public Database in use for Pulsar.

Automatically deleted expired Secret Auth Codes that are generated for security during the GitHub OAuth Signup process for new users.

For more information, take a look at the [Auth State Cleanup Readme](./microservices/auth-state-cleanup/README.md).

## Developing the Frontend

The Frontend alone is a rather simple NodeJS package, and is made to run smoothly for local development or testing.

After cloning the repository locally, ensure to run `npm install` to get the necessary dependencies.

Copy or rename `app.example.yaml` to `app.yaml` to ensure the Package Registry Frontend is able to find its configuration file and values. If you'd like, when working with a local app config file, you can change the `app.yaml` to point to a locally hosted version of the Pulsar Package Backend, or continue to point to our official instance.

Within the config file exists the key `GOOGLE_APPLICATION_CREDENTIALS`. This key is used to point to a KeyFile containing Google Application Credentials to interact with the Remote cache. If you don't have access to this file you can set this key to `"no-file"` like so:

```yaml
GOOGLE_APPLICATION_CREDENTIALS: "no-file"
```

This is a special value that will cause the caching service to automatically ignore any cache requests, and force requests through to the backend.

### Running in Dev Mode

Optionally, when developing for the frontend you can use `npm run start:dev` to run the Pulsar Package Frontend Registry Server in Development mode which will disable any Remote Cache checks. If you run the server in development mode there is no need to set `GOOGLE_APPLICATION_CREDENTIALS` to `"no-file"`.
