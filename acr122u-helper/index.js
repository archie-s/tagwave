/**
 * ACR122U Helper Service
 * 
 * This service runs locally and bridges communication between
 * the ACR122U NFC reader and the web browser via WebSocket.
 * 
 * Features:
 * - Read tag UID and metadata
 * - Read existing NDEF data from tags
 * - Check write protection status
 * - Detect password protection
 * 
 * Prerequisites:
 * - macOS: brew install pcsc-lite (usually pre-installed)
 * - Linux: sudo apt-get install libpcsclite1 libpcsclite-dev pcscd
 * - Windows: WinSCard is built-in
 * 
 * Usage:
 * 1. Connect your ACR122U reader
 * 2. Run: npm start
 * 3. Open your web app and select "WebSocket" connection mode
 */

const { NFC } = require('nfc-pcsc');
const WebSocket = require('ws');

const WS_PORT = 9876;
const nfc = new NFC();

// Track connected WebSocket clients
const clients = new Set();

// Create WebSocket server
const wss = new WebSocket.Server({ port: WS_PORT }, () => {
  console.log(`\n✅ WebSocket server running on ws://localhost:${WS_PORT}`);
  console.log('   Waiting for browser connections...\n');
});

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`🌐 Browser connected (${clients.size} client(s) total)`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'status',
    message: 'Connected to ACR122U helper service',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log(`🌐 Browser disconnected (${clients.size} client(s) remaining)`);
  });
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received from browser:', data);
      
      // Handle password authentication
      if (data.type === 'authenticate') {
        if (!currentReader) {
          ws.send(JSON.stringify({
            type: 'auth_result',
            success: false,
            error: 'No reader connected',
            timestamp: new Date().toISOString()
          }));
          return;
        }
        
        if (!currentTagUid) {
          ws.send(JSON.stringify({
            type: 'auth_result',
            success: false,
            error: 'No tag present on reader',
            timestamp: new Date().toISOString()
          }));
          return;
        }
        
        const result = await authenticateTag(currentReader, data.password);
        ws.send(JSON.stringify({
          type: 'auth_result',
          success: result.success,
          error: result.error || null,
          passwordBytes: result.passwordBytes || null,
          uid: currentTagUid,
          timestamp: new Date().toISOString()
        }));
      }
      
      // Handle write commands
      if (data.type === 'write') {
        console.log('📝 Write command received:', data);
        
        if (!currentReader) {
          ws.send(JSON.stringify({
            type: 'write_result',
            success: false,
            error: 'No reader connected',
            timestamp: new Date().toISOString()
          }));
          return;
        }
        
        if (!currentTagUid) {
          ws.send(JSON.stringify({
            type: 'write_result',
            success: false,
            error: 'No tag present on reader',
            timestamp: new Date().toISOString()
          }));
          return;
        }
        
        try {
          const result = await writeNdefToTag(currentReader, data.url, data.text, data.password);
          ws.send(JSON.stringify({
            type: 'write_result',
            success: result.success,
            error: result.error || null,
            passwordSet: result.passwordSet || false,
            uid: currentTagUid,
            timestamp: new Date().toISOString()
          }));
        } catch (e) {
          ws.send(JSON.stringify({
            type: 'write_result',
            success: false,
            error: e.message,
            uid: currentTagUid,
            timestamp: new Date().toISOString()
          }));
        }
      }
    } catch (e) {
      console.log('Invalid message from browser:', e.message);
    }
  });
});

// Track current reader and tag for authentication
let currentReader = null;
let currentTagUid = null;

// Broadcast message to all connected clients
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Convert password string to 4-byte buffer - SHARED by setTagPassword and authenticateTag
function convertPasswordToBytes(password) {
  if (password.length === 8 && /^[0-9A-Fa-f]+$/.test(password)) {
    // 8 hex characters = 4 bytes (e.g., "FFFFFFFF" = [0xFF, 0xFF, 0xFF, 0xFF])
    return { bytes: Buffer.from(password, 'hex'), format: 'hex' };
  } else if (password.length <= 4) {
    // Short ASCII password, pad with zeros
    const pwdBytes = Buffer.alloc(4, 0);
    Buffer.from(password, 'ascii').copy(pwdBytes);
    return { bytes: pwdBytes, format: 'ascii-padded' };
  } else {
    // Longer passwords: use first 4 ASCII chars (most common approach)
    // Note: we use first 4 chars, NOT MD5 hash - this is more intuitive for users
    const pwdBytes = Buffer.from(password.substring(0, 4), 'ascii');
    return { bytes: pwdBytes, format: 'first-4-ascii' };
  }
}

// Authenticate with password (for NTAG21x tags)
async function authenticateTag(reader, password) {
  try {
    if (!password) {
      return { success: false, error: 'Password is required' };
    }
    
    // Convert password using the same function as setTagPassword
    const primaryPwd = convertPasswordToBytes(password);
    
    // Build list of password formats to try - primary first, then alternatives
    const passwordsToTry = [primaryPwd];
    
    // Add alternative formats for compatibility with tags programmed by other apps
    if (primaryPwd.format !== 'hex' && password.length === 8 && /^[0-9A-Fa-f]+$/.test(password)) {
      passwordsToTry.push({ bytes: Buffer.from(password, 'hex'), format: 'hex' });
    }
    if (primaryPwd.format !== 'first-4-ascii' && password.length >= 4) {
      passwordsToTry.push({ bytes: Buffer.from(password.substring(0, 4), 'ascii'), format: 'first-4-ascii' });
    }
    if (primaryPwd.format !== 'ascii-padded' && password.length <= 4) {
      const padded = Buffer.alloc(4, 0);
      Buffer.from(password, 'ascii').copy(padded);
      passwordsToTry.push({ bytes: padded, format: 'ascii-padded' });
    }
    // MD5 hash for compatibility with some apps
    if (password.length > 4) {
      const crypto = require('crypto');
      const hash = crypto.createHash('md5').update(password).digest();
      passwordsToTry.push({ bytes: hash.slice(0, 4), format: 'md5-hash' });
    }
    
    // Also try factory default
    passwordsToTry.push({
      bytes: Buffer.from([0xFF, 0xFF, 0xFF, 0xFF]),
      format: 'factory-default'
    });
    
    console.log(`🔐 Attempting authentication with ${passwordsToTry.length} password formats...`);
    console.log(`   Original password: "${password}"`);
    
    // ACR122U IOCTL code for PC/SC escape commands
    // SCARD_CTL_CODE(3500) = 0x003136B0 on Windows/Mac
    // Some variants: 0x42000000 + 3500, CCID escape
    const IOCTL_CCID_ESCAPE = 0x42000000 + 3500;
    const IOCTL_ACR122U = 0x310 << 16 | 0x40 << 2; // Alternative
    
    let lastError = null;
    const triedFormats = [];
    
    for (const pwd of passwordsToTry) {
      const pwdBytes = pwd.bytes;
      const passwordBytesHex = pwdBytes.toString('hex').toUpperCase();
      console.log(`\n   Trying ${pwd.format}: ${passwordBytesHex}`);
      triedFormats.push(`${pwd.format}=${passwordBytesHex}`);
      
      // Method 1: Use reader.control() with IOCTL for direct PN532 command
      // This is the most reliable method for ACR122U
      try {
        // PN532 InCommunicateThru command: D4 42 <data>
        // Data is: 1B (PWD_AUTH) + 4 byte password
        const pn532Cmd = Buffer.concat([
          Buffer.from([0xD4, 0x42, 0x1B]), // InCommunicateThru + PWD_AUTH
          pwdBytes
        ]);
        
        const response = await reader.control(pn532Cmd, IOCTL_CCID_ESCAPE, 40);
        console.log(`     IOCTL Response: ${response.toString('hex').toUpperCase()}`);
        
        if (response && response.length >= 3) {
          // D5 43 00 means success (InCommunicateThru response with status 0)
          if (response[0] === 0xD5 && response[1] === 0x43 && response[2] === 0x00) {
            console.log(`✅ Authentication successful with ${pwd.format}: ${passwordBytesHex}`);
            return { success: true, passwordBytes: passwordBytesHex, format: pwd.format };
          }
        }
      } catch (e1) {
        console.log(`     IOCTL1 Error: ${e1.message}`);
      }
      
      // Method 2: Try alternative IOCTL code
      try {
        const pn532Cmd = Buffer.concat([
          Buffer.from([0xD4, 0x42, 0x1B]),
          pwdBytes
        ]);
        
        const response = await reader.control(pn532Cmd, IOCTL_ACR122U, 40);
        console.log(`     IOCTL2 Response: ${response.toString('hex').toUpperCase()}`);
        
        if (response && response.length >= 3 && response[0] === 0xD5 && response[2] === 0x00) {
          console.log(`✅ Authentication successful with ${pwd.format}: ${passwordBytesHex}`);
          return { success: true, passwordBytes: passwordBytesHex, format: pwd.format };
        }
      } catch (e2) {
        console.log(`     IOCTL2 Error: ${e2.message}`);
      }
      
      // Method 3: Use transmit with PC/SC escape APDU (FF 00 00 00)
      try {
        const authCmd = Buffer.concat([
          Buffer.from([0xFF, 0x00, 0x00, 0x00, 0x07, 0xD4, 0x42, 0x1B]),
          pwdBytes
        ]);
        
        const response = await reader.transmit(authCmd, 40);
        console.log(`     Transmit Response: ${response.toString('hex').toUpperCase()}`);
        
        if (response && response.length >= 2) {
          const hexResp = response.toString('hex').toUpperCase();
          // For NTAG PWD_AUTH:
          // Success: D5 43 00 [PACK1] [PACK2] 90 00 (at least 7 bytes)
          // Failure: D5 43 01 90 00 (NAK, 5 bytes) or just NAK
          
          // Check for D5 43 00 with at least the PACK bytes following
          if (hexResp.includes('D54300') && response.length >= 7) {
            console.log(`✅ Authentication successful with ${pwd.format}: ${passwordBytesHex}`);
            return { success: true, passwordBytes: passwordBytesHex, format: pwd.format };
          }
          
          // Also check for just the PACK response (some readers strip the D5 43 header)
          // PACK is typically 00 00 or a custom value, followed by 90 00
          // If we got EXACTLY 90 00 without NAK, it could be success
          if (hexResp === '9000' && response.length === 2) {
            // This might mean auth succeeded but no PACK returned
            console.log(`✅ Authentication possibly successful (9000 only) with ${pwd.format}: ${passwordBytesHex}`);
            return { success: true, passwordBytes: passwordBytesHex, format: pwd.format };
          }
          
          // Check for NAK response (D5 43 01 or just 01 in some response formats)
          if (hexResp.includes('D54301') || hexResp === '01' || (response.length <= 5 && response[response.length - 3] === 0x01)) {
            console.log(`     NAK received - wrong password`);
            continue; // Try next password format
          }
        }
      } catch (e3) {
        lastError = e3.message;
        console.log(`     Transmit Error: ${e3.message}`);
      }
    }
    
    // All formats failed
    console.log(`\n❌ Authentication failed with all password formats`);
    console.log(`   Formats tried: ${triedFormats.join(', ')}`);
    
    return { 
      success: false, 
      passwordBytes: triedFormats.join('; '),
      error: `Authentication failed. Tried formats: ${triedFormats.map(f => f.split('=')[0]).join(', ')}. If you know the exact 4-byte hex password, enter it as 8 hex characters (e.g., FFFFFFFF).`
    };
    
  } catch (e) {
    console.log(`❌ Authentication error: ${e.message}`);
    return { success: false, error: e.message };
  }
}

// Create NDEF URI record
function createNdefUriRecord(url) {
  // URI prefix codes for NDEF
  const uriPrefixes = [
    '', 'http://www.', 'https://www.', 'http://', 'https://',
    'tel:', 'mailto:', 'ftp://anonymous:anonymous@', 'ftp://ftp.',
    'ftps://', 'sftp://', 'smb://', 'nfs://', 'ftp://', 'dav://',
    'news:', 'telnet://', 'imap:', 'rtsp://', 'urn:', 'pop:',
    'sip:', 'sips:', 'tftp:', 'btspp://', 'btl2cap://', 'btgoep://',
    'tcpobex://', 'irdaobex://', 'file://'
  ];
  
  // Find matching prefix
  let prefixCode = 0;
  let uriWithoutPrefix = url;
  
  for (let i = 1; i < uriPrefixes.length; i++) {
    if (url.startsWith(uriPrefixes[i])) {
      prefixCode = i;
      uriWithoutPrefix = url.substring(uriPrefixes[i].length);
      break;
    }
  }
  
  const uriBytes = Buffer.from(uriWithoutPrefix, 'utf8');
  const payloadLength = 1 + uriBytes.length; // prefix code + URI
  
  // NDEF record header
  // Flags: MB=1, ME=1, CF=0, SR=1, IL=0, TNF=1 (Well-known)
  // Type = 'U' (URI)
  const header = Buffer.from([
    0xD1,           // MB=1, ME=1, CF=0, SR=1, IL=0, TNF=1
    0x01,           // Type length = 1
    payloadLength,  // Payload length
    0x55,           // Type = 'U' (0x55)
    prefixCode      // URI prefix code
  ]);
  
  return Buffer.concat([header, uriBytes]);
}

// Create NDEF Text record
function createNdefTextRecord(text, language = 'en') {
  const langBytes = Buffer.from(language, 'utf8');
  const textBytes = Buffer.from(text, 'utf8');
  const payloadLength = 1 + langBytes.length + textBytes.length;
  
  // Status byte: bit 7 = encoding (0=UTF-8), bits 5-0 = language length
  const statusByte = langBytes.length & 0x3F;
  
  // NDEF record header
  const header = Buffer.from([
    0xD1,           // MB=1, ME=1, CF=0, SR=1, IL=0, TNF=1
    0x01,           // Type length = 1
    payloadLength,  // Payload length
    0x54,           // Type = 'T' (0x54)
    statusByte      // Status byte
  ]);
  
  return Buffer.concat([header, langBytes, textBytes]);
}

// Write a single page (4 bytes) to NTAG/Ultralight
async function writePage(reader, page, data) {
  if (data.length !== 4) {
    throw new Error('Page data must be exactly 4 bytes');
  }
  
  // WRITE command for Ultralight/NTAG: FF D6 00 [page] 04 [data]
  const writeCmd = Buffer.concat([
    Buffer.from([0xFF, 0xD6, 0x00, page, 0x04]),
    data
  ]);
  
  const response = await reader.transmit(writeCmd, 10);
  
  if (response && response.length >= 2) {
    const sw = response.slice(-2).toString('hex').toUpperCase();
    if (sw === '9000') {
      return true;
    }
  }
  
  throw new Error(`Write failed at page ${page}: ${response ? response.toString('hex') : 'no response'}`);
}

// Set password protection on NTAG21x tags
async function setTagPassword(reader, password) {
  try {
    if (!password) return { success: true, passwordSet: false };
    
    console.log('🔐 Setting password protection...');
    console.log(`   Password: "${password}"`);
    
    // Convert password using the shared function (same as authenticateTag)
    const { bytes: pwdBytes, format } = convertPasswordToBytes(password);
    
    console.log(`   Password format: ${format}`);
    console.log(`   Password bytes: ${pwdBytes.toString('hex').toUpperCase()}`);
    
    // For NTAG21x, we need to find the correct config pages
    // NTAG213: pages 41-44
    // NTAG215: pages 131-134  
    // NTAG216: pages 227-230
    // Try to detect by reading different config addresses
    
    const configLayouts = [
      { cfgPage: 41, pwdPage: 43, packPage: 44, name: 'NTAG213', maxPage: 44 },
      { cfgPage: 131, pwdPage: 133, packPage: 134, name: 'NTAG215', maxPage: 134 },
      { cfgPage: 227, pwdPage: 229, packPage: 230, name: 'NTAG216', maxPage: 230 }
    ];
    
    let tagConfig = null;
    
    for (const layout of configLayouts) {
      try {
        // Try to read the config page
        const readCmd = Buffer.from([0xFF, 0xB0, 0x00, layout.cfgPage, 0x04]);
        const response = await reader.transmit(readCmd, 10);
        
        if (response && response.length >= 4) {
          const sw = response.slice(-2).toString('hex').toUpperCase();
          if (sw === '9000') {
            // Check if it looks like config data (not all zeros or all FF)
            const data = response.slice(0, 4);
            if (!(data[0] === 0 && data[1] === 0 && data[2] === 0 && data[3] === 0)) {
              tagConfig = layout;
              console.log(`   Detected ${layout.name} (config at page ${layout.cfgPage})`);
              break;
            }
          }
        }
      } catch (e) {
        continue;
      }
    }
    
    if (!tagConfig) {
      // Default to NTAG215 if we can't detect
      tagConfig = configLayouts[1];
      console.log(`   Could not detect tag type, assuming NTAG215`);
    }
    
    // Step 1: Write the password to PWD page (4 bytes)
    console.log(`   Writing password to page ${tagConfig.pwdPage}...`);
    try {
      await writePage(reader, tagConfig.pwdPage, pwdBytes);
      console.log(`   ✓ Password written`);
    } catch (e) {
      console.log(`   ✗ Password write failed: ${e.message}`);
      return { success: false, error: `Failed to write password: ${e.message}` };
    }
    
    // Step 2: Write PACK (Password ACKnowledge - typically 2 bytes + 2 zeros)
    // PACK is returned during successful authentication
    const packBytes = Buffer.from([0x00, 0x00, 0x00, 0x00]); // Default PACK
    console.log(`   Writing PACK to page ${tagConfig.packPage}...`);
    try {
      await writePage(reader, tagConfig.packPage, packBytes);
      console.log(`   ✓ PACK written`);
    } catch (e) {
      console.log(`   ✗ PACK write failed: ${e.message}`);
      // Not fatal, continue
    }
    
    // Step 3: Read current config to modify AUTH0 and ACCESS
    console.log(`   Reading config from page ${tagConfig.cfgPage}...`);
    const readCfgCmd = Buffer.from([0xFF, 0xB0, 0x00, tagConfig.cfgPage, 0x08]);
    const cfgResponse = await reader.transmit(readCfgCmd, 12);
    
    if (!cfgResponse || cfgResponse.length < 8 || cfgResponse.slice(-2).toString('hex').toUpperCase() !== '9000') {
      console.log(`   ✗ Failed to read config`);
      return { success: false, error: 'Failed to read tag configuration' };
    }
    
    // CFG0: MIRROR | RFUI | MIRROR_PAGE | AUTH0
    // CFG1: ACCESS | RFUI | RFUI | RFUI
    const cfg0 = Buffer.from(cfgResponse.slice(0, 4));
    const cfg1 = Buffer.from(cfgResponse.slice(4, 8));
    
    console.log(`   Current CFG0: ${cfg0.toString('hex').toUpperCase()}`);
    console.log(`   Current CFG1: ${cfg1.toString('hex').toUpperCase()}`);
    
    // Set AUTH0 to page 4 (protect from user data onwards)
    // Or 0 to protect everything including UID reading (usually not desired)
    cfg0[3] = 0x04; // Protect from page 4 (NDEF data area)
    
    // Set ACCESS byte:
    // Bit 7 (PROT): 0 = write protection only, 1 = read+write protection
    // Bit 6 (CFGLCK): lock config (don't set this!)
    // Bits 2-0 (AUTHLIM): auth attempt limit (0 = disabled)
    cfg1[0] = 0x00; // Write protection only (PROT=0), no auth limit
    
    console.log(`   New CFG0: ${cfg0.toString('hex').toUpperCase()}`);
    console.log(`   New CFG1: ${cfg1.toString('hex').toUpperCase()}`);
    
    // Step 4: Write updated config
    console.log(`   Writing config to page ${tagConfig.cfgPage}...`);
    try {
      await writePage(reader, tagConfig.cfgPage, cfg0);
      console.log(`   ✓ CFG0 written`);
    } catch (e) {
      console.log(`   ✗ CFG0 write failed: ${e.message}`);
      return { success: false, error: `Failed to write configuration: ${e.message}` };
    }
    
    console.log(`   Writing ACCESS to page ${tagConfig.cfgPage + 1}...`);
    try {
      await writePage(reader, tagConfig.cfgPage + 1, cfg1);
      console.log(`   ✓ CFG1 written`);
    } catch (e) {
      console.log(`   ✗ CFG1 write failed: ${e.message}`);
      return { success: false, error: `Failed to write access config: ${e.message}` };
    }
    
    console.log('✅ Password protection enabled!');
    console.log(`   The tag is now protected from page 4`);
    console.log(`   Password bytes: ${pwdBytes.toString('hex').toUpperCase()}`);
    
    return { success: true, passwordSet: true, passwordBytes: pwdBytes.toString('hex').toUpperCase() };
    
  } catch (e) {
    console.log(`❌ Password setting error: ${e.message}`);
    return { success: false, error: e.message };
  }
}

// Write NDEF data to tag
async function writeNdefToTag(reader, url, text, password) {
  try {
    console.log('📝 Writing NDEF to tag...');
    console.log(`   URL: ${url || '(none)'}`);
    console.log(`   Text: ${text || '(none)'}`);
    console.log(`   Password: ${password ? '(set)' : '(none)'}`);
    
    // Create NDEF message
    let ndefRecord;
    if (url) {
      ndefRecord = createNdefUriRecord(url);
    } else if (text) {
      ndefRecord = createNdefTextRecord(text);
    } else {
      return { success: false, error: 'No URL or text provided' };
    }
    
    console.log(`   NDEF Record (${ndefRecord.length} bytes): ${ndefRecord.toString('hex').toUpperCase()}`);
    
    // Wrap in TLV format for NTAG/Ultralight
    // TLV: Type=0x03 (NDEF), Length, Value, Terminator=0xFE
    let tlvData;
    if (ndefRecord.length < 255) {
      tlvData = Buffer.concat([
        Buffer.from([0x03, ndefRecord.length]), // NDEF TLV with 1-byte length
        ndefRecord,
        Buffer.from([0xFE]) // Terminator TLV
      ]);
    } else {
      tlvData = Buffer.concat([
        Buffer.from([0x03, 0xFF, (ndefRecord.length >> 8) & 0xFF, ndefRecord.length & 0xFF]), // 3-byte length
        ndefRecord,
        Buffer.from([0xFE])
      ]);
    }
    
    console.log(`   TLV Data (${tlvData.length} bytes): ${tlvData.toString('hex').toUpperCase()}`);
    
    // Pad to 4-byte boundary
    while (tlvData.length % 4 !== 0) {
      tlvData = Buffer.concat([tlvData, Buffer.from([0x00])]);
    }
    
    // Write starting at page 4 (user data area for NTAG/Ultralight)
    const startPage = 4;
    const numPages = Math.ceil(tlvData.length / 4);
    
    console.log(`   Writing ${numPages} pages starting at page ${startPage}...`);
    
    for (let i = 0; i < numPages; i++) {
      const pageData = tlvData.slice(i * 4, (i + 1) * 4);
      const page = startPage + i;
      
      try {
        await writePage(reader, page, pageData);
        console.log(`   ✓ Page ${page}: ${pageData.toString('hex').toUpperCase()}`);
      } catch (e) {
        console.log(`   ✗ Page ${page} failed: ${e.message}`);
        return { success: false, error: `Failed to write page ${page}: ${e.message}` };
      }
    }
    
    console.log('✅ NDEF write complete!');
    
    // Set password if provided
    if (password) {
      const pwdResult = await setTagPassword(reader, password);
      if (!pwdResult.success) {
        return { 
          success: false, 
          error: `NDEF written but password setting failed: ${pwdResult.error}`,
          ndefWritten: true 
        };
      }
      return { success: true, passwordSet: true };
    }
    
    return { success: true, passwordSet: false };
    
  } catch (e) {
    console.log(`❌ Write error: ${e.message}`);
    return { success: false, error: e.message };
  }
}

// Parse NDEF message from raw bytes
function parseNdefMessage(data) {
  const records = [];
  let offset = 0;
  
  while (offset < data.length) {
    if (data[offset] === 0x00 || data[offset] === 0xFE) break; // Null or terminator TLV
    
    const tnf = data[offset] & 0x07;
    const mb = (data[offset] & 0x80) !== 0; // Message Begin
    const me = (data[offset] & 0x40) !== 0; // Message End
    const cf = (data[offset] & 0x20) !== 0; // Chunk Flag
    const sr = (data[offset] & 0x10) !== 0; // Short Record
    const il = (data[offset] & 0x08) !== 0; // ID Length present
    
    offset++;
    if (offset >= data.length) break;
    
    const typeLength = data[offset++];
    if (offset >= data.length) break;
    
    let payloadLength;
    if (sr) {
      payloadLength = data[offset++];
    } else {
      if (offset + 4 > data.length) break;
      payloadLength = (data[offset] << 24) | (data[offset + 1] << 16) | (data[offset + 2] << 8) | data[offset + 3];
      offset += 4;
    }
    
    let idLength = 0;
    if (il) {
      if (offset >= data.length) break;
      idLength = data[offset++];
    }
    
    if (offset + typeLength + idLength + payloadLength > data.length) break;
    
    const type = data.slice(offset, offset + typeLength);
    offset += typeLength;
    
    const id = il ? data.slice(offset, offset + idLength) : Buffer.alloc(0);
    offset += idLength;
    
    const payload = data.slice(offset, offset + payloadLength);
    offset += payloadLength;
    
    // Decode based on TNF and type
    let record = {
      tnf,
      type: type.toString('utf8'),
      payload: payload.toString('hex'),
      payloadText: null,
      url: null
    };
    
    // TNF 1 = Well-known type
    if (tnf === 1) {
      const typeStr = type.toString('utf8');
      
      if (typeStr === 'T') {
        // Text record
        const statusByte = payload[0];
        const langCodeLen = statusByte & 0x3F;
        const encoding = (statusByte & 0x80) ? 'UTF-16' : 'UTF-8';
        const langCode = payload.slice(1, 1 + langCodeLen).toString('utf8');
        const text = payload.slice(1 + langCodeLen).toString(encoding === 'UTF-8' ? 'utf8' : 'utf16le');
        record.payloadText = text;
        record.language = langCode;
        record.recordType = 'text';
      } else if (typeStr === 'U') {
        // URI record
        const prefixCode = payload[0];
        const uriPrefixes = [
          '', 'http://www.', 'https://www.', 'http://', 'https://',
          'tel:', 'mailto:', 'ftp://anonymous:anonymous@', 'ftp://ftp.',
          'ftps://', 'sftp://', 'smb://', 'nfs://', 'ftp://', 'dav://',
          'news:', 'telnet://', 'imap:', 'rtsp://', 'urn:', 'pop:',
          'sip:', 'sips:', 'tftp:', 'btspp://', 'btl2cap://', 'btgoep://',
          'tcpobex://', 'irdaobex://', 'file://', 'urn:epc:id:', 'urn:epc:tag:',
          'urn:epc:pat:', 'urn:epc:raw:', 'urn:epc:', 'urn:nfc:'
        ];
        const prefix = uriPrefixes[prefixCode] || '';
        const uri = prefix + payload.slice(1).toString('utf8');
        record.url = uri;
        record.recordType = 'uri';
      } else if (typeStr === 'Sp') {
        record.recordType = 'smartposter';
      }
    } else if (tnf === 2) {
      // Media type (MIME)
      record.recordType = 'mime';
      record.mimeType = type.toString('utf8');
      // Try to decode as text if it looks like text
      if (record.mimeType.startsWith('text/')) {
        record.payloadText = payload.toString('utf8');
      }
    } else if (tnf === 4) {
      // External type
      record.recordType = 'external';
    }
    
    records.push(record);
    
    if (me) break; // Message End
  }
  
  return records;
}

// Read NDEF data from NTAG/MIFARE Ultralight tags
async function readNdefData(reader) {
  try {
    // NTAG/Ultralight memory starts at page 4
    // Each page is 4 bytes, we read multiple pages
    const ndefData = [];
    let ndefLength = 0;
    let foundNdef = false;
    
    // Read pages 4-39 (typical NDEF area for NTAG213/215/216)
    for (let page = 4; page < 40; page += 4) {
      try {
        // READ command: reads 16 bytes (4 pages) starting at specified page
        const readCmd = Buffer.from([0xFF, 0xB0, 0x00, page, 0x10]);
        const response = await reader.transmit(readCmd, 20);
        
        if (response && response.length >= 16) {
          const sw = response.slice(-2).toString('hex').toUpperCase();
          if (sw === '9000') {
            const pageData = response.slice(0, 16);
            
            // Look for NDEF TLV (Type 0x03)
            for (let i = 0; i < pageData.length; i++) {
              if (!foundNdef && pageData[i] === 0x03) {
                foundNdef = true;
                // Next byte is length (or 0xFF for 3-byte length)
                if (i + 1 < pageData.length) {
                  if (pageData[i + 1] === 0xFF && i + 3 < pageData.length) {
                    ndefLength = (pageData[i + 2] << 8) | pageData[i + 3];
                    i += 3;
                  } else {
                    ndefLength = pageData[i + 1];
                    i += 1;
                  }
                }
                continue;
              }
              
              if (foundNdef && ndefData.length < ndefLength) {
                ndefData.push(pageData[i]);
              }
            }
            
            if (ndefData.length >= ndefLength && foundNdef) break;
          } else {
            break; // Read failed, likely end of memory
          }
        } else {
          break;
        }
      } catch (e) {
        break; // Read error, likely reached end of accessible memory
      }
    }
    
    if (ndefData.length > 0) {
      return Buffer.from(ndefData);
    }
    return null;
  } catch (e) {
    console.log('   Error reading NDEF:', e.message);
    return null;
  }
}

// Check if tag is write protected (for NTAG/Ultralight)
async function checkWriteProtection(reader) {
  try {
    // Read configuration pages (varies by tag type)
    // NTAG213: config at pages 41-44 (AUTH0 at 41[3], ACCESS at 42[0])
    // NTAG215: config at pages 131-134
    // NTAG216: config at pages 227-230
    // Ultralight C: auth at page 42+
    
    // Configuration page layouts for different NTAGs:
    // Page offset from config start:
    // +0: MIRROR, RFUI, MIRROR_PAGE, AUTH0 (AUTH0 is byte 3)
    // +1: ACCESS, RFUI (ACCESS byte 0, bit 7 is PROT)
    // +2: PWD (4 bytes)
    // +3: PACK (2 bytes) + RFUI
    
    const configStartPages = [
      { page: 41, name: 'NTAG213' },
      { page: 131, name: 'NTAG215' },
      { page: 227, name: 'NTAG216' },
      { page: 37, name: 'NTAG210/212' }
    ];
    
    for (const config of configStartPages) {
      try {
        // Read 4 pages starting from config page (16 bytes total)
        const readCmd = Buffer.from([0xFF, 0xB0, 0x00, config.page, 0x10]);
        const response = await reader.transmit(readCmd, 20);
        
        console.log(`   Trying config page ${config.page} (${config.name})`);
        console.log(`   Read response (${response.length} bytes): ${response.toString('hex').toUpperCase()}`);
        
        if (response && response.length >= 8) {
          const sw = response.slice(-2).toString('hex').toUpperCase();
          if (sw === '9000') {
            // Print raw bytes for debugging
            console.log(`   Raw page data: ${response.slice(0, 16).toString('hex').toUpperCase()}`);
            
            // For NTAG21x, the configuration page layout is:
            // Page CFG0 (e.g., 41): MIRROR | RFUI | MIRROR_PAGE | AUTH0
            // Page CFG1 (e.g., 42): ACCESS | RFUI | RFUI | RFUI
            // 
            // So in 16-byte read starting at CFG0:
            // Byte 0: MIRROR, Byte 1: RFUI, Byte 2: MIRROR_PAGE, Byte 3: AUTH0
            // Byte 4: ACCESS, Byte 5-7: RFUI
            
            const auth0 = response[3]; // AUTH0 is byte 3 of CFG0
            const access = response[4]; // ACCESS is byte 0 of CFG1
            const prot = (access & 0x80) !== 0; // PROT bit is bit 7 of ACCESS
            
            console.log(`   Bytes: [0]=${response[0].toString(16)} [1]=${response[1].toString(16)} [2]=${response[2].toString(16)} [3]=${response[3].toString(16)} [4]=${response[4].toString(16)}`);
            console.log(`   AUTH0 = 0x${auth0.toString(16).toUpperCase().padStart(2, '0')} (${auth0})`);
            console.log(`   ACCESS = 0x${access.toString(16).toUpperCase().padStart(2, '0')}, PROT bit = ${prot}`);
            
            // Password protection is enabled if AUTH0 < total pages of the tag
            // For NTAG213: pages 0-44, so AUTH0 must be <= 44 to be valid protection
            // For unprotected tags, AUTH0 should be 0xFF (255)
            // Note: AUTH0 = 0 means protection from page 0 which is unusual
            // But we also need to verify the values make sense
            
            // If all bytes are 0x00, this might be wrong data
            if (response[0] === 0 && response[1] === 0 && response[2] === 0 && response[3] === 0 && response[4] === 0) {
              console.log(`   All zeros detected - likely wrong page address, trying next config`);
              continue;
            }
            
            const pwdProtected = auth0 < 0xFF;
            
            console.log(`   Password Protected: ${pwdProtected ? `Yes (from page ${auth0})` : 'No (AUTH0=0xFF)'}`);
            
            // Read static lock bytes (page 2, bytes 2-3)
            const lockCmd = Buffer.from([0xFF, 0xB0, 0x00, 0x02, 0x04]);
            const lockResponse = await reader.transmit(lockCmd, 8);
            
            let staticLock = false;
            if (lockResponse && lockResponse.length >= 4 && lockResponse.slice(-2).toString('hex').toUpperCase() === '9000') {
              const lockByte0 = lockResponse[2];
              const lockByte1 = lockResponse[3];
              staticLock = (lockByte0 !== 0x00 || lockByte1 !== 0x00);
              console.log(`   Static Lock Bytes: ${lockByte0.toString(16).padStart(2, '0')} ${lockByte1.toString(16).padStart(2, '0')} (locked: ${staticLock})`);
            }
            
            return {
              passwordProtected: pwdProtected,
              writeProtected: staticLock || (pwdProtected && prot),
              auth0Page: auth0,
              accessBits: access,
              configPage: config.page,
              tagType: config.name
            };
          }
        }
      } catch (e) {
        // Config page not accessible at this address - try next
        continue;
      }
    }
    
    // Could not find config pages - assume writable
    console.log('   Could not find config pages - assuming no protection');
    return {
      passwordProtected: false,
      writeProtected: false,
      auth0Page: 0xFF,
      accessBits: 0,
      configPage: null
    };
  } catch (e) {
    console.log('   Error checking write protection:', e.message);
    return {
      passwordProtected: false,
      writeProtected: false,
      error: e.message
    };
  }
}

// Get tag memory size
async function getTagMemoryInfo(reader, atr) {
  // Parse ATR to determine tag type
  const atrHex = atr.toUpperCase();
  
  let tagType = 'Unknown';
  let memorySize = 0;
  let usablePages = 0;
  
  // Common ATR patterns for NFC tags
  if (atrHex.includes('0044')) {
    // MIFARE Ultralight or NTAG
    if (atrHex.includes('00440300')) {
      tagType = 'MIFARE Ultralight';
      memorySize = 64;
      usablePages = 16;
    } else if (atrHex.includes('00440301')) {
      tagType = 'NTAG203';
      memorySize = 168;
      usablePages = 42;
    }
  }
  
  // Try to detect NTAG by reading version
  try {
    const getVersion = Buffer.from([0xFF, 0x00, 0x00, 0x00, 0x02, 0x60, 0x00]);
    const versionResponse = await reader.transmit(getVersion, 12);
    
    if (versionResponse && versionResponse.length >= 8) {
      const prodType = versionResponse[2];
      const prodSubtype = versionResponse[3];
      const storageSize = versionResponse[6];
      
      if (prodType === 0x04) {
        // NTAG family
        if (storageSize === 0x0F) {
          tagType = 'NTAG213';
          memorySize = 180;
          usablePages = 45;
        } else if (storageSize === 0x11) {
          tagType = 'NTAG215';
          memorySize = 540;
          usablePages = 135;
        } else if (storageSize === 0x13) {
          tagType = 'NTAG216';
          memorySize = 924;
          usablePages = 231;
        }
      }
    }
  } catch (e) {
    // GET_VERSION not supported
  }
  
  return { tagType, memorySize, usablePages };
}

// NFC Reader Events
nfc.on('reader', (reader) => {
  console.log(`\n📟 NFC Reader detected: ${reader.name}`);
  
  // Set current reader for authentication
  currentReader = reader;
  
  // Notify browsers
  broadcast({
    type: 'reader_connected',
    reader: reader.name,
    timestamp: new Date().toISOString()
  });
  
  // Disable auto-processing of tags (we manually handle)
  reader.aid = 'no-auto';
  
  reader.on('card', async (card) => {
    const uid = card.uid || 'unknown';
    const atr = card.atr ? card.atr.toString('hex').toUpperCase() : 'N/A';
    const standard = card.standard || 'unknown';
    const type = card.type || 'unknown';
    
    // Track current tag for authentication
    currentTagUid = uid;
    
    console.log(`\n🏷️  Tag detected!`);
    console.log(`   UID: ${uid}`);
    console.log(`   ATR: ${atr}`);
    console.log(`   Standard: ${standard}`);
    console.log(`   Type: ${type}`);
    
    // Get memory info
    const memoryInfo = await getTagMemoryInfo(reader, atr);
    console.log(`   Tag Type: ${memoryInfo.tagType}`);
    console.log(`   Memory: ${memoryInfo.memorySize} bytes`);
    
    // Check write protection
    const protection = await checkWriteProtection(reader);
    console.log(`   Password Protected: ${protection.passwordProtected ? 'Yes' : 'No'}`);
    console.log(`   Write Protected: ${protection.writeProtected ? 'Yes' : 'No'}`);
    
    // Read NDEF data
    const ndefRaw = await readNdefData(reader);
    let ndefRecords = [];
    let hasData = false;
    
    if (ndefRaw && ndefRaw.length > 0) {
      hasData = true;
      ndefRecords = parseNdefMessage(ndefRaw);
      console.log(`   NDEF Records: ${ndefRecords.length}`);
      ndefRecords.forEach((rec, i) => {
        console.log(`     [${i}] Type: ${rec.recordType || rec.type}`);
        if (rec.url) console.log(`         URL: ${rec.url}`);
        if (rec.payloadText) console.log(`         Text: ${rec.payloadText}`);
      });
    } else {
      console.log('   NDEF Data: Empty or not present');
    }
    
    // Determine if tag is writable
    const isWritable = !protection.writeProtected && !protection.passwordProtected;
    
    // Send comprehensive tag info to browsers
    broadcast({
      type: 'tag_detected',
      uid: uid,
      atr: atr,
      standard: standard,
      tagType: memoryInfo.tagType,
      memorySize: memoryInfo.memorySize,
      usablePages: memoryInfo.usablePages,
      protection: {
        passwordProtected: protection.passwordProtected,
        writeProtected: protection.writeProtected,
        auth0Page: protection.auth0Page,
        isWritable: isWritable
      },
      ndef: {
        hasData: hasData,
        records: ndefRecords,
        rawHex: ndefRaw ? ndefRaw.toString('hex').toUpperCase() : null
      },
      timestamp: new Date().toISOString()
    });
  });
  
  reader.on('card.off', (card) => {
    console.log(`\n🏷️  Tag removed`);
    
    // Clear current tag
    currentTagUid = null;
    
    broadcast({
      type: 'tag_removed',
      timestamp: new Date().toISOString()
    });
  });
  
  reader.on('error', (err) => {
    console.error(`❌ Reader error: ${err.message}`);
    
    broadcast({
      type: 'error',
      message: `Reader error: ${err.message}`,
      timestamp: new Date().toISOString()
    });
  });
  
  reader.on('end', () => {
    console.log(`📟 Reader disconnected: ${reader.name}`);
    
    // Clear current reader and tag
    if (currentReader === reader) {
      currentReader = null;
      currentTagUid = null;
    }
    
    broadcast({
      type: 'reader_disconnected',
      reader: reader.name,
      timestamp: new Date().toISOString()
    });
  });
});

nfc.on('error', (err) => {
  console.error('❌ NFC error:', err.message);
  
  // Check for common issues
  if (err.message.includes('SCARD_E_NO_SERVICE')) {
    console.log('\n⚠️  PC/SC service not running!');
    console.log('   macOS: Usually auto-runs, try reconnecting reader');
    console.log('   Linux: sudo systemctl start pcscd');
    console.log('   Windows: Check Smart Card service in services.msc\n');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down helper service...');
  wss.close();
  process.exit(0);
});

// Startup banner
console.log('\n╔════════════════════════════════════════════╗');
console.log('║       ACR122U NFC Helper Service           ║');
console.log('╠════════════════════════════════════════════╣');
console.log('║  Connect your ACR122U reader to start      ║');
console.log('║  Press Ctrl+C to stop                      ║');
console.log('╚════════════════════════════════════════════╝');
console.log('\n🔌 Waiting for NFC reader...\n');
