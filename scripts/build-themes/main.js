const fs = require("fs");
const yaml = require("js-yaml");

async function main() {
  let themes = await getThemes();

  let css = await buildStyleSheet(themes);

  let json = await buildJSON(themes);

  let html = await buildHTML(themes);

  console.log(html);
  console.log(json);
  console.log(css);
}


async function getThemes() {
  return new Promise((resolve, reject) => {
    fs.readdir("./themes/", (err, files) => {
      if (err) {
        throw new Error(err);
      }

      let fileArray = [];

      for (const file of files) {
        let contents = fs.readFileSync(`./themes/${file}`, "utf8");

        let obj = yaml.load(contents);

        fileArray.push(obj);
      }

      resolve(fileArray);
    });
  });
}

async function buildStyleSheet(themes) {
  let out = "";

  for (const theme of themes) {
    let tmp = `body[theme="${theme.name}"] {\n`;

    for (const prop in theme.theme) {
      tmp += `  --${prop}: ${theme.theme[prop]};\n`;
    }
    tmp += `}\n\n`;

    out += tmp;
  }

  return out;
}

async function buildHTML(themes) {
  let out = "";

  for (const theme of themes) {
    let extra = "";

    if (theme.name === "original-theme") {
      extra = " (Default)";
    }

    out += `<button data-theme-name="${theme.name}">${theme.friendlyName}${extra}</button>\n`;
  }

  return out;
}

async function buildJSON(themes) {
  let out = { themes: {} };

  for (const theme of themes) {
    out.themes[theme.name] = {
      syntax: theme.syntax.name,
      url: theme.syntax.url,
      name: theme.name
    };
  }

  return out;
}

main();
