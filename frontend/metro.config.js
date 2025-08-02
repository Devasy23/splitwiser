const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Add support for TypeScript path mapping
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

// Support for additional file extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'tsx', 'ts'];

module.exports = config;
