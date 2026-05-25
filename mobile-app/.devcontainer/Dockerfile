FROM mcr.microsoft.com/devcontainers/base:ubuntu-24.04

# ── System dependencies ────────────────────────────────────────────────────────
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive && \
    apt-get install -y --no-install-recommends \
        # Core tools
        curl \
        git \
        unzip \
        xz-utils \
        zip \
        wget \
        ca-certificates \
        # Flutter Linux build deps
        clang \
        cmake \
        ninja-build \
        pkg-config \
        libgtk-3-dev \
        liblzma-dev \
        libglu1-mesa \
        # Android SDK deps
        openjdk-17-jdk \
        lib32stdc++6 \
        libstdc++6 \
        # ADB (connect to physical device via USB/TCP)
        adb \
        # Useful dev tools
        jq \
        gnupg2 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ── Flutter SDK ────────────────────────────────────────────────────────────────
ARG FLUTTER_VERSION=3.32.1
ARG FLUTTER_CHANNEL=stable

ENV FLUTTER_HOME=/opt/flutter
ENV PATH="${FLUTTER_HOME}/bin:${PATH}"

RUN git clone \
      --depth 1 \
      --branch ${FLUTTER_VERSION} \
      https://github.com/flutter/flutter.git \
      ${FLUTTER_HOME} && \
    # Pre-download Dart SDK + tool artifacts
    flutter precache --android --no-ios --no-web --no-linux --no-macos --no-windows && \
    # Allow vscode user to use flutter
    chown -R vscode:vscode ${FLUTTER_HOME}

# ── Android SDK ────────────────────────────────────────────────────────────────
ARG ANDROID_CMDTOOLS_VERSION=11076708
ENV ANDROID_HOME=/opt/android-sdk
ENV PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${PATH}"

RUN mkdir -p ${ANDROID_HOME}/cmdline-tools && \
    curl -fsSL \
      "https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMDTOOLS_VERSION}_latest.zip" \
      -o /tmp/cmdtools.zip && \
    unzip -q /tmp/cmdtools.zip -d /tmp/cmdtools && \
    mv /tmp/cmdtools/cmdline-tools ${ANDROID_HOME}/cmdline-tools/latest && \
    rm -rf /tmp/cmdtools.zip /tmp/cmdtools && \
    # Accept all licenses non-interactively
    yes | sdkmanager --licenses && \
    # Install required SDK components
    sdkmanager \
        "platform-tools" \
        "platforms;android-35" \
        "build-tools;35.0.0" && \
    chown -R vscode:vscode ${ANDROID_HOME}

# ── Flutter doctor pre-run (suppress first-run analytics prompt) ───────────────
RUN flutter config --no-analytics && \
    flutter doctor --android-licenses || true

# ── Switch to non-root user ────────────────────────────────────────────────────
USER vscode
WORKDIR /workspace
