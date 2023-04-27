// This file will be a collection of different Regex constructs used.

const matches = {
  repoLink: {
    standard: new RegExp(/^https\:\/\/github\.com\/(\S*)\/(\S*)$/),
    protocol: new RegExp(/^git\@github\.com\:(\S*)\/(\S*)(\.git)?$/),
    githubAssumedShorthand: new RegExp(/^[a-zA-Z0-9-_\.]+\/[a-zA-Z0-9-_\.]+$/),
    githubShorthand: new RegExp(/^github:([a-zA-Z0-9-_\.]+\/[a-zA-Z0-9-_\.]+)$/)
  },
  author: {
    compact: new RegExp(/^(.*)\s\<(.*)\>\s\((.*)\)$/),
    // Keep in mind `optional_compact` the name group[1] needs to be trimmed as it's whitespace inclusive
    optional_compact: new RegExp(/^(?:([^<(]*)){0,1}(?:\s*\<([^>(]*)\>){0,1}(?:\s*\(([^)]*)\)){0,1}$/)
  },
  localLinks: {
    currentDir: new RegExp(/^\.\//),
    rootDir: new RegExp(/^\//)
  },
  atomLinks: {
    package: new RegExp(/^https:\/\/atom\.io\/packages\/(.*)$/),
    flightManual: new RegExp(/^https:\/\/flight-manual\.atom\.io\//)
  }
};

module.exports = matches;
