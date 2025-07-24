        // babel.config.js
        module.exports = function(api) {
          api.cache(true);
          return {
            presets: ['babel-preset-expo'],
            plugins: ['module:react-native-dotenv'] // Add this line
          };
        };
