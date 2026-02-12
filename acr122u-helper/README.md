# ACR122U Helper Service

A local Node.js service that bridges your ACR122U USB NFC reader with the web browser via WebSocket.

## Why is this needed?

Browsers block direct access to CCID (smart card reader) devices like the ACR122U for security reasons. This helper service runs locally on your computer and:

1. Communicates with the ACR122U using native PC/SC APIs
2. Runs a WebSocket server on `ws://localhost:9876`
3. Sends tag UIDs and data to your browser when you scan tags

## Prerequisites

### macOS
PC/SC is usually pre-installed. If not:
```bash
brew install pcsc-lite
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install libpcsclite1 libpcsclite-dev pcscd
sudo systemctl start pcscd
```

### Windows
WinSCard is built into Windows. The ACR122U usually just needs its driver installed.

## Installation

```bash
cd acr122u-helper
npm install
```

Note: The `nfc-pcsc` package may need to compile native code. If you encounter issues:

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install build-essential
```

**Windows:**
Make sure you have Visual Studio Build Tools installed.

## Usage

1. **Connect your ACR122U reader** to a USB port

2. **Start the helper service:**
   ```bash
   npm start
   ```

3. **In your web app:**
   - Go to Tag Management
   - In the ACR122U section, select "WebSocket" connection mode
   - Click "Connect Reader"
   - You should see "Connected to ACR122U via helper service"

4. **Scan tags:**
   - Place NFC tags on the ACR122U reader
   - The tag UID will automatically appear in the web app

## Troubleshooting

### "SCARD_E_NO_SERVICE" error

The PC/SC service isn't running:
- **macOS**: Try unplugging and reconnecting the reader
- **Linux**: `sudo systemctl start pcscd`
- **Windows**: Check that "Smart Card" service is running in services.msc

### Reader not detected

1. Make sure the ACR122U is connected and the LED is on
2. On Linux, you may need to add udev rules:
   ```bash
   sudo nano /etc/udev/rules.d/99-acr122.rules
   ```
   Add:
   ```
   SUBSYSTEM=="usb", ATTRS{idVendor}=="072f", ATTRS{idProduct}=="2200", MODE="0666"
   ```
   Then:
   ```bash
   sudo udevadm control --reload-rules
   ```

### npm install fails with native compilation errors

Make sure you have build tools:
- **macOS**: `xcode-select --install`
- **Linux**: `sudo apt-get install build-essential`
- **Windows**: Install Visual Studio Build Tools

## WebSocket Protocol

The helper service sends JSON messages:

### Tag Detected
```json
{
  "type": "tag_detected",
  "uid": "04A2B3C4D5E6F7",
  "atr": "3B8F8001804F0CA0000003060300020000000069",
  "standard": "TAG_ISO_14443_3",
  "tagType": "TAG_ISO_14443_3",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Tag Removed
```json
{
  "type": "tag_removed",
  "timestamp": "2024-01-15T10:30:05.000Z"
}
```

### Reader Connected/Disconnected
```json
{
  "type": "reader_connected",
  "reader": "ACS ACR122U",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## License

MIT
