// This file will be a collection of different Regex constructs used.

const matches = {
  repoLink: {
    standard: new RegExp(/^https\:\/\/github\.com\/(\S*)\/(\S*)$/),
    protocol: new RegExp(/^git\@github\.com\:(\S*)\/(\S*)(\.git)?$/)
  },
  author: {
    compact: new RegExp(/^(.*)\s\<(.*)\>\s\((.*)\)$/),
    optional_compact: new RegExp(/^(?:([^<(]*)\s){0,1}(?:\<([^>(]*)\>\s){0,1}(?:\(([^)]*)\)){0,1}$/)
  },
  localLinks: {
    currentDir: new RegExp(/^\.\//),
    rootDir: new RegExp(/^\//)
  }
};

module.exports = matches;
