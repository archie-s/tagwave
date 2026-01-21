import React, { useState, useEffect } from 'react';
import tagService from '../services/tagService';
import NFCReader from '../components/NFCReader';
import { parseExcelFile, validateAttendeeData, generateCSVTemplate } from '../utils/excelParser';
import './TagManagement.css';

const TagManagement = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [nfcReaderActive, setNfcReaderActive] = useState(false);
  const [scannedTag, setScannedTag] = useState(null);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [attendeeForm, setAttendeeForm] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [bulkAssignments, setBulkAssignments] = useState([]);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  
  const [formData, setFormData] = useState({
    tagId: '',
    name: '',
    description: '',
    destinationUrl: '',
    location: '',
    isActive: true,
  });

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterActive]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterActive !== 'all') {
        filters.isActive = filterActive === 'active';
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const data = await tagService.getAllTags(filters);
      setTags(data.data);
      setError('');
    } catch (err) {
      setError('Failed to load tags');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTags();
  };

  const openModal = (tag = null) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({
        tagId: tag.tagId,
        name: tag.name,
        description: tag.description || '',
        destinationUrl: tag.destinationUrl,
        location: tag.location || '',
        isActive: tag.isActive,
      });
    } else {
      setEditingTag(null);
      setFormData({
        tagId: '',
        name: '',
        description: '',
        destinationUrl: '',
        location: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTag(null);
  };

  const onChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTag) {
        await tagService.updateTag(editingTag._id, formData);
        setSuccess(`Tag "${formData.name}" updated successfully`);
      } else {
        await tagService.createTag(formData);
        setSuccess(`Tag "${formData.name}" created successfully`);
      }
      
      fetchTags();
      closeModal();
    } catch (err) {
      setError(
        err.response?.data?.message || 
        `Failed to ${editingTag ? 'update' : 'create'} tag`
      );
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      try {
        await tagService.deleteTag(id);
        setSuccess('Tag deleted successfully');
        fetchTags();
      } catch (err) {
        setError('Failed to delete tag');
      }
    }
  };

  const handleToggleActive = async (tag) => {
    try {
      await tagService.updateTag(tag._id, { isActive: !tag.isActive });
      setSuccess(`Tag "${tag.name}" ${!tag.isActive ? 'activated' : 'deactivated'}`);
      fetchTags();
    } catch (err) {
      setError('Failed to update tag status');
    }
  };

  // NFC Reader callback
  const handleTagScanned = async (scannedTagData) => {
    const tagId = scannedTagData.tagId;
    
    // Find the tag in the list
    const foundTag = tags.find(t => t.tagId === tagId);
    
    if (foundTag) {
      setScannedTag(foundTag);
      setAttendeeForm({ name: '', email: '', phone: '' });
      setShowAttendeeModal(true);
    } else {
      setError(`Tag "${tagId}" not found in the system. Please create it first.`);
    }
  };

  // Assign attendee to scanned tag
  const handleAssignAttendee = async (e) => {
    e.preventDefault();
    
    if (!attendeeForm.name.trim()) {
      setError('Please enter attendee name');
      return;
    }

    try {
      await tagService.assignAttendee(scannedTag._id, {
        name: attendeeForm.name,
        email: attendeeForm.email,
        phone: attendeeForm.phone,
      });

      setSuccess(`Attendee "${attendeeForm.name}" assigned to tag ${scannedTag.tagId}`);
      setShowAttendeeModal(false);
      setScannedTag(null);
      fetchTags();
    } catch (err) {
      setError('Failed to assign attendee to tag');
    }
  };

  // Handle Excel file upload
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setError('');
      const attendees = await parseExcelFile(file);
      const validationErrors = validateAttendeeData(attendees);

      if (validationErrors.length > 0) {
        setError(`Validation errors:\n${validationErrors.join('\n')}`);
        return;
      }

      setBulkAssignments(attendees);
      setShowBulkModal(true);
    } catch (err) {
      setError(err.message || 'Error parsing file');
    }
  };

  // Perform bulk assignment
  const handleBulkAssign = async () => {
    try {
      setError('');
      setBulkProgress({ current: 0, total: bulkAssignments.length });

      const response = await tagService.bulkAssignAttendees(
        bulkAssignments,
        `bulk-${Date.now()}`
      );

      if (response.success || response.data.successful > 0) {
        setSuccess(
          `Bulk assignment complete: ${response.data.successful} successful${
            response.data.failed > 0 ? `, ${response.data.failed} failed` : ''
          }`
        );

        if (response.data.errors && response.data.errors.length > 0) {
          const errorMsg = response.data.errors
            .map((e) => `Row ${e.index + 1}: ${e.message}`)
            .join('\n');
          setError(`Some assignments failed:\n${errorMsg}`);
        }
      }

      setBulkProgress({ current: 0, total: 0 });
      setShowBulkModal(false);
      setBulkAssignments([]);
      fetchTags();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform bulk assignment');
    }
  };

  // Assign attendee to specific tag from list
  const handleQuickAssign = (tag) => {
    setScannedTag(tag);
    setAttendeeForm({
      name: tag.assignedTo?.name || '',
      email: tag.assignedTo?.email || '',
      phone: tag.assignedTo?.phone || '',
    });
    setShowAttendeeModal(true);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="tag-management-page">
      <div className="container">
        <div className="page-header">
          <h1>NFC Tag Management</h1>
          <button onClick={() => openModal()} className="btn btn-primary">
            + Create New Tag
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
            <button onClick={() => setSuccess('')} className="close-btn">×</button>
          </div>
        )}

        {/* NFC Reader Section */}
        <div className="nfc-reader-section">
          <div className="section-header">
            <h2>NFC Reader & Attendance Tracking</h2>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={nfcReaderActive}
                onChange={(e) => setNfcReaderActive(e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <NFCReader
            onTagScanned={handleTagScanned}
            isActive={nfcReaderActive}
          />
        </div>

        {/* Bulk Upload Section */}
        <div className="bulk-upload-section">
          <div className="section-header">
            <h2>Bulk Attendee Assignment</h2>
          </div>
          
          <div className="bulk-upload-container">
            <div className="upload-instructions">
              <p>📋 Upload a CSV or Excel file to assign multiple attendees to NFC tags.</p>
              <p><strong>Required columns:</strong> Tag ID, Name</p>
              <p><strong>Optional columns:</strong> Email, Phone</p>
              <button
                onClick={() => generateCSVTemplate()}
                className="btn btn-outline btn-small"
              >
                📥 Download CSV Template
              </button>
            </div>

            <div className="file-upload-area">
              <input
                type="file"
                id="bulk-file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="file-input"
              />
              <label htmlFor="bulk-file" className="file-label">
                <span className="upload-icon">📁</span>
                <span className="upload-text">Click to upload or drag and drop</span>
                <span className="upload-hint">CSV or Excel files accepted</span>
              </label>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search by tag ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary">Search</button>
          </form>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filterActive === 'all' ? 'active' : ''}`}
              onClick={() => setFilterActive('all')}
            >
              All Tags
            </button>
            <button
              className={`filter-btn ${filterActive === 'active' ? 'active' : ''}`}
              onClick={() => setFilterActive('active')}
            >
              Active
            </button>
            <button
              className={`filter-btn ${filterActive === 'inactive' ? 'active' : ''}`}
              onClick={() => setFilterActive('inactive')}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Tags Table */}
        <div className="tags-table-container">
          {tags.length === 0 ? (
            <div className="empty-state">
              <p>No tags found. Create your first NFC tag to get started!</p>
            </div>
          ) : (
            <table className="tags-table">
              <thead>
                <tr>
                  <th>Tag ID</th>
                  <th>Name</th>
                  <th>Assigned To</th>
                  <th>Destination URL</th>
                  <th>Scans</th>
                  <th>Status</th>
                  <th>Last Scanned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag) => (
                  <tr key={tag._id} className={tag.assignedTo?.name ? 'has-attendee' : ''}>
                    <td className="tag-id">{tag.tagId}</td>
                    <td>
                      <strong>{tag.name}</strong>
                      {tag.location && (
                        <div className="tag-location">📍 {tag.location}</div>
                      )}
                    </td>
                    <td className="attendee-cell">
                      {tag.assignedTo?.name ? (
                        <div className="attendee-info">
                          <div className="attendee-name">👤 {tag.assignedTo.name}</div>
                          {tag.assignedTo.email && (
                            <div className="attendee-email">{tag.assignedTo.email}</div>
                          )}
                        </div>
                      ) : (
                        <span className="no-attendee">Not assigned</span>
                      )}
                    </td>
                    <td className="url-cell">
                      <a
                        href={tag.destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {tag.destinationUrl}
                      </a>
                    </td>
                    <td className="scans-cell">{tag.scanCount}</td>
                    <td>
                      <span className={`status-badge ${tag.isActive ? 'active' : 'inactive'}`}>
                        {tag.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {tag.lastScannedAt
                        ? new Date(tag.lastScannedAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="actions-cell">
                      <button
                        onClick={() => handleQuickAssign(tag)}
                        className="btn-icon"
                        title="Assign Attendee"
                      >
                        👤
                      </button>
                      <button
                        onClick={() => openModal(tag)}
                        className="btn-icon"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleToggleActive(tag)}
                        className="btn-icon"
                        title={tag.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {tag.isActive ? '⏸️' : '▶️'}
                      </button>
                      <button
                        onClick={() => handleDelete(tag._id)}
                        className="btn-icon danger"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create/Edit Tag Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingTag ? 'Edit Tag' : 'Create New Tag'}</h2>
                <button onClick={closeModal} className="close-btn">×</button>
              </div>

              <form onSubmit={onSubmit} className="tag-form">
                <div className="form-group">
                  <label htmlFor="tagId">Tag ID *</label>
                  <input
                    type="text"
                    id="tagId"
                    name="tagId"
                    value={formData.tagId}
                    onChange={onChange}
                    required
                    disabled={!!editingTag}
                    placeholder="e.g., TAG-001"
                  />
                  <small>Unique identifier for the NFC tag</small>
                </div>

                <div className="form-group">
                  <label htmlFor="name">Tag Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={onChange}
                    required
                    placeholder="e.g., Product Demo Tag"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={onChange}
                    rows="3"
                    placeholder="Optional description"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="destinationUrl">Destination URL *</label>
                  <input
                    type="url"
                    id="destinationUrl"
                    name="destinationUrl"
                    value={formData.destinationUrl}
                    onChange={onChange}
                    required
                    placeholder="https://example.com"
                  />
                  <small>Where users will be redirected when they scan</small>
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={onChange}
                    placeholder="e.g., Store Front - Main Entrance"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={onChange}
                    />
                    <span>Active (tag is enabled for scanning)</span>
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeModal} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingTag ? 'Update Tag' : 'Create Tag'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Attendee Assignment Modal */}
        {showAttendeeModal && scannedTag && (
          <div className="modal-overlay" onClick={() => setShowAttendeeModal(false)}>
            <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Assign Attendee to {scannedTag.tagId}</h2>
                <button onClick={() => setShowAttendeeModal(false)} className="close-btn">×</button>
              </div>

              <div className="modal-body">
                <p className="tag-info">
                  <strong>Tag:</strong> {scannedTag.name}
                </p>

                <form onSubmit={handleAssignAttendee} className="attendee-form">
                  <div className="form-group">
                    <label htmlFor="attendee-name">Attendee Name *</label>
                    <input
                      type="text"
                      id="attendee-name"
                      value={attendeeForm.name}
                      onChange={(e) => setAttendeeForm({ ...attendeeForm, name: e.target.value })}
                      required
                      placeholder="Enter attendee name"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="attendee-email">Email</label>
                    <input
                      type="email"
                      id="attendee-email"
                      value={attendeeForm.email}
                      onChange={(e) => setAttendeeForm({ ...attendeeForm, email: e.target.value })}
                      placeholder="Optional email address"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="attendee-phone">Phone</label>
                    <input
                      type="tel"
                      id="attendee-phone"
                      value={attendeeForm.phone}
                      onChange={(e) => setAttendeeForm({ ...attendeeForm, phone: e.target.value })}
                      placeholder="Optional phone number"
                    />
                  </div>

                  <div className="modal-actions">
                    <button
                      type="button"
                      onClick={() => setShowAttendeeModal(false)}
                      className="btn btn-outline"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Assign Attendee
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Assignment Confirmation Modal */}
        {showBulkModal && (
          <div className="modal-overlay" onClick={() => setShowBulkModal(false)}>
            <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirm Bulk Assignment</h2>
                <button onClick={() => setShowBulkModal(false)} className="close-btn">×</button>
              </div>

              <div className="modal-body">
                <p>
                  You are about to assign <strong>{bulkAssignments.length}</strong> attendees to NFC tags.
                </p>

                <div className="bulk-preview">
                  <h4>Preview (first 5):</h4>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Tag ID</th>
                        <th>Name</th>
                        <th>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkAssignments.slice(0, 5).map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.tagId}</td>
                          <td>{item.name}</td>
                          <td>{item.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkAssignments.length > 5 && (
                    <p className="more-items">
                      ...and {bulkAssignments.length - 5} more
                    </p>
                  )}
                </div>

                {bulkProgress.total > 0 && (
                  <div className="progress-bar">
                    <div className="progress" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}></div>
                    <span className="progress-text">
                      {bulkProgress.current} of {bulkProgress.total}
                    </span>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowBulkModal(false)}
                    className="btn btn-outline"
                    disabled={bulkProgress.total > 0}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkAssign}
                    className="btn btn-primary"
                    disabled={bulkProgress.total > 0}
                  >
                    Confirm & Assign
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagManagement;
