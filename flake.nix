{
  description = "React Native Expo development environment with Bun";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        # Force native architecture for packages
        pkgs = import nixpkgs {
          system = system;
          config = {
            allowUnfree = true;
            android_sdk.accept_license = true; 
          };
          # Ensure native compilation, especially important for ARM systems
          overlays = [];
        };

        # Android SDK configuration
        # Note: On ARM systems, we need to ensure platform-tools are compiled for native architecture
        androidComposition = pkgs.androidenv.composeAndroidPackages {
          platformVersions = [ "35" "34" ];
          buildToolsVersions = [ "35.0.0" "34.0.0" ];
          includeEmulator = false;
          includeSystemImages = true;
          systemImageTypes = [ "google_apis_playstore" ];
          abiVersions = [ "arm64-v8a" ];
          includeNDK = true;
          ndkVersions = [ "26.1.10909125" ];
          # Use native platform tools instead of prebuilt x86_64 binaries
          platformToolsVersion = "35.0.1";
          extraLicenses = [
            "android-googletv-license"
            "android-sdk-license"
            "android-sdk-arm-dbt-license"
            "android-sdk-preview-license"
            "google-gdk-license"
            "intel-android-extra-license"
            "intel-android-sysimage-license"
            "mips-android-sysimage-license"
          ];
        };

        androidSdk = androidComposition.androidsdk;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # JavaScript runtime & package manager
            bun

            # React Native requirements
            watchman

            # Android development
            androidSdk
            jdk17
            gradle

            # iOS development (macOS only, will be skipped on Linux)
          ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
            cocoapods
            xcodes
          ] ++ pkgs.lib.optionals pkgs.stdenv.isAarch64 [
            # Native ARM platform tools (adb, fastboot) - overrides x86 tools from androidSdk
            android-tools
          ] ++ [
            # General utilities
            git
            curl
            unzip
          ];

          shellHook = ''
            export ANDROID_HOME="${androidSdk}/libexec/android-sdk"
            export ANDROID_SDK_ROOT="$ANDROID_HOME"
            export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/26.1.10909125"
            export ORIGINAL_NDK_ROOT="$ANDROID_NDK_ROOT"

            # Set up PATH
            # On ARM systems, ensure native android-tools take precedence by explicitly prepending them
            ${pkgs.lib.optionalString pkgs.stdenv.isAarch64 ''
            # Create a temporary directory for ARM-compatible platform-tools
            mkdir -p "$HOME/.expo-arm-tools"
            # Symlink all platform-tools except adb
            for tool in "$ANDROID_HOME/platform-tools"/*; do
              toolname=$(basename "$tool")
              if [ "$toolname" != "adb" ]; then
                ln -sf "$tool" "$HOME/.expo-arm-tools/$toolname" 2>/dev/null || true
              fi
            done
            # Symlink ARM adb instead of x86 version
            ln -sf "${pkgs.android-tools}/bin/adb" "$HOME/.expo-arm-tools/adb"

            # Override ANDROID_HOME to use our ARM-compatible tools directory
            # This ensures Expo finds the correct adb at $ANDROID_HOME/platform-tools/adb
            export ORIGINAL_ANDROID_HOME="$ANDROID_HOME"
            export ANDROID_HOME="$HOME/.expo-android-sdk"
            export ANDROID_SDK_ROOT="$ANDROID_HOME"

            # Set up custom Android SDK structure for Expo
            mkdir -p "$ANDROID_HOME/platform-tools"
            ln -sf "$HOME/.expo-arm-tools/adb" "$ANDROID_HOME/platform-tools/adb"

            # Symlink other SDK components from original location
            for dir in tools emulator build-tools platforms system-images ndk ndk-bundle licenses; do
              if [ -d "$ORIGINAL_ANDROID_HOME/$dir" ]; then
                ln -sf "$ORIGINAL_ANDROID_HOME/$dir" "$ANDROID_HOME/$dir" 2>/dev/null || true
              fi
            done

            # Update NDK path to use original location
            export ANDROID_NDK_ROOT="$ORIGINAL_NDK_ROOT"

            export NIXPKGS_ACCEPT_ANDROID_SDK_LICENSE=1

            # Put our ARM-compatible tools first in PATH
            export PATH="$HOME/.expo-arm-tools:${pkgs.android-tools}/bin:$PATH"
            export PATH="$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/emulator:$PATH"
            # Force Expo/Metro to use the native ARM adb
            export ANDROID_ADB="${pkgs.android-tools}/bin/adb"
            ''}
            # On x86 systems, use SDK's platform-tools normally
            ${pkgs.lib.optionalString (!pkgs.stdenv.isAarch64) ''
            export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/emulator:$PATH"
            ''}

            export JAVA_HOME="${pkgs.jdk17}"

            # Gradle configuration
            export GRADLE_OPTS="-Dorg.gradle.daemon=true"

            echo "React Native Expo development environment loaded"
            echo "  System: ${system}"
            echo "  Bun: $(bun --version)"
            echo "  Java: $(java --version 2>&1 | head -1)"
            echo "  Android SDK: $ANDROID_HOME"
            if command -v adb &> /dev/null; then
              echo "  ADB location: $(which adb)"
              echo "  ADB architecture: $(file $(which adb) 2>/dev/null | grep -o 'ARM\|x86\|aarch64' || echo 'unknown')"
            fi
          '';
        };
      }
    );
}
