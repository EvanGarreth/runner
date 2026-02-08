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
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "This app needs background location access to continue tracking your runs even when the screen is locked or the app is minimized.",
        UIBackgroundModes: ["location"],
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
      permissions: ["ACCESS_COARSE_LOCATION", "ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION"],
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
