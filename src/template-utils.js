const reg = require("./reg.js");

function getOwnerRepo(obj) {
  let repo = (typeof obj.metadata.repository === "string" ? obj.metadata.repository :
              (typeof obj.metadata.repository === "object" ? obj.metadata.repository.url : ""));

  if (reg.repoLink.standard.test(repo)) {
    // Standard Format, lets extract.
    let constru = repo.match(reg.repoLink.standard);
    return `${constru[1]}/${constru[2]}`;
  } else if (reg.repoLink.protocol.test(repo)) {
    let constru = repo.match(reg.repoLink.protocol);
    return `${constru[1]}/${constru[2].replace(".git", "")}`;
  } else {
    return repo;
  }
}

module.exports = {
  getOwnerRepo,
};
