// Metro watches ../src/lib so the app can import the site's browser-safe
// modules through the @shared alias (ADR-020).
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.watchFolders = [...(config.watchFolders ?? []), path.resolve(__dirname, "../src/lib")];

module.exports = config;
