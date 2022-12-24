# Microservices

The following folders contain Microservices in use by the frontend.

Any task that is suitably complex or causes issues or unnecessary unneeded cost by being coupled with the frontend are separated out into a microservice that can be utilized by the frontend or any other service as needed.

But it stands to note that an individual microservice should never in of itself be extremely complex or long running. We get the most benefit from microservices by keeping their lifetime as short as possible, and their task as targeted and specific as possible.

* [Social Image Cards](./social-cards/README.md): Generates Social Image Cards for Packages Published to the Pulsar Registry

* [Download Endpoint](./download/README.md): Provides and easy interface to download the most recent Pulsar Alpha Cirrus CI Binaries.
