// This file will be a collection of different Regex constructs used.

const matches = {
  repoLink: {
    standard: new RegExp(/^https\:\/\/github\.com\/(\S*)\/(\S*)$/),
    protocol: new RegExp(/^git\@github\.com\:(\S*)\/(\S*)(\.git)?$/)
  },
  author: {
    compact: new RegExp(/^(.*)\s\<(.*)\>\s\((.*)\)$/)
  }
};

module.exports = matches;
