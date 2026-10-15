// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Ensure Metro resolves within the mobile directory and prevents monorepo root traversal
config.projectRoot = projectRoot;
config.watchFolders = [projectRoot];

module.exports = config;
