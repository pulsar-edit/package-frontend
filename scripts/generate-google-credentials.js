#!/usr/bin/env node

let rawArgs = process.argv.slice(2);

console.log(rawArgs);

const args = JSON.parse(rawArgs[0]);

console.log(args);
