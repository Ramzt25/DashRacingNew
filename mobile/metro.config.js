const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration for React Native 0.74.7
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  transformer: {
    // Enable experimental import support
    unstable_allowRequireContext: true,
  },
  
  resolver: {
    // Use default asset and source extensions
    assetExts: defaultConfig.resolver.assetExts,
    sourceExts: defaultConfig.resolver.sourceExts,
  },
  
  // Watch folders for changes
  watchFolders: [
    path.resolve(__dirname, '..'),
  ],
  
  // Metro server configuration
  server: {
    port: 8081,
  },
};

module.exports = mergeConfig(defaultConfig, config);