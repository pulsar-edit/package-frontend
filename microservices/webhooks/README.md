# Webhooks Microservice

This Microservice came out of need, since Discord doesn't support GitHub sponsors Webhooks. But ideally this can find many more use cases.

This Webhook simply receives another Webhook or any Post HTTP Request, transforms the data to a new specified format and will forward it along as a webhook to another service. Essentially serving as a Webhook translator across services.

Due to needing to keep the data of the Webhook URLs for Discord secret, and needing to keep the ability to publish webhooks from this service a secret, there is some security baked in that is directly related to this microservices usage on Google Cloud.

The secrets available for use within this microservice are stored in Google Clouds Secret Manager.

Which during start time of the container are injected as Environment Variables for the service via the `./service.yaml` file.

Then from there we can import the secrets into our application the same way you would any environment variable.

## Authentication Model

Due to the fast creation of this Microservice, and it's simplicity, the authentication model is best described as more than basic.

Essentially we import a secret from Google Clouds Secret Manager that contains an array of keys. Then simply when we receive a request we check if our secret array of keys contains the key being passed to us.

This ideally lets us use one Key per service rather simply. But this model is likely to change in the future.

## Running Microservice

Like most other microservices here, publishing should be simple. Running `npm start` in the root directory of this microservice.

Then default values will be used for the secrets we don't have for testing.

## Building & Publishing

Like all other microservices the process to build and publish, is to first push to GitHub, then push the Docker image to Google.

From there we can start the service, and inject our custom `policy.yaml` and custom `service.yaml`.

During microservice updates we just need to update the Docker image, then update the tagged Docker image in use by the `service.yaml` and inject that into the running microservice.
