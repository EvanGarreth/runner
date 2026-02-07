require("dotenv").config();

module.exports = {
  expo: {
    name: "runner",
    slug: "runner",
    scheme: "runner",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "This app uses your location to track your runs.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.evanc.runner",
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION"],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-sqlite",
      "expo-router",
      [
        "expo-location",
        {
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        "expo-maps",
        {
          googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
  },
};
