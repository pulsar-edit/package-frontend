# Social Image Cards

This Microservice contains the code used for the Social Image Cards.

That is cards that are used when sharing a link to a specific Package on the Pulsar Package Registry.

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

## Add New Social Image Cards

To add a new Social Image card create a new folder within `./template` containing both `template.css` and `template.ejs`. Using EJS Syntax you can craft the image that will be displayed following the objects that are provided to the template, which will match the return from the backend API for a specific package.

Additionally when crafting the template there are some functions available to help work with the data returned in `template-utils.js`.

If needed you can use `npm run start:dev` which exposes the endpoint `https://image.pulsar-edit.dev/dev/packages/:packageName` for use, which will return the image as an HTML page to aid in editing your template.
