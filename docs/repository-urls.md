# Why is finding the Repository URL So hard?

Considering the Backend API has the full `package.json` and it gives it to us (slightly modified) in the form of `.metadata` you would think we could just go `package.metadata.repository` and get something like `https://github.com/pulsar-edit/package-frontend` right?

Well no. Even if that's the case with the majority of packages, there are variations.

## JSON Structures to Declare `repository`

```json
"repository": "https://github.com/pulsar-edit/package-frontend",
```

```json
"repository": {
  "type": "git",
  "url": "https://github.com/pulsar-edit/package-frontend"
}
```

```json
"repository": {
  "type": "git",
  "url": "https://github.com/pulsar-edit/package-frontend",
  "directory": "packages/example"
}
```

## Ways to Declare the URL

* "https://github.com/pulsar-edit/package-frontend"
* "git@github.com:pulsar-edit/package-frontend.git"
* "git@github.com:pulsar-edit/package-frontend"

---

So considering the above, this can make getting the Repository not as straight forward as one would think.

But with that said, these considerations are built directly into the frontend to allow seamless usage, and ideally the end user would have no clue how much logic there has to be to handle this.
