// A module that defines the way we locate a specific binary file amid all possible
// Pulsar Rolling Release binaries.
// In order to do this the following keys are available:
//  - startsWith: Checks if the version string startsWith the value
//  - endsWith: Checks if the version string endsWith the value
//  - endsWithNot: Checks if the version string does not end with the value

module.exports = {
  windows: {
    windows_setup: {
      startsWith: "Pulsar.Setup",
      endsWith: ".exe"
    },
    windows_portable: {
      endsWith: "-win.zip"
    },
    windows_blockmap: {
      startsWith: "Pulsar.Setup",
      endsWith: ".exe.blockmap"
    }
  },

  silicon_mac: {
    mac_zip: {
      endsWith: "-arm64-mac.zip"
    },
    mac_zip_blockmap: {
      endsWith: "-arm64-mac.zip.blockmap"
    },
    mac_dmg: {
      endsWith: "-arm64.dmg"
    },
    mac_dmg_blockmap: {
      endsWith: "-arm64.dmg.blockmap"
    }
  },

  intel_mac: {
    mac_zip: {
      endsWith: "-mac.zip",
      endsWithNot: "-arm64-mac.zip"
    },
    mac_zip_blockmap: {
      endsWith: "-mac.zip.blockmap",
      endsWithNot: "-arm64-mac.zip.blockmap"
    },
    mac_dmg: {
      endsWith: ".dmg",
      endsWithNot: "-arm64.dmg"
    },
    mac_dmg_blockmap: {
      endsWith: ".dmg.blockmap",
      endsWithNot: "-arm64.dmg.blockmap"
    }
  },

  arm_linux: {
    linux_appimage: {
      endsWith: "-arm64.AppImage"
    },
    linux_tar: {
      endsWith: "-arm64.tar.gz"
    },
    linux_rpm: {
      endsWith: ".aarch64.rpm"
    },
    linux_deb: {
      endsWith: "_arm64.deb"
    }
  },

  linux: {
    linux_appimage: {
      endsWith: ".AppImage",
      endsWithNot: "-arm64.AppImage"
    },
    linux_tar: {
      endsWith: ".tar.gz",
      endsWithNot: "-arm64.tar.gz"
    },
    linux_rpm: {
      endsWith: ".x86_64.rpm"
    },
    linux_deb: {
      endsWith: "_amd64.deb"
    }
  }
};
