# Auth State Cleanup

This Microservice is a scheduled task that runs a cleanup job on Pulsar User Database.

For security during the sign up process Pulsar Generates secret `codes`. These codes are used to verify the legitimacy of a request when a user signs up for Pulsar via GitHubs OAuth signup. But after the signup flow these `codes` are not deleted automatically.

So this job then is in charge of deleted `codes` that have reached their expiration date.

## Publishing

Like all other microservices, the publishing flow will require building with Docker

And then uploading to GitHub. Then to retag and upload to Google Cloud.

To update the service replace the `service.yaml` file in the cloud to the newest version.
