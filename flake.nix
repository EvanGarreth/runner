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

        # Android cmdline-tools setup (base install only, packages installed via shellHook)
        cmdlineTools = pkgs.stdenv.mkDerivation {
          name = "android-cmdline-tools";

          nativeBuildInputs = with pkgs; [
            unzip
          ];

          # Download cmdline-tools manually
          src = pkgs.fetchurl {
            url = "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip";
            sha256 = "sha256-LS1QhX5OtVOvWm3DrVB6F630PRFSZLGvwRb5XJLl4lg=";
          };

          unpackPhase = ''
            unzip $src
          '';

          installPhase = ''
            mkdir -p $out/cmdline-tools/latest
            cp -r cmdline-tools/* $out/cmdline-tools/latest/

            # Patch shebangs for all scripts
            patchShebangs $out/cmdline-tools/latest/bin

            # Accept all licenses
            mkdir -p $out/licenses
            echo "24333f8a63b6825ea9c5514f83c2829b004d1fee" > $out/licenses/android-sdk-license
            echo "d975f751698a77b662f1254ddbeed3901e976f5a" > $out/licenses/intel-android-extra-license
            echo "84831b9409646a918e30573bab4c9c91346d8abd" > $out/licenses/android-sdk-preview-license
            echo "e9acab5b5fbb560a72cfaecce8946896ff6aab9d" > $out/licenses/android-sdk-arm-dbt-license
          '';
        };

        # Android SDK location (will be populated in shellHook)
        androidSdkHome = "$HOME/.android-sdk-nix";

        # FHS environment for Android build tools (especially needed for ARM systems)
        androidEnv = pkgs.buildFHSUserEnv {
          name = "android-env";
          targetPkgs = pkgs: (with pkgs; [
            bun
            watchman
            jdk17
            gradle
            git
            curl
            unzip
            zlib
            ncurses5
            stdenv.cc.cc.lib
          ]);
          multiPkgs = pkgs: (with pkgs; [
            zlib
            ncurses5
          ]);
          runScript = "bash";
          profile = ''
            export ANDROID_HOME="${androidSdkHome}"
            export ANDROID_SDK_ROOT="$ANDROID_HOME"
            export JAVA_HOME="${pkgs.jdk17}"
            export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
          '';
        };
      in
      {
        packages.android-shell = androidEnv;

        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # JavaScript runtime & package manager
            bun

            # React Native requirements
            watchman

            # Android development
            cmdlineTools
            jdk17
            gradle

            # Native ARM tools (adb, fastboot) for aarch64 systems
            # Google doesn't provide ARM64 platform-tools, so use nixpkgs version
          ] ++ pkgs.lib.optionals pkgs.stdenv.isAarch64 [
            android-tools
            # x86-64 user-mode emulation for Android build tools (AAPT2, CMake, etc.)
            qemu-user
            patchelf
          ] ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
            # iOS development (macOS only)
            cocoapods
            xcodes
          ] ++ [
            # General utilities
            git
            curl
            unzip
          ];

          shellHook = ''
            # Set up Android SDK in home directory
            export ANDROID_HOME="${androidSdkHome}"
            export ANDROID_SDK_ROOT="$ANDROID_HOME"

            # Java configuration
            export JAVA_HOME="${pkgs.jdk17}"

            # Gradle configuration
            export GRADLE_OPTS="-Dorg.gradle.daemon=true"

            # Accept Android SDK licenses
            export NIXPKGS_ACCEPT_ANDROID_SDK_LICENSE=1

            # Initialize Android SDK if not already done
            if [ ! -d "$ANDROID_HOME/platforms" ]; then
              echo "Setting up Android SDK for the first time..."
              echo "This will download necessary packages and may take a few minutes."

              # Create SDK directory structure
              mkdir -p "$ANDROID_HOME"

              # Copy cmdline-tools and licenses from Nix store
              cp -r ${cmdlineTools}/cmdline-tools "$ANDROID_HOME/"
              cp -r ${cmdlineTools}/licenses "$ANDROID_HOME/"

              # Make scripts executable
              chmod -R +x "$ANDROID_HOME/cmdline-tools/latest/bin"

              # Set up sdkmanager
              SDKMANAGER="$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager"

              ${pkgs.lib.optionalString (!pkgs.stdenv.isAarch64) ''
              # On x86 systems, install platform-tools from sdkmanager
              echo "Installing platform-tools..."
              $SDKMANAGER --sdk_root="$ANDROID_HOME" "platform-tools"
              ''}

              echo "Installing platforms..."
              $SDKMANAGER --sdk_root="$ANDROID_HOME" "platforms;android-35"
              $SDKMANAGER --sdk_root="$ANDROID_HOME" "platforms;android-34"

              echo "Installing build-tools..."
              $SDKMANAGER --sdk_root="$ANDROID_HOME" "build-tools;35.0.0"
              $SDKMANAGER --sdk_root="$ANDROID_HOME" "build-tools;34.0.0"

              echo "Installing NDK..."
              $SDKMANAGER --sdk_root="$ANDROID_HOME" "ndk;26.1.10909125"
              $SDKMANAGER --sdk_root="$ANDROID_HOME" "ndk;27.1.12297006"

              echo "Installing system images (this may take a while)..."
              $SDKMANAGER --sdk_root="$ANDROID_HOME" "system-images;android-35;google_apis_playstore;arm64-v8a"
              $SDKMANAGER --sdk_root="$ANDROID_HOME" "system-images;android-34;google_apis_playstore;arm64-v8a"

              echo "Android SDK setup complete!"
            fi

            ${pkgs.lib.optionalString pkgs.stdenv.isAarch64 ''
            # On ARM64 systems, use native platform-tools instead of x86 versions
            # Create platform-tools directory and symlink ARM binaries
            mkdir -p "$ANDROID_HOME/platform-tools"
            ln -sf ${pkgs.android-tools}/bin/adb "$ANDROID_HOME/platform-tools/adb"
            ln -sf ${pkgs.android-tools}/bin/fastboot "$ANDROID_HOME/platform-tools/fastboot"

            # Override adb in PATH to ensure native ARM version is used
            export PATH="${pkgs.android-tools}/bin:$PATH"

            # Set up QEMU user-mode emulation for x86-64 binaries
            export QEMU_LD_PREFIX=${pkgs.pkgsCross.gnu64.buildPackages.glibc}

            # Check if binfmt_misc is available for x86-64 emulation
            if [ -f /proc/sys/fs/binfmt_misc/status ]; then
              echo "  binfmt_misc is available - x86-64 emulation should work"
            else
              echo "  Warning: binfmt_misc not available. You may need to enable it system-wide."
              echo "  Add to your NixOS configuration: boot.binfmt.emulatedSystems = [ \"x86_64-linux\" ];"
            fi
            ''}

            # Set NDK path if it exists (prefer newer version)
            if [ -d "$ANDROID_HOME/ndk/27.1.12297006" ]; then
              export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/27.1.12297006"
            elif [ -d "$ANDROID_HOME/ndk/26.1.10909125" ]; then
              export ANDROID_NDK_ROOT="$ANDROID_HOME/ndk/26.1.10909125"
            fi

            # Set up PATH with Android tools
            export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/emulator:$PATH"

            # Set LD_LIBRARY_PATH for x86-64 libraries (required for Android build tools under QEMU)
            export LD_LIBRARY_PATH="/lib64:$LD_LIBRARY_PATH"

            echo "React Native Expo development environment loaded"
            echo "  System: ${system}"
            echo "  Bun: $(bun --version)"
            echo "  Java: $(java --version 2>&1 | head -1)"
            echo "  Android SDK: $ANDROID_HOME"
            if command -v adb &> /dev/null; then
              echo "  ADB location: $(which adb)"
              echo "  ADB architecture: $(file $(readlink -f $(which adb)) 2>/dev/null | grep -o 'ARM\|x86\|aarch64' || echo 'unknown')"
            fi
          '';
        };
      }
    );
}
