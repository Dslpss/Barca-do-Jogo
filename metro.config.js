const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Adicionar suporte para AsyncStorage
config.resolver.alias = {
  ...config.resolver.alias,
  "@react-native-async-storage/async-storage":
    "@react-native-async-storage/async-storage",
};

module.exports = config;
