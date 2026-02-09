# Search

This microservice allows search on Pulsar's static websites.

While sites like the backend (and implicitly the frontend) have search capabilities
built in, for our static sites, such as the docs or blog, they have no way to search their content.

This microservice allows a somewhat novel way to accomplish that, without having to suck
up a users resources by preforming the search client side.

The search microservice responds to a `POST /reindex/:domain` request which will collect
the `search-index.jsonl` document at the root of the subdomain and will build a search index from it.

Which it then responds to `GET /search/:domain?q=` requests and preforms a search against that index.

Search capabilities are provided via [lunr](https://lunrjs.com/) and as such support all of the features of that library, such as boosts, fuzzy matches, wildcards, etc (as [described](https://lunrjs.com/guides/searching.html)).

## Users of Search

For advanced search features please reference [lunr docs](https://lunrjs.com/guides/searching.html).

## Integrators

When integrating `search` into a new Pulsar subdomain, ensure:
* To output a document `search-index.jsonl` at the root of the domain.
* That the document has the fields: `url`, `title`, and `body`.
* That the new domain is mapped in the `./index.js` file.

Then the response of `GET /search/:domain?q=` will match the response described [here](https://lunrjs.com/guides/core_concepts.html#search-results).
