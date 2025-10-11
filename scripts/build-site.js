const fs = require("node:fs");
const less = require("less");

const data = {
  js: {
    source_loc: "./site/resources-generated/site.js",
    output: ""
  },
  css: {
    source_loc: "./site/resources-generated-serve/site.css",
    output: ""
  },
  less: {
    source_loc: "./site/resources-generated/main.less",
    output: ""
  },
  output_dir: "./site/resources-generated-serve"
};

(async () => {
  const minify = await import("minify").then(minify => minify.default); // ESM export only
  // Generate Output
  data.js.output = await minify.minify(data.js.source_loc);
  const lessRender = await less.render(fs.readFileSync(data.less.source_loc, { encoding: "utf-8"}));
  data.less.output = lessRender.css;

  if (!fs.existsSync(data.output_dir)) {
    fs.mkdirSync(data.output_dir);
  }
  fs.writeFileSync(data.css.source_loc, data.less.output, { encoding: "utf-8" });

  data.css.output = await minify.minify(data.css.source_loc);

  // Write Output
  fs.writeFileSync("./site/resources-generated-serve/site.min.js", data.js.output, { encoding: "utf-8" });
  fs.writeFileSync("./site/resources-generated-serve/site.min.css", data.css.output, { encoding: "utf-8" });
})();
