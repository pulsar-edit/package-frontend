# Package Frontend

The purpose of this repo is two-fold. Firstly this contains the code for the visual Web Browser for the Pulsar Package Registry Backend, as well as the source code for many of the Microservices that are in use either to assist the Package Frontend, or the Pulsar Organization as a whole.

## Pulsar Package Frontend

Serves as a visual Web Browser for the [`package-backend`](https://github.com/pulsar-edit/package-backend). Otherwise known as the Pulsar Package Registry Frontend.

The Pulsar Package Registry Frontend allows users to browse the available community packages from Pulsar from any device on the web by simply navigating to [`https://web.pulsar-edit.dev`](https://web.pulsar-edit.dev/).

The aim of the frontend is to feel just as hackable as Pulsar does, all while promoting usage of Pulsar and its features, while trying to put a more modern spin on how this information is displayed than the `atom.io/packages` page previously did.

### Themes

The Pulsar Package Frontend provides several themes to find the style that suites you:
  * Atom.io Theme - The default theme which is based off the [Original Atom Package Browser](https://atom.io/packages)
  * GitHub Dark - A theme based off the GitHub Dark Theme.
  * Dracula - A theme based off the versatile [Dracula](https://draculatheme.com/) theme🧛
  * One-Dark - A theme based after the built in Pulsar UI Theme One-Dark.

If there isn't a theme yet that fits you, creating a new theme is welcome, encouraged, and easy.

First create the theme itself, by laying out the theme variables in `./src/site.css`. The top of this file should have every other supported theme listed along with the variables that can and will need to be modified for your theme.

Once the theme is created, ensure to add it as an option in `./public/site.js` within the function `changeTheme` and add a new check in the switch statement. Setting the body to have your theme as an attribute value, and saving the new theme option into the users local storage.

Lastly we need to ensure users are able to choose this theme when they'd like to. Within `./ejs-views/partials/header.ejs` add your new theme as a button towards the bottom of the page, along with all the other theme buttons. Ensure your theme name is passed to the `changeTheme` function.

Now with your theme created double check that the same name is used *exactly* in each location:
  * The EJS Template
  * The Client Side JavaScript
  * The Client Side CSS

Now it's good form to submit your PR pre-fixed with `[THEME]` so we know what exactly to check for.

If you do decide to create your own theme thanks a ton for contributing!

### Data Management

One of the largest tasks of the frontend website is to translate the data returned by the Package Registry API into a properly usable and standardized format for display. The reason for this is there are many variations that can be found when users declare their `package.json`.

If you'd like to read about some of the challenges of normalizing the data across so many different packages:
  * [Repository URLs](/docs/repository-urls.md)
  * [Authors](/docs/authors.md)
  * [Links](/docs/links.md)

### Load Times

When browsing the Package Frontend, if you find that the page load is taking a long time and you would like to investigate the cause, there's a built in utility to assist with this. While it's unable to show every aspect of the page load it can still be a useful tool to point fault to, and determine where we need to improve.

To use this utility once the offending page has loaded, open your browser's DevTools and within the provided console type:

```javascript
loadStats();
```

The output will look similar to the following:

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

Of the above output, the only field that you should worry about is `duration`, as this tells you in milliseconds how long the related action took. Of the actions that might be shown below is an explanation of what they mean:
  * `api-request`: An API Request was needed to be made to the backend server, and this shows the duration that the request took.
  * `transcribe-json`: JSON Data received from an API request needs to be modified to be displayed by the website. This shows the duration the modification took.
  * `cache-check`: Local or Remote or Both types of caching are implemented on this endpoint. This shows the duration it took to check with said caches for the relevant data.

Currently `loadStats()` is unable to display how long certain actions took, which are listed below:
  * The time `ExpressJS` took to handle the request itself.
  * The time `EJS` templates took to handle creating and displaying the page.

## Microservices

Some tasks within the frontend are run in their own dedicated microservice. To read more about why some aspects are moved to a microservice and how they behave read [here](./microservices/README.md).

### Social Image Cards

Social Image Cards allow the creation of dynamic Package Cards to be displayed, either when linked to directly, or when a link to a packages page on the frontend has been shared to services that display the image websites prompt to.

To learn more about Social Image Cards, how they behave, and how to contribute take a look at the [Social Image Cards Readme](./microservices/social-cards/README.md).

### Download Link

The Download Link allows automated linking to our most recent Cirrus CI or 'alpha' builds of Pulsar. This lets the microservice worry about finding the relevant link rather than contributors having to do it by hand.

To learn more about the Download Link Microservice take a look at its [Readme](./microservices/download/README.md).

Additionally for easy access on how to use the download link, take a look at the [Download Link Table](/docs/download_links.md).

### Webhooks

The Webhooks Microservice exists as a translation tool from GitHub Sponsors Webhooks to Discord. Since this type of webhook is not natively supported.

This allows the Pulsar Discord to get GitHub Sponsors notifications directly, and lets use thank those who donate right away.

For more information, take a look at the [Webhooks Microservice Readme](./microservices/webhooks/README.md).

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
