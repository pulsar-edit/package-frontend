# Download Links

This repo also serves the vital purpose of handling download redirects.

Currently we build on every push to `master` for `pulsar`. Each new run on Cirrus CI results in a binary application for many different operating systems and their variances.

In order to allow users to install these easily the `https://web.pulsar-edit.dev/download` URL can redirect to any one of our binaries through a simple link and simple query parameters.

To configure a link to properly point a user in the right direction take a look at the content below:

---

URL: https://web.pulsar-edit.dev/download
Query Parameters: `os` && `type`

All `os` Options:

- `windows`
- `intel_mac`
- `silicon_mac`
- `linux`
- `arm_linux`

All `type` Options:

- `windows_setup`
- `windows_portable`
- `windows_blockmap`
- `mac_zip`
- `mac_zip_blockmap`
- `mac_dmg`
- `mac_dmg_blockmap`
- `linux_appimage`
- `linux_tar`
- `linux_rpm`
- `linux_deb`

Example: https://web.pulsar-edit.dev/download?os=windows&type=windows_portable

Full Table:

| Binary Name | Query `os` Value | Query `type` Value |
| ---         | ---              | ---                |
| Pulsar 1.63.2022120100.exe | `windows` | `windows_portable` |
| Pulsar Setup 1.63.2022120100.exe | `windows` | `windows_setup` |
| Pulsar Setup 1.63.2022120100.exe.blockmap | `windows` | `windows_blockmap` |
| Pulsar-1.63.2022120100-mac.zip | `intel_mac` | `mac_zip` |
| Pulsar-1.63.2022120100-mac.zip.blockmap | `intel_mac` | `mac_zip_blockmap` |
| Pulsar-1.63.2022120100.dmg | `intel_mac` | `mac_dmg` |
| Pulsar-1.63.2022120100.dmg.blockmap | `intel_mac` | `mac_dmg_blockmap` |
| Pulsar-1.63.2022120100-arm64-mac.zip | `silicon_mac` | `mac_zip` |
| Pulsar-1.63.2022120100-arm64-mac.zip.blockmap | `silicon_mac` | `mac_zip_blockmap` |
| Pulsar-1.63.2022120100-arm64.dmg | `silicon_mac` | `mac_dmg` |
| Pulsar-1.63.2022120100-arm64.dmg.blockmap | `silicon_mac` | `mac_dmg_blockmap` |
| Pulsar-1.63.2022120100-arm64.AppImage | `arm_linux` | `linux_appimage` |
| pulsar-1.63.2022120100-arm64.tar.gz | `arm_linux` | `linux_tar` |
| pulsar-1.63.2022120100.aarch64.rpm | `arm_linux` | `linux_rpm` |
| pulsar_1.63.2022120100_arm64.deb | `arm_linux` | `linux_deb` |
| Pulsar-1.63.2022120100.AppImage | `linux` | `linux_appimage` |
| pulsar-1.63.2022120100.tar.gz | `linux` | `linux_tar` |
| pulsar-1.63.2022120100.x86_64.rpm | `linux` | `linux_rpm` |
| pulsar_1.63.2022120100_amd64.deb | `linux` | `linux_deb` |
