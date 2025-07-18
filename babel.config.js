module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./app'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@components': ['./app/components'],
            '@screens': ['./app/screens'],
            '@utils': ['./app/utils'],
            '@types': ['./app/types'],
          },
        },
      ],
    ],
  };
}; 