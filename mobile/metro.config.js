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
  // Additional configuration for DASH Racing app
  transformer: {
    // Enable experimental import support
    unstable_allowRequireContext: true,
    
    // Support for SVG files (react-native-svg)
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    
    // Asset extensions
    assetPlugins: ['react-native-svg-transformer'],
  },
  
  resolver: {
    // Asset extensions that Metro should handle
    assetExts: defaultConfig.resolver.assetExts.filter(ext => ext !== 'svg'),
    
    // Source extensions Metro should handle
    sourceExts: [...defaultConfig.resolver.sourceExts, 'svg'],
    
    // Resolve symlinks to handle monorepo setups
    resolveRequest: null,
    
    // Platform-specific extensions
    platforms: ['ios', 'android', 'native', 'web'],
  },
  
  // Watch folders for changes
  watchFolders: [
    // Add parent directory if needed for shared code
    path.resolve(__dirname, '../shared'),
    path.resolve(__dirname, '../'),
  ],
  
  // Metro server configuration
  server: {
    port: 8081,
  },
  
  // Reset cache behavior
  resetCache: false,
};

module.exports = mergeConfig(defaultConfig, config);