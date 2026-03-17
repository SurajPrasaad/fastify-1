const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 1. Prioritize cjs and mjs for modern packages
config.resolver.sourceExts.unshift('cjs', 'mjs');

// 2. Handle native-only modules that crash on Web
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web') {
        if (moduleName === 'react-native-webrtc' || moduleName.startsWith('react-native-webrtc/')) {
            console.log(`[Web Bundle] Mocking native module: ${moduleName}`);
            return {
                filePath: path.resolve(__dirname, 'mocks/react-native-webrtc-mock.js'),
                type: 'sourceFile',
            };
        }
        if (moduleName === 'react-native-worklets' || moduleName.startsWith('react-native-worklets/')) {
            // Don't mock package.json so version checks still work
            if (moduleName.endsWith('/package.json')) {
                return context.resolveRequest(context, moduleName, platform);
            }
            console.log(`[Web Bundle] Mocking native module: ${moduleName}`);
            return {
                filePath: path.resolve(__dirname, 'mocks/react-native-worklets-mock.js'),
                type: 'sourceFile',
            };
        }
    }
    return context.resolveRequest(context, moduleName, platform);
};

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
