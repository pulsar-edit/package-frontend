# Package Frontend

Serves as a visual Web Browser for the [`package-backend`](https://github.com/pulsar-edit/package-backend).

While the site is still in it's early stages it has an original design and supports several themes already:
  * Atom.io Theme - Theme Based off the Original Atom Package Browser
  * GitHub Dark - A theme Based off GitHub Dark Theme
  * Dracula - Theme based off the versatile [Dracula](https://draculatheme.com/) theme🧛
  * One-Dark - A Theme Modeled after the built in Pulsar UI Theme One-Dark

The Web Browser for Packages is available on [`pulsar-edit.dev`](https://web.pulsar-edit.dev/).

If you'd like to read about some of the challenges of normalizing the data across so many different Packages:

  * [Repository URLs](/docs/repository-urls.md)
  * [Authors](/docs/authors.md)
  * [Links](/docs/links.md)

Additionally for anyone crafting a direct download link to our Pulsar Binaries from Cirrus CI:
  * [Download Link Table](/docs/download_links.md)

---

When browsing the website, if you'd like to investigate what's caused the page load to take a long time there's now a built in utility to help determine that. While it can't show every aspect of the page load it could at least help to rule out some aspects.

When on the website, open the DevTools for your respective browser and in the provided console type:

```javascript
loadStats();
```

This will output similar to the following:

```json
{
  "api-request": {
    "duration": 922.325,
    "end": 2699.609,
    "start": 1777.28
  },
  "transcribe-json": {
    "duration": 14.55,
    "end": 2714.175,
    "start": 2699.617
  }
}
```

Of the above output, the only field that you should worry about is `duration`, as this tells you in milliseconds how long whatever action is related took. Of the actions that might be shown below is an explaination of what they mean.

* `api-request`: An API Request was needed to be made to the backend server, and this shows the duration that request took.
* `transcribe-json`: JSON Data received from an API request needs to be modified to be displayed to the end user, and some of these actions are intensive. This shows the duration it took to completly modify and return the JSON data.
* `cache-check`: Local or Remote or Both types of caching are implemented on this endpoint. This shows the duration it took to check with said caches for the relevant data.

Currently `loadStats()` is unable to display how long certain actions took, which are listed below:

* The time `ExpressJS` took to handle the request itself.
* The time `PugJS`/`Jade` templates took to handle creating and displaying the page.

---

## Developers

To run and test `package-frontend` locally should be rather simple.

After cloning the repository, run `npm install` within the root of the folder.

Then copy or rename `app.example.yaml` to `app.yaml`. When working with a local app config file you can change settings of the backend API to interact with to use a local version, or change the port the frontend is exposed on.

Within the config file exists the key `GOOGLE_APPLICATION_CREDENTIALS` this key is used to point to a KeyFile containing Google Application Credentails to interact with Remote Caches. If you don't have access to this file set it to `"no-file"` like so:

```yaml
GOOGLE_APPLICATION_CREDENTIALS: "no-file"
```

This is a special value that will cause the caching service to automatically ignore any cache requests, and force request through to the backend service. Allowing to fail gracefully.

### Running In Dev Mode

Using `npm run start:dev` you can run the Package Frontend Server in Development mode. This does two notable things:
  - Disables Remote Cache Features Natively. Setting `GOOGLE_APPLICATION_CREDENTIALS: "no-file"` is not necessary when run in dev mode.

### Creating a New Theme

Creating a new theme should be rather simple.

First create the theme itself, by laying out the theme variables in `./src/site.css` the top of this file should have every other supported theme listed along with the variables that can and need to be modified for your theme.

Once the theme is created, ensure to add it as an option to set in `./public/site.js` within the function `changeTheme` add a new check in the switch statement. Setting the body to have your theme as an attribute value, and saving the new theme option into the users local storage.

Lastly we need to ensure users are able to choose this theme when they'd like to. Within `./ejs-views/partials/header.ejs` add your new theme as a button towards the bottom of the page, along with all other buttons. Ensure your theme name is passed to the `changeTheme` function.

Now with your theme created double check that the same name is used *exactly* in each location.
  - The EJS Template
  - The Client Side JavaScript
  - The Client Side CSS

Now it's good form to submit your PR pre-fixed with `[THEME]` so we know what exactly to check for.

Thanks for contributing!

### Microservices

Some tasks within the frontend are run in their own dedicated microservice. To read more about why some aspects are moved to a microservice and how they behave read [here](./microservices/README.md).

#### Social Image Cards

The Pulsar Package Frontend now supports social cards.

These cards will be suggested when services create a link preview from a link to `https://image.pulsar-edit.dev/packages/packageName`.

To read more about Social Image Cards and how to contribute to them view their Document and Code [here](./microservices/social-cards/README.md).
