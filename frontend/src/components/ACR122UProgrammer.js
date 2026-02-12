import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ACR122UProgrammer.css';

// WebSocket server URL for local ACR122U helper service
const WS_SERVER_URL = 'ws://localhost:9876';

const ACR122UProgrammer = ({ eventId, eventName, onTagProgrammed }) => {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionMode, setConnectionMode] = useState('manual'); // 'websocket', 'manual'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);
  
  // Bulk programming state
  const [mode, setMode] = useState('bulk'); // 'bulk' or 'single'
  const [csvData, setCsvData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [programmedTags, setProgrammedTags] = useState([]);
  const [isProgramming, setIsProgramming] = useState(false);
  
  // Single tag programming state
  const [singleTagForm, setSingleTagForm] = useState({
    tagId: '',
    name: '',
    destinationUrl: '',
    description: '',
  });

  // Scanned tag state (for read-first workflow)
  const [scannedTag, setScannedTag] = useState(null); // { uid, scannedAt }
  const [scanMode, setScanMode] = useState('read'); // 'read', 'write', or 'unlock'

  // Password authentication state
  const [authPassword, setAuthPassword] = useState(''); // Password for unlocking protected tags
  const [pendingUnlock, setPendingUnlock] = useState(false); // Waiting for scan to unlock
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // New password for programming
  const [newPassword, setNewPassword] = useState(''); // Optional password to set when programming

  // Manual tag UID input
  const [manualTagUid, setManualTagUid] = useState('');
  
  // WebSocket reference
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastTagUidRef = useRef(null);
  
  // Refs to access latest state in callbacks
  const pendingUnlockRef = useRef(false);
  const authPasswordRef = useRef('');
  const newPasswordRef = useRef('');
  const pendingWriteRef = useRef(null); // Stores pending write data { tagData, url }
  const scanModeRef = useRef('read');
  const isProgrammingRef = useRef(false);
  const modeRef = useRef('bulk');
  const singleTagFormRef = useRef({ tagId: '', name: '', destinationUrl: '', description: '' });

  // Keep refs in sync with state
  useEffect(() => { pendingUnlockRef.current = pendingUnlock; }, [pendingUnlock]);
  useEffect(() => { authPasswordRef.current = authPassword; }, [authPassword]);
  useEffect(() => { newPasswordRef.current = newPassword; }, [newPassword]);
  useEffect(() => { scanModeRef.current = scanMode; }, [scanMode]);
  useEffect(() => { isProgrammingRef.current = isProgramming; }, [isProgramming]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { singleTagFormRef.current = singleTagForm; }, [singleTagForm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // These refs intentionally read current value at cleanup time
      /* eslint-disable react-hooks/exhaustive-deps */
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      /* eslint-enable react-hooks/exhaustive-deps */
    };
  }, []);

  // Connect via WebSocket to local helper service
  const connectViaWebSocket = () => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(WS_SERVER_URL);
        
        ws.onopen = () => {
          wsRef.current = ws;
          setDeviceInfo({ name: 'ACR122U (via Helper)', mode: 'websocket' });
          resolve(true);
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'tag_detected' && data.uid) {
              // Debounce - don't process same tag twice in quick succession
              if (data.uid !== lastTagUidRef.current) {
                lastTagUidRef.current = data.uid;
                // Pass full tag data including NDEF, protection, etc.
                handleTagDetected(data.uid, {
                  atr: data.atr,
                  standard: data.standard,
                  tagType: data.tagType,
                  memorySize: data.memorySize,
                  usablePages: data.usablePages,
                  protection: data.protection,
                  ndef: data.ndef
                });
                // Clear last tag after 2 seconds
                setTimeout(() => { lastTagUidRef.current = null; }, 2000);
              }
            } else if (data.type === 'tag_removed') {
              setSuccess('Tag removed from reader');
            } else if (data.type === 'auth_result') {
              if (data.success) {
                setIsAuthenticated(true);
                setPendingUnlock(false);
                setSuccess('🔓 Tag unlocked successfully! You can now edit and reprogram it.');
                setError('');
                // Update scanned tag to show it's now writable
                setScannedTag(prev => prev ? {
                  ...prev,
                  protection: {
                    ...prev.protection,
                    isWritable: true,
                    unlocked: true
                  }
                } : null);
              } else {
                setIsAuthenticated(false);
                setPendingUnlock(false);
                // Show password bytes tried for debugging
                const bytesInfo = data.passwordBytes ? ` Tried bytes: ${data.passwordBytes}` : '';
                setError(`Authentication failed: ${data.error || 'Invalid password'}.${bytesInfo} Remove tag and try again.`);
              }
            } else if (data.type === 'reader_connected') {
              setDeviceInfo(prev => ({ ...prev, reader: data.reader }));
              setSuccess(`Reader detected: ${data.reader}`);
            } else if (data.type === 'reader_disconnected') {
              setError(`Reader disconnected: ${data.reader}`);
            } else if (data.type === 'write_result') {
              if (data.success) {
                setSuccess('✅ Tag programmed successfully!');
                setError('');
                // Handle post-write actions
                if (pendingWriteRef.current) {
                  const writeData = pendingWriteRef.current;
                  pendingWriteRef.current = null;
                  
                  const programmedTag = {
                    ...writeData.tagData,
                    serialNumber: data.uid,
                    programmedAt: new Date().toISOString(),
                  };
                  
                  setProgrammedTags(prev => [...prev, programmedTag]);
                  
                  if (onTagProgrammed) {
                    onTagProgrammed(programmedTag);
                  }
                  
                  // If in bulk mode, advance to next tag
                  if (mode === 'bulk') {
                    setCurrentIndex(prev => prev + 1);
                  } else {
                    // Single mode - reset form
                    setSingleTagForm({ tagId: '', name: '', destinationUrl: '', description: '' });
                    setScannedTag(null);
                    setScanMode('read');
                  }
                }
                setIsProgramming(false);
              } else {
                setError(`Write failed: ${data.error || 'Unknown error'}`);
                setIsProgramming(false);
                pendingWriteRef.current = null;
              }
            } else if (data.type === 'status') {
              setSuccess(data.message || 'Reader status updated');
            } else if (data.type === 'error') {
              setError(data.message || 'Reader error');
            }
          } catch (e) {
            console.log('Invalid WebSocket message:', e);
          }
        };
        
        ws.onerror = () => {
          reject(new Error('Could not connect to ACR122U helper service'));
        };
        
        ws.onclose = () => {
          wsRef.current = null;
          if (isConnected && connectionMode === 'websocket') {
            setError('Connection to helper service lost');
            setIsConnected(false);
            setConnectionStatus('disconnected');
          }
        };
        
        // Timeout after 3 seconds
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close();
            reject(new Error('Connection timeout - helper service not responding'));
          }
        }, 3000);
        
      } catch (err) {
        reject(err);
      }
    });
  };

  // Connect reader
  const connectReader = async () => {
    try {
      setConnectionStatus('connecting');
      setError('');
      
      if (connectionMode === 'websocket') {
        // Try WebSocket connection to local helper
        try {
          await connectViaWebSocket();
          setIsConnected(true);
          setConnectionStatus('connected');
          setSuccess('Connected to ACR122U via helper service! Tags will be detected automatically.');
          return;
        } catch (wsErr) {
          throw new Error(`${wsErr.message}. Make sure the ACR122U helper service is running.`);
        }
      }
      
      // Manual mode - just mark as connected
      setIsConnected(true);
      setConnectionStatus('connected');
      setConnectionMode('manual');
      setDeviceInfo({ name: 'Manual Entry Mode', mode: 'manual' });
      setSuccess('Manual mode active. Use your ACR122U software to read tag UIDs, then enter them below.');
      
    } catch (err) {
      setConnectionStatus('error');
      setError(err.message || 'Failed to connect');
      setIsConnected(false);
    }
  };

  // Disconnect reader
  const disconnectReader = async () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
    setIsProgramming(false);
    setDeviceInfo(null);
    setSuccess('Disconnected');
  };

  // Handle tag detected (from WebSocket or manual input)
  const handleTagDetected = useCallback(async (tagUid, tagMeta = {}) => {
    try {
      const serialNumber = tagUid || `TAG-${Date.now()}`;
      
      // Check if we're waiting to unlock a password-protected tag
      if (pendingUnlockRef.current && authPasswordRef.current) {
        // Send authentication request to helper service
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          setSuccess('🔐 Authenticating with password...');
          wsRef.current.send(JSON.stringify({
            type: 'authenticate',
            password: authPasswordRef.current
          }));
        } else {
          setError('Not connected to helper service');
          setPendingUnlock(false);
        }
        return; // Wait for auth_result
      }
      
      // If in bulk mode with CSV data and programming is active
      // Use refs to get latest state values
      const currentMode = modeRef.current;
      const currentScanMode = scanModeRef.current;
      const currentIsProgramming = isProgrammingRef.current;
      const currentForm = singleTagFormRef.current;
      
      console.log('Tag detected - Mode:', currentMode, 'ScanMode:', currentScanMode, 'IsProgramming:', currentIsProgramming);
      
      if (currentMode === 'bulk' && csvData.length > 0 && currentIsProgramming) {
        if (currentIndex >= csvData.length) {
          setSuccess('All tags have been programmed!');
          setIsProgramming(false);
          return;
        }
        
        const tagData = csvData[currentIndex];
        const url = tagData.destinationUrl || `${window.location.origin}/scan/${tagData.tagId}`;
        
        // Send write command via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          pendingWriteRef.current = { tagData, index: currentIndex + 1 };
          wsRef.current.send(JSON.stringify({
            type: 'write',
            url: url,
            text: tagData.name || null,
            password: newPasswordRef.current || null
          }));
          setSuccess(`Programming tag ${currentIndex + 1}/${csvData.length}...`);
        } else {
          setError('Not connected to helper service');
          setIsProgramming(false);
        }
        return; // Wait for write_result
        
      } else if (currentMode === 'single' && currentScanMode === 'write' && currentForm.tagId && currentIsProgramming) {
        // Single mode WRITE - program with form data
        console.log('Writing to tag with form data:', currentForm);
        const url = currentForm.destinationUrl || `${window.location.origin}/scan/${currentForm.tagId}`;
        
        // Send write command via WebSocket
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          pendingWriteRef.current = { tagData: currentForm };
          wsRef.current.send(JSON.stringify({
            type: 'write',
            url: url,
            text: currentForm.name || null,
            password: newPasswordRef.current || null
          }));
          setSuccess('Programming tag...');
        } else {
          setError('Not connected to helper service');
          setIsProgramming(false);
        }
        return; // Wait for write_result
        
      } else {
        // READ mode - just capture the tag UID and show it
        const protection = tagMeta.protection || {};
        const ndef = tagMeta.ndef || {};
        
        setScannedTag({
          uid: serialNumber,
          atr: tagMeta.atr || null,
          standard: tagMeta.standard || null,
          tagType: tagMeta.tagType || null,
          memorySize: tagMeta.memorySize || null,
          protection: {
            passwordProtected: protection.passwordProtected || false,
            writeProtected: protection.writeProtected || false,
            isWritable: protection.isWritable !== false // Default to true if unknown
          },
          ndef: {
            hasData: ndef.hasData || false,
            records: ndef.records || [],
            rawHex: ndef.rawHex || null
          },
          scannedAt: new Date().toISOString(),
        });
        
        // Auto-populate form from existing NDEF data if available
        if (ndef.hasData && ndef.records && ndef.records.length > 0) {
          const existingData = {};
          ndef.records.forEach(rec => {
            if (rec.url) existingData.destinationUrl = rec.url;
            if (rec.payloadText) existingData.name = rec.payloadText;
          });
          
          setSingleTagForm(prev => ({
            ...prev,
            tagId: serialNumber,
            ...existingData
          }));
          
          if (protection.isWritable === false) {
            if (protection.passwordProtected) {
              setError('Tag is password protected. Cannot rewrite without authentication.');
            } else {
              setError('Tag is write-protected. Cannot modify data.');
            }
          } else {
            setSuccess(`Tag has existing data. You can edit and rewrite if needed.`);
          }
        } else {
          // Auto-populate tag ID with UID if empty
          if (!currentForm.tagId) {
            setSingleTagForm(prev => ({
              ...prev,
              tagId: serialNumber,
            }));
          }
          setSuccess(`Tag detected! UID: ${serialNumber}. Tag is empty - fill in the details below.`);
        }
        
        setScanMode('read');
        setIsProgramming(false);
      }
      
    } catch (err) {
      setError(`Failed to process tag: ${err.message}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [csvData, currentIndex]);

  // Manual tag simulation
  const handleManualTagInput = () => {
    if (!manualTagUid.trim()) {
      setError('Please enter a tag UID');
      return;
    }
    handleTagDetected(manualTagUid.trim());
    setManualTagUid('');
  };

  // Simulate a tag scan (for testing without actual hardware)
  const simulateTagScan = () => {
    const fakeUid = `SIM-${Date.now().toString(16).toUpperCase()}`;
    handleTagDetected(fakeUid);
  };

  // Handle CSV file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setError('');
    setSuccess('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csv = event.target.result;
        const lines = csv.split('\n');
        const tags = [];
        
        // Skip header row
        let startRow = 0;
        const header = lines[0].toLowerCase();
        if (header.includes('tag') || header.includes('name') || header.includes('id')) {
          startRow = 1;
        }
        
        for (let i = startRow; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const columns = line.split(',').map(col => col.trim().replace(/^["']|["']$/g, ''));
          if (columns.length < 2) continue;
          
          tags.push({
            tagId: columns[0] || `TAG-${i}`,
            name: columns[1] || '',
            destinationUrl: columns[2] || `${window.location.origin}/scan/${columns[0]}`,
            description: columns[3] || '',
            email: columns[4] || '',
            phone: columns[5] || '',
          });
        }
        
        if (tags.length === 0) {
          throw new Error('No valid tag data found in CSV');
        }
        
        setCsvData(tags);
        setCurrentIndex(0);
        setProgrammedTags([]);
        setSuccess(`Loaded ${tags.length} tags from CSV. Connect reader and start programming.`);
        
      } catch (err) {
        setError(err.message || 'Error parsing CSV file');
      }
    };
    
    reader.onerror = () => {
      setError('Error reading file');
    };
    
    reader.readAsText(file);
    e.target.value = '';
  };

  // Start bulk programming
  const startBulkProgramming = () => {
    if (!isConnected) {
      setError('Please connect the ACR122U reader first');
      return;
    }
    if (csvData.length === 0) {
      setError('Please upload a CSV file first');
      return;
    }
    
    setIsProgramming(true);
    setError('');
    setSuccess('Programming mode active. Place a tag on the ACR122U reader...');
  };

  // Start single tag programming (write mode)
  const startSingleProgramming = () => {
    console.log('startSingleProgramming called', { isConnected, singleTagForm, mode });
    
    if (!isConnected) {
      setError('Please connect the ACR122U reader first');
      return;
    }
    if (!singleTagForm.tagId || !singleTagForm.name) {
      setError('Please fill in Tag ID and Name');
      return;
    }
    
    // Check if scanned tag is protected
    if (scannedTag && scannedTag.protection) {
      // Allow if authenticated/unlocked
      if (isAuthenticated || scannedTag.protection.unlocked) {
        // Tag is unlocked, proceed with programming
      } else if (scannedTag.protection.passwordProtected) {
        setError('Cannot program: Tag is password protected. Please unlock it first using the password.');
        return;
      } else if (scannedTag.protection.writeProtected) {
        setError('Cannot program: Tag is write-protected. Please use a different tag.');
        return;
      }
    }
    
    console.log('Setting programming mode: scanMode=write, isProgramming=true');
    setScanMode('write');
    setIsProgramming(true);
    setError('');
    setSuccess('Ready to program. Scan the tag again to write the new details...');
  };

  // Clear scanned tag and reset form
  const clearScannedTag = () => {
    setScannedTag(null);
    setSingleTagForm({ tagId: '', name: '', destinationUrl: '', description: '' });
    setScanMode('read');
    setSuccess('');
    setIsAuthenticated(false);
    setAuthPassword('');
    setPendingUnlock(false);
    setNewPassword('');
  };

  // Authenticate password-protected tag - sets up for scan
  const authenticateTag = () => {
    if (!authPassword.trim()) {
      setError('Please enter the tag password');
      return;
    }
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to helper service. Please use WebSocket mode.');
      return;
    }
    
    // Set pending unlock - authentication will happen on next scan
    setPendingUnlock(true);
    setError('');
    setSuccess('🔐 Password saved. Now remove the tag and scan it again to unlock.');
  };

  // Cancel unlock mode
  const cancelUnlock = () => {
    setPendingUnlock(false);
    setAuthPassword('');
    setSuccess('');
  };

  // Stop programming
  const stopProgramming = () => {
    setIsProgramming(false);
    setSuccess('Programming stopped');
  };

  // Download CSV template
  const downloadTemplate = () => {
    const template = 'Tag ID,Name,Destination URL,Description,Email,Phone\nTAG-001,John Doe,https://example.com/scan/TAG-001,VIP Guest,john@example.com,555-0001\nTAG-002,Jane Smith,https://example.com/scan/TAG-002,Speaker,jane@example.com,555-0002';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tag_programming_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Clear programmed tags history
  const clearHistory = () => {
    setProgrammedTags([]);
    setSuccess('History cleared');
  };

  // Reset bulk programming
  const resetBulkProgramming = () => {
    setCsvData([]);
    setCurrentIndex(0);
    setProgrammedTags([]);
    setIsProgramming(false);
    setSuccess('');
  };

  return (
    <div className="acr122u-programmer">
      <div className="programmer-header">
        <h2>🔧 ACR122U Tag Programmer</h2>
        <p className="subtitle">Program NFC tags in bulk or individually using ACR122U reader</p>
      </div>

      {/* Connection Status */}
      <div className={`connection-panel ${connectionStatus}`}>
        <div className="connection-info">
          <div className={`status-indicator ${connectionStatus}`}></div>
          <div className="connection-text">
            <strong>ACR122U Status:</strong>
            <span className="status-label">
              {connectionStatus === 'connected' && `✅ Connected ${deviceInfo ? `(${deviceInfo.mode === 'websocket' ? 'Auto' : 'Manual'})` : ''}`}
              {connectionStatus === 'connecting' && '🔄 Connecting...'}
              {connectionStatus === 'disconnected' && '⭕ Disconnected'}
              {connectionStatus === 'error' && '❌ Connection Error'}
            </span>
            {deviceInfo && isConnected && (
              <span className="device-name">{deviceInfo.name}</span>
            )}
          </div>
        </div>
        <div className="connection-actions">
          {!isConnected ? (
            <>
              <select 
                value={connectionMode} 
                onChange={(e) => setConnectionMode(e.target.value)}
                className="connection-mode-select"
              >
                <option value="manual">Manual Entry</option>
                <option value="websocket">Auto (Helper Service)</option>
              </select>
              <button 
                onClick={connectReader} 
                className="btn btn-primary"
                disabled={connectionStatus === 'connecting'}
              >
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect'}
              </button>
            </>
          ) : (
            <button onClick={disconnectReader} className="btn btn-outline">
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Manual Tag Input (shown when connected in manual mode or when programming) */}
      {isConnected && (connectionMode === 'manual' || isProgramming) && (
        <div className="manual-input-section">
          <div className="manual-input-row">
            <input
              type="text"
              value={manualTagUid}
              onChange={(e) => setManualTagUid(e.target.value)}
              placeholder="Enter tag UID (e.g., 04:A1:2B:3C:4D:5E:6F)"
              className="manual-uid-input"
              onKeyPress={(e) => e.key === 'Enter' && isProgramming && handleManualTagInput()}
            />
            <button 
              onClick={handleManualTagInput}
              className="btn btn-secondary"
              disabled={!isProgramming}
            >
              Submit Tag
            </button>
            <button 
              onClick={simulateTagScan}
              className="btn btn-outline"
              disabled={!isProgramming}
            >
              🎲 Simulate Scan
            </button>
          </div>
          <p className="manual-hint">
            {isProgramming 
              ? 'Enter tag UID manually or click "Simulate Scan" to test' 
              : 'Start programming first, then enter tag UIDs'}
          </p>
        </div>
      )}

      {/* Mode Selector */}
      <div className="mode-selector">
        <button 
          className={`mode-btn ${mode === 'bulk' ? 'active' : ''}`}
          onClick={() => { setMode('bulk'); setIsProgramming(false); }}
        >
          📋 Bulk Programming
        </button>
        <button 
          className={`mode-btn ${mode === 'single' ? 'active' : ''}`}
          onClick={() => { setMode('single'); setIsProgramming(false); }}
        >
          🏷️ Single Tag
        </button>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError('')} className="close-btn">×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="close-btn">×</button>
        </div>
      )}

      {/* Bulk Programming Mode */}
      {mode === 'bulk' && (
        <div className="bulk-programming-section">
          <div className="section-header">
            <h3>📋 Bulk Tag Programming</h3>
            <button onClick={downloadTemplate} className="btn btn-outline btn-small">
              📥 Download CSV Template
            </button>
          </div>

          {/* CSV Upload */}
          <div className="csv-upload-area">
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileUpload}
              className="file-input"
            />
            <label htmlFor="csv-upload" className="file-label">
              <span className="upload-icon">📁</span>
              <span className="upload-text">
                {csvData.length > 0 
                  ? `✅ ${csvData.length} tags loaded` 
                  : 'Click to upload CSV file'}
              </span>
              <span className="upload-hint">CSV format: Tag ID, Name, URL, Description</span>
            </label>
          </div>

          {/* Scanned Tag without CSV - suggest single mode */}
          {csvData.length === 0 && scannedTag && (
            <div className="scanned-tag-notice">
              <div className="notice-icon">📡</div>
              <div className="notice-content">
                <strong>Tag Detected: {scannedTag.uid}</strong>
                <p>To program this tag, switch to Single Tag mode and fill in the details.</p>
                <button 
                  onClick={() => { setMode('single'); }}
                  className="btn btn-primary btn-small"
                >
                  Switch to Single Tag Mode →
                </button>
              </div>
            </div>
          )}

          {/* Programming Progress */}
          {csvData.length > 0 && (
            <div className="programming-progress">
              <div className="progress-header">
                <span>Progress: {currentIndex} / {csvData.length} tags programmed</span>
                <span className="percentage">{Math.round((currentIndex / csvData.length) * 100)}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(currentIndex / csvData.length) * 100}%` }}
                ></div>
              </div>
              
              {/* Next tag to program */}
              {currentIndex < csvData.length && (
                <div className="next-tag-info">
                  <strong>Next tag to program:</strong>
                  <div className="next-tag-details">
                    <span className="tag-id">{csvData[currentIndex]?.tagId}</span>
                    <span className="tag-name">{csvData[currentIndex]?.name}</span>
                  </div>
                </div>
              )}

              <div className="programming-actions">
                {!isProgramming ? (
                  <>
                    <button 
                      onClick={startBulkProgramming} 
                      className="btn btn-primary btn-large"
                      disabled={!isConnected || currentIndex >= csvData.length}
                    >
                      ▶️ Start Programming
                    </button>
                    <button onClick={resetBulkProgramming} className="btn btn-outline">
                      🔄 Reset
                    </button>
                  </>
                ) : (
                  <button onClick={stopProgramming} className="btn btn-danger btn-large">
                    ⏹️ Stop Programming
                  </button>
                )}
              </div>
              
              {isProgramming && (
                <div className="programming-indicator">
                  <div className="pulse-animation"></div>
                  <span>Waiting for tag... Place tag on ACR122U reader</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Single Tag Mode */}
      {mode === 'single' && (
        <div className="single-programming-section">
          <div className="section-header">
            <h3>🏷️ Single Tag Programming</h3>
            <p className="section-subtitle">Scan a tag to read it, fill in details, then scan again to program</p>
          </div>

          {/* Scanned Tag Info */}
          {scannedTag && (
            <div className={`scanned-tag-info ${scannedTag.protection?.isWritable === false ? 'protected' : ''}`}>
              <div className="scanned-tag-header">
                <span className="scan-icon">📡</span>
                <div className="scan-details">
                  <strong>Tag Detected</strong>
                  <span className="tag-uid">{scannedTag.uid}</span>
                  {scannedTag.tagType && scannedTag.tagType !== 'Unknown' && (
                    <span className="tag-type">{scannedTag.tagType}</span>
                  )}
                  {scannedTag.memorySize && (
                    <span className="tag-memory">{scannedTag.memorySize} bytes</span>
                  )}
                </div>
                <button onClick={clearScannedTag} className="btn btn-outline btn-small">
                  ✕ Clear
                </button>
              </div>
              
              {/* Protection Status */}
              <div className="tag-protection-status">
                {scannedTag.protection?.unlocked ? (
                  <span className="protection-badge unlocked">🔓 Unlocked</span>
                ) : scannedTag.protection?.passwordProtected ? (
                  <span className="protection-badge password">🔐 Password Protected</span>
                ) : scannedTag.protection?.writeProtected ? (
                  <span className="protection-badge locked">🔒 Write Protected</span>
                ) : (
                  <span className="protection-badge writable">✅ Writable</span>
                )}
              </div>
              
              {/* Password Authentication for protected tags */}
              {scannedTag.protection?.passwordProtected && !isAuthenticated && !pendingUnlock && (
                <div className="password-auth-section">
                  <h4>🔑 Enter Password to Unlock</h4>
                  <p className="auth-hint">This tag requires a password to reprogram. Enter the password that was set on the tag.</p>
                  <div className="auth-password-tips">
                    <details>
                      <summary>Password Format Tips</summary>
                      <ul>
                        <li><strong>NFC Tools app:</strong> If your password was 4 characters or less, enter it exactly. For longer passwords, try the first 4 characters.</li>
                        <li><strong>Hex format:</strong> If you know the 4-byte hex password, enter 8 hex digits (e.g., FFFFFFFF)</li>
                        <li><strong>Factory default:</strong> Try "FFFFFFFF" if password was never changed</li>
                      </ul>
                    </details>
                  </div>
                  <div className="auth-input-group">
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Enter tag password"
                      className="auth-password-input"
                    />
                    <button
                      onClick={authenticateTag}
                      className="btn btn-primary"
                      disabled={!authPassword.trim()}
                    >
                      🔓 Scan to Unlock
                    </button>
                  </div>
                  <p className="auth-warning">⚠️ Warning: Multiple failed attempts may permanently lock the tag.</p>
                </div>
              )}
              
              {/* Pending unlock - waiting for scan */}
              {pendingUnlock && (
                <div className="pending-unlock-section">
                  <div className="unlock-waiting">
                    <div className="pulse-animation"></div>
                    <span>🔐 Remove the tag and scan it again to unlock</span>
                  </div>
                  <button onClick={cancelUnlock} className="btn btn-outline btn-small">
                    ✕ Cancel
                  </button>
                </div>
              )}
              
              {/* Success message for unlocked tag */}
              {isAuthenticated && (
                <div className="auth-success-notice">
                  <span>✅ Tag unlocked successfully! You can now edit and reprogram it.</span>
                </div>
              )}
              
              {/* Existing NDEF Data */}
              {scannedTag.ndef?.hasData && scannedTag.ndef.records.length > 0 && (
                <div className="existing-ndef-data">
                  <h4>📋 Existing Data on Tag</h4>
                  <div className="ndef-records">
                    {scannedTag.ndef.records.map((record, idx) => (
                      <div key={idx} className="ndef-record">
                        <span className="record-type">
                          {record.recordType === 'uri' && '🔗 URL'}
                          {record.recordType === 'text' && '📝 Text'}
                          {record.recordType === 'mime' && '📄 Data'}
                          {!['uri', 'text', 'mime'].includes(record.recordType) && `📦 ${record.type}`}
                        </span>
                        {record.url && (
                          <a href={record.url} target="_blank" rel="noopener noreferrer" className="record-value url">
                            {record.url}
                          </a>
                        )}
                        {record.payloadText && (
                          <span className="record-value text">{record.payloadText}</span>
                        )}
                        {record.language && (
                          <span className="record-lang">({record.language})</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {scannedTag.protection?.isWritable !== false && (
                    <p className="rewrite-hint">💡 You can edit the details below and scan again to rewrite the tag.</p>
                  )}
                </div>
              )}
              
              {/* Empty tag notice */}
              {!scannedTag.ndef?.hasData && (
                <div className="empty-tag-notice">
                  <span>📭 Tag is empty - no existing data found</span>
                </div>
              )}
              
              <span className="scan-time">Scanned at {new Date(scannedTag.scannedAt).toLocaleTimeString()}</span>
            </div>
          )}

          {/* Scan prompt when no tag scanned yet */}
          {!scannedTag && !isProgramming && (
            <div className="scan-prompt">
              <div className="scan-prompt-icon">📱</div>
              <p>Scan a tag to get started</p>
              <p className="scan-hint">Place a tag on the ACR122U reader to read its UID</p>
            </div>
          )}

          <form className="single-tag-form" onSubmit={(e) => { e.preventDefault(); startSingleProgramming(); }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="single-tagId">Tag ID *</label>
                <input
                  type="text"
                  id="single-tagId"
                  value={singleTagForm.tagId}
                  onChange={(e) => setSingleTagForm({ ...singleTagForm, tagId: e.target.value })}
                  placeholder={scannedTag ? scannedTag.uid : "Scan a tag or enter ID"}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="single-name">Name *</label>
                <input
                  type="text"
                  id="single-name"
                  value={singleTagForm.name}
                  onChange={(e) => setSingleTagForm({ ...singleTagForm, name: e.target.value })}
                  placeholder="e.g., John Doe"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="single-url">Destination URL</label>
              <input
                type="url"
                id="single-url"
                value={singleTagForm.destinationUrl}
                onChange={(e) => setSingleTagForm({ ...singleTagForm, destinationUrl: e.target.value })}
                placeholder="https://example.com/scan/TAG-001 (auto-generated if empty)"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="single-description">Description</label>
              <input
                type="text"
                id="single-description"
                value={singleTagForm.description}
                onChange={(e) => setSingleTagForm({ ...singleTagForm, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            
            <div className="form-group password-field">
              <label htmlFor="new-password">
                🔐 Set Password (Optional)
                <span className="field-hint">Protect the tag with a password after programming</span>
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave empty for no password protection"
              />
              {newPassword && (
                <p className="password-note">⚠️ Remember this password! You'll need it to reprogram the tag later.</p>
              )}
            </div>

            <div className="programming-actions">
              {!isProgramming ? (
                <button 
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={!isConnected || !singleTagForm.tagId || !singleTagForm.name}
                >
                  🏷️ {scannedTag ? 'Program This Tag' : 'Program Tag'}
                </button>
              ) : (
                <button type="button" onClick={stopProgramming} className="btn btn-danger btn-large">
                  ⏹️ Cancel
                </button>
              )}
            </div>
            
            {isProgramming && scanMode === 'write' && (
              <div className="programming-indicator write-mode">
                <div className="pulse-animation"></div>
                <span>Ready to write! Scan the tag again to save the new details...</span>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Programmed Tags History */}
      {programmedTags.length > 0 && (
        <div className="programmed-tags-section">
          <div className="section-header">
            <h3>✅ Programmed Tags ({programmedTags.length})</h3>
            <button onClick={clearHistory} className="btn btn-outline btn-small">
              🗑️ Clear History
            </button>
          </div>
          
          <div className="programmed-tags-list">
            {programmedTags.map((tag, index) => (
              <div key={`${tag.tagId}-${index}`} className="programmed-tag-item">
                <div className="tag-number">#{tag.index || index + 1}</div>
                <div className="tag-details">
                  <div className="tag-main">
                    <span className="tag-id">{tag.tagId}</span>
                    <span className="tag-name">{tag.name}</span>
                  </div>
                  <div className="tag-meta">
                    <span className="serial">Serial: {tag.serialNumber?.substring(0, 12)}...</span>
                    <span className="time">
                      {new Date(tag.programmedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                <div className="tag-status">✅</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="instructions-panel">
        <h4>📖 How to Use ACR122U Tag Programmer</h4>
        
        <div className="instruction-section">
          <h5>🔌 Setup (Manual Entry Mode)</h5>
          <ol>
            <li>Connect your ACR122U to your computer via USB</li>
            <li>Open <strong>NFC Tools</strong>, <strong>ACR122U Tool</strong>, or similar software</li>
            <li>Select "Manual Entry" mode and click "Connect"</li>
            <li>When you scan a tag with your ACR122U software, copy the UID and paste it here</li>
          </ol>
        </div>

        <div className="instruction-section">
          <h5>📋 Bulk Programming Workflow</h5>
          <ol>
            <li>Upload a CSV file with tag data (Tag ID, Name, URL, Description)</li>
            <li>Click "Start Programming" - you'll see the next tag to program</li>
            <li>Place a blank NFC tag on the ACR122U reader</li>
            <li>Copy the tag's UID from your reader software and paste it in the input field</li>
            <li>Press Enter or click "Submit Tag" - the tag is now associated with the CSV data</li>
            <li>Repeat for each tag - the system tracks progress automatically</li>
          </ol>
        </div>

        <div className="instruction-section">
          <h5>🏷️ Single Tag Programming</h5>
          <ol>
            <li>Switch to "Single Tag" mode</li>
            <li>Enter the Tag ID, Name, and optional details</li>
            <li>Click "Program Tag"</li>
            <li>Scan the tag with ACR122U software and enter the UID</li>
          </ol>
        </div>

        <div className="instruction-section">
          <h5>💡 Tips</h5>
          <ul>
            <li>Use "Simulate Scan" button to test the workflow without hardware</li>
            <li>Tag UIDs are typically in format: <code>04:A1:2B:3C:4D:5E:6F</code></li>
            <li>The programmed tags list shows all successfully processed tags</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ACR122UProgrammer;
