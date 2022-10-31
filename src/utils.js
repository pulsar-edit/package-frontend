// Collection of utility functions for the frontend

async function displayError(req, res, errStatus) {
  switch(errStatus) {
    case 404:
      res.render('404');
      break;
    case 505:
      res.render('505');
      break;
    default:
      res.render('505');
      break;
  }
}

function prepareForListing(obj) {
  // Takes a package and prepares it for the short-form listing.
  // Simplifying it's structure and ensuring data accuracy
  return new Promise((resolve, reject) => {
    let packList = [];

    for (let i = 0; i < obj.length; i++) {
      try {
        let pack = {};

        pack.name = obj[i].name ? obj[i].name : "";
        pack.description = obj[i].metadata.description ? obj[i].metadata.description : "";
        pack.keywords = obj[i].metadata.keywords ? obj[i].metadata.keywords : "";
        //pack.author = (typeof obj[i].metadata.author === "string") ? obj[i].metadata.author : (typeof obj[i].metadata.author === "object" ? obj[i].metadata.author.name : "");
        pack.author = findAuthorField(obj[i]);
        pack.downloads = obj[i].downloads ? obj[i].downloads : "";
        pack.stars = obj[i].stargazers_count ? obj[i].stargazers_count : "";

        packList.push(pack);
      } catch(err) {
        console.log(err);
        console.log("Error Caused by:");
        console.log(obj[i]);
      }
    }

    resolve(packList);
  });
}

function findAuthorField(obj) {
  let author = "";
  if (typeof obj.metadata.author === "string") {
    author = obj.metadata.author;
  } else if (typeof obj.metadata.author === "object" && obj.metadata.author.hasOwnProperty("name")) {
    author = obj.metadata.author.name;
  } else {
    // If no standards are found, lets instead use the name pulled from the repo.
    author = "repository-field";
  }

  return author;
}

module.exports = {
  displayError,
  prepareForListing,
};
