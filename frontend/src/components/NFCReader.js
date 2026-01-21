import React, { useState, useEffect } from 'react';
import './NFCReader.css';

const NFCReader = ({ onTagScanned, isActive = false }) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [scannedTags, setScannedTags] = useState([]);

  useEffect(() => {
    // Check if Web NFC API is supported
    if ('NDEFReader' in window) {
      setIsSupported(true);
    } else {
      setError('NFC is not supported on this device. Please use a compatible browser (Chrome 62+, Android).');
    }
  }, []);

  useEffect(() => {
    if (isActive && isSupported) {
      startReading();
    } else {
      stopReading();
    }

    return () => {
      stopReading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, isSupported]);

  const startReading = async () => {
    try {
      setError('');
      setSuccessMessage('');
      setIsReading(true);

      const ndef = new window.NDEFReader();

      // Set up the scan listener
      ndef.onreading = (event) => {
        handleNDEFMessage(event.message);
      };

      ndef.onerror = () => {
        setError('Unable to read NFC tag. Please try again.');
        setIsReading(false);
      };

      // Start scanning
      await ndef.scan();
      setSuccessMessage('NFC Reader Active - Hold a tag near the device...');
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('NFC permission denied. Check browser settings.');
      } else if (err.name === 'NotSupportedError') {
        setError('NFC is not supported on this device.');
      } else {
        setError(err.message || 'Error starting NFC reader');
      }
      setIsReading(false);
    }
  };

  const stopReading = () => {
    setIsReading(false);
  };

  const handleNDEFMessage = (message) => {
    try {
      let tagData = null;

      // Process NDEF records
      for (const record of message.records) {
        if (record.recordType === 'text') {
          // Try to parse as text/JSON
          const decoder = new TextDecoder();
          const text = decoder.decode(record.data);

          // Check if it looks like a tag ID
          if (text.includes('TAG-') || text.length <= 20) {
            tagData = {
              tagId: text.trim(),
              type: 'text',
            };
            break;
          }
        } else if (record.recordType === 'url') {
          // Extract tag ID from URL
          const decoder = new TextDecoder();
          const url = decoder.decode(record.data).slice(1); // Skip first byte (URL code)
          const match = url.match(/TAG-\d+/) || url.match(/tagId=([^&]+)/);
          if (match) {
            tagData = {
              tagId: match[1] || match[0],
              type: 'url',
            };
            break;
          }
        }
      }

      if (tagData) {
        // Add to scanned tags list
        const newScannedTag = {
          ...tagData,
          timestamp: new Date().toLocaleTimeString(),
          id: `${tagData.tagId}-${Date.now()}`,
        };

        setScannedTags((prev) => [newScannedTag, ...prev.slice(0, 9)]);
        setSuccessMessage(`Tag scanned: ${tagData.tagId}`);

        // Call the callback
        if (onTagScanned) {
          onTagScanned(tagData);
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('NFC Reader Active - Hold a tag near the device...');
        }, 3000);
      } else {
        setError('Could not read tag data');
      }
    } catch (err) {
      console.error('Error processing NFC tag:', err);
      setError('Error processing tag data');
    }
  };

  if (!isSupported) {
    return (
      <div className="nfc-reader-disabled">
        <div className="nfc-icon">📵</div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="nfc-reader-container">
      <div className={`nfc-reader ${isReading ? 'active' : 'inactive'}`}>
        <div className="nfc-icon-container">
          <div className={`nfc-icon ${isReading ? 'pulse' : ''}`}>📱</div>
        </div>

        <div className="nfc-status">
          {isReading ? (
            <>
              <h3>NFC Reader Active</h3>
              <p className="status-message success">{successMessage}</p>
            </>
          ) : (
            <>
              <h3>NFC Reader Inactive</h3>
              <p className="status-message">Enable NFC reading to scan tags</p>
            </>
          )}
        </div>

        {error && (
          <div className="nfc-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      {scannedTags.length > 0 && (
        <div className="scanned-tags-list">
          <h4>Recently Scanned Tags</h4>
          <div className="tags-history">
            {scannedTags.map((tag) => (
              <div key={tag.id} className="tag-history-item">
                <span className="tag-id">{tag.tagId}</span>
                <span className="tag-time">{tag.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NFCReader;
