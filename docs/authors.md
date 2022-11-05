# How we find the Author?

Considering the Backend API has the full `package.json` and it gives it to us (slightly modified) in the form of `.metdata` you would think we could just go `package.metadata.author` and get something like `confused-Techie` right?

Well no. Even thought that will be the case with the majority of packages, there are some variations.

Below are all of the ways we might find the author field:

```json
"author": "confused-Techie"
```

```json
"author": {
  "name": "confused-Techie",
  "email": "dev@lhbasics.com",
  "url": "https://pulsar-edit.dev"
}
```

```json
"author": "confused-Techie <dev@lhbasics.com> (https://pulsar-edit.dev)"
```

---

Considering the above, this makes it not as straight forward as one might hope to determine the author's name. But with these considerations built right into the frontend, hopefully the end-user would never notice.
