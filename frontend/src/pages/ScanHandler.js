import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import scanService from '../services/scanService';
import tagService from '../services/tagService';
import './ScanHandler.css';

/**
 * Scan Handler Page
 * This page handles NFC tag scans and redirects users
 */
const ScanHandler = () => {
  const { tagId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagId]);

  const handleScan = async () => {
    try {
      // Get tag information
      const tagData = await tagService.getTagByTagId(tagId);
      
      if (tagData.success) {
        // Log the scan
        await scanService.logScan(tagId);
        
        // Redirect to destination URL
        window.location.href = tagData.data.destinationUrl;
      } else {
        setError('Tag not found or inactive');
        setLoading(false);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to process scan. Tag may not exist or be inactive.'
      );
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="scan-handler-page">
        <div className="container">
          <div className="scan-loading">
            <div className="spinner"></div>
            <h2>Processing scan...</h2>
            <p>Please wait while we redirect you</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scan-handler-page">
        <div className="container">
          <div className="scan-error">
            <h2>❌ Scan Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="btn btn-primary">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ScanHandler;
