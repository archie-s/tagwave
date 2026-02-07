import React, { useState, useEffect } from 'react';
import eventService from '../services/eventService';
import tagService from '../services/tagService';
import NFCReader from '../components/NFCReader';
import { parseBulkTagFile, validateTagData, generateTagCSVTemplate, parseExcelFile, validateAttendeeData, generateCSVTemplate } from '../utils/excelParser';
import './TagManagement.css';

const TagManagement = () => {
  const [view, setView] = useState('events'); // 'events' or 'event-detail'
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [tags, setTags] = useState([]);
  const [eventStats, setEventStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Event form state
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    eventDate: '',
    location: '',
    eventType: 'other',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    expectedAttendees: '',
    status: 'upcoming',
    notes: '',
  });

  // Tag form state
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagForm, setTagForm] = useState({
    tagId: '',
    name: '',
    description: '',
    destinationUrl: '',
    location: '',
    isActive: true,
  });

  // Bulk tag upload state
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [bulkTags, setBulkTags] = useState([]);

  // Attendee assignment state
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [attendeeForm, setAttendeeForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  // NFC Reader state
  const [nfcReaderActive, setNfcReaderActive] = useState(false);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [filterStatus]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventTags();
      fetchEventStats();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const filters = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (searchTerm) filters.search = searchTerm;

      const data = await eventService.getAllEvents(filters);
      setEvents(data.data);
      setError('');
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTags = async () => {
    if (!selectedEvent) return;
    try {
      const data = await eventService.getEventTags(selectedEvent._id);
      setTags(data.data);
    } catch (err) {
      setError('Failed to load event tags');
      console.error(err);
    }
  };

  const fetchEventStats = async () => {
    if (!selectedEvent) return;
    try {
      const data = await eventService.getEventStats(selectedEvent._id);
      setEventStats(data.data);
    } catch (err) {
      console.error('Failed to load stats');
    }
  };

  // Event Management Functions
  const openEventModal = (event = null) => {
    if (event) {
      setEditingEvent(event);
      setEventForm({
        name: event.name,
        description: event.description || '',
        eventDate: event.eventDate ? event.eventDate.split('T')[0] : '',
        location: event.location || '',
        eventType: event.eventType || 'other',
        organizerName: event.organizerName || '',
        organizerEmail: event.organizerEmail || '',
        organizerPhone: event.organizerPhone || '',
        expectedAttendees: event.expectedAttendees || '',
        status: event.status || 'upcoming',
        notes: event.notes || '',
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        name: '',
        description: '',
        eventDate: '',
        location: '',
        eventType: 'other',
        organizerName: '',
        organizerEmail: '',
        organizerPhone: '',
        expectedAttendees: '',
        status: 'upcoming',
        notes: '',
      });
    }
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await eventService.updateEvent(editingEvent._id, eventForm);
        setSuccess('Event updated successfully');
        if (selectedEvent && selectedEvent._id === editingEvent._id) {
          setSelectedEvent({ ...editingEvent, ...eventForm });
        }
      } else {
        await eventService.createEvent(eventForm);
        setSuccess('Event created successfully');
      }
      fetchEvents();
      closeEventModal();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingEvent ? 'update' : 'create'} event`);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await eventService.deleteEvent(eventId);
        setSuccess('Event deleted successfully');
        if (selectedEvent && selectedEvent._id === eventId) {
          setView('events');
          setSelectedEvent(null);
        }
        fetchEvents();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete event');
      }
    }
  };

  const handleViewEvent = (event) => {
    setSelectedEvent(event);
    setView('event-detail');
    setSuccess('');
    setError('');
  };

  const handleBackToEvents = () => {
    setView('events');
    setSelectedEvent(null);
    setTags([]);
    setEventStats(null);
    setSuccess('');
    setError('');
  };

  // Tag Management Functions
  const openTagModal = (tag = null) => {
    if (tag) {
      setEditingTag(tag);
      setTagForm({
        tagId: tag.tagId,
        name: tag.name,
        description: tag.description || '',
        destinationUrl: tag.destinationUrl,
        location: tag.location || '',
        isActive: tag.isActive,
      });
    } else {
      setEditingTag(null);
      setTagForm({
        tagId: '',
        name: '',
        description: '',
        destinationUrl: '',
        location: '',
        isActive: true,
      });
    }
    setShowTagModal(true);
  };

  const closeTagModal = () => {
    setShowTagModal(false);
    setEditingTag(null);
  };

  const handleTagSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTag) {
        await tagService.updateTag(editingTag._id, tagForm);
        setSuccess('Tag updated successfully');
      } else {
        // Add event reference for new tags
        const tagData = { ...tagForm, event: selectedEvent._id };
        await tagService.createTag(tagData);
        setSuccess('Tag created successfully');
      }
      fetchEventTags();
      fetchEventStats();
      closeTagModal();
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${editingTag ? 'update' : 'create'} tag`);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (window.confirm('Are you sure you want to delete this tag?')) {
      try {
        await tagService.deleteTag(tagId);
        setSuccess('Tag deleted successfully');
        fetchEventTags();
        fetchEventStats();
      } catch (err) {
        setError('Failed to delete tag');
      }
    }
  };

  const handleToggleTagActive = async (tag) => {
    try {
      await tagService.updateTag(tag._id, { isActive: !tag.isActive });
      setSuccess(`Tag "${tag.name}" ${!tag.isActive ? 'activated' : 'deactivated'}`);
      fetchEventTags();
    } catch (err) {
      setError('Failed to update tag status');
    }
  };

  // Bulk Tag Upload Functions
  const handleBulkTagUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setError('');
      const tags = await parseBulkTagFile(file);
      const validationErrors = validateTagData(tags);

      if (validationErrors.length > 0) {
        setError(`Validation errors:\n${validationErrors.join('\n')}`);
        return;
      }

      setBulkTags(tags);
      setShowBulkTagModal(true);
    } catch (err) {
      setError(err.message || 'Error parsing file');
    }
    // Reset file input
    e.target.value = '';
  };

  const handleBulkTagCreate = async () => {
    try {
      setError('');
      const response = await eventService.bulkCreateTags(selectedEvent._id, bulkTags);

      if (response.success) {
        setSuccess(
          `Bulk upload complete: ${response.data.successful} successful${
            response.data.failed > 0 ? `, ${response.data.failed} failed` : ''
          }`
        );

        if (response.data.errors && response.data.errors.length > 0) {
          const errorMsg = response.data.errors
            .map((e) => `Row ${e.index + 1} (${e.tagId}): ${e.message}`)
            .join('\n');
          setError(`Some tags failed:\n${errorMsg}`);
        }
      }

      setShowBulkTagModal(false);
      setBulkTags([]);
      fetchEventTags();
      fetchEventStats();
      fetchEvents(); // Update event list with new tag counts
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform bulk upload');
    }
  };

  // Attendee Assignment Functions
  const openAttendeeModal = (tag) => {
    setSelectedTag(tag);
    setAttendeeForm({
      name: tag.assignedTo?.name || '',
      email: tag.assignedTo?.email || '',
      phone: tag.assignedTo?.phone || '',
    });
    setShowAttendeeModal(true);
  };

  const closeAttendeeModal = () => {
    setShowAttendeeModal(false);
    setSelectedTag(null);
  };

  const handleAssignAttendee = async (e) => {
    e.preventDefault();
    if (!attendeeForm.name.trim()) {
      setError('Please enter attendee name');
      return;
    }

    try {
      await tagService.assignAttendee(selectedTag._id, attendeeForm);
      setSuccess(`Attendee "${attendeeForm.name}" assigned to tag ${selectedTag.tagId}`);
      closeAttendeeModal();
      fetchEventTags();
      fetchEventStats();
    } catch (err) {
      setError('Failed to assign attendee');
    }
  };

  // NFC Reader Functions
  const handleTagScanned = async (scannedTagData) => {
    const tagId = scannedTagData.tagId;
    const foundTag = tags.find(t => t.tagId === tagId);
    
    if (foundTag) {
      openAttendeeModal(foundTag);
    } else {
      setError(`Tag "${tagId}" not found in this event. Make sure the tag belongs to "${selectedEvent?.name}".`);
    }
  };

  if (loading && view === 'events') {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="tag-management-page">
      <div className="container">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumb">
          <span 
            className={view === 'events' ? 'active' : 'link'}
            onClick={() => view !== 'events' && handleBackToEvents()}
          >
            Events
          </span>
          {view === 'event-detail' && selectedEvent && (
            <>
              <span className="separator">›</span>
              <span className="active">{selectedEvent.name}</span>
            </>
          )}
        </div>

        {error && (
          <div className="alert alert-error">
            <pre>{error}</pre>
            <button onClick={() => setError('')} className="close-btn">×</button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
            <button onClick={() => setSuccess('')} className="close-btn">×</button>
          </div>
        )}

        {/* Events List View */}
        {view === 'events' && (
          <div className="events-view">
            <div className="page-header">
              <h1>Event Management</h1>
              <button onClick={() => openEventModal()} className="btn btn-primary">
                + Create New Event
              </button>
            </div>

            {/* Event Filters */}
            <div className="filters-section">
              <div className="search-form">
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchEvents()}
                />
                <button onClick={fetchEvents} className="btn btn-secondary">Search</button>
              </div>

              <div className="filter-buttons">
                <button
                  className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All Events
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'upcoming' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('upcoming')}
                >
                  Upcoming
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'ongoing' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('ongoing')}
                >
                  Ongoing
                </button>
                <button
                  className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('completed')}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Events Grid */}
            <div className="events-grid">
              {events.length === 0 ? (
                <div className="empty-state">
                  <p>No events found. Create your first event to get started!</p>
                </div>
              ) : (
                events.map((event) => (
                  <div key={event._id} className="event-card">
                    <div className="event-header">
                      <h3>{event.name}</h3>
                      <span className={`status-badge ${event.status}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="event-body">
                      <p className="event-date">
                        📅 {new Date(event.eventDate).toLocaleDateString()}
                      </p>
                      {event.location && (
                        <p className="event-location">📍 {event.location}</p>
                      )}
                      {event.description && (
                        <p className="event-description">{event.description}</p>
                      )}
                      <div className="event-stats">
                        <span className="stat">
                          <strong>{event.tagCount || 0}</strong> Tags
                        </span>
                        <span className="stat">
                          <strong>{event.totalScans || 0}</strong> Scans
                        </span>
                      </div>
                    </div>
                    <div className="event-actions">
                      <button
                        onClick={() => handleViewEvent(event)}
                        className="btn btn-primary btn-small"
                      >
                        View Tags
                      </button>
                      <button
                        onClick={() => openEventModal(event)}
                        className="btn btn-outline btn-small"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="btn btn-outline btn-small danger"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Event Detail View with Tags */}
        {view === 'event-detail' && selectedEvent && (
          <div className="event-detail-view">
            <div className="page-header">
              <div>
                <button onClick={handleBackToEvents} className="btn btn-outline btn-small">
                  ← Back to Events
                </button>
                <h1>{selectedEvent.name}</h1>
                <p className="event-meta">
                  📅 {new Date(selectedEvent.eventDate).toLocaleDateString()}
                  {selectedEvent.location && ` • 📍 ${selectedEvent.location}`}
                </p>
              </div>
              <div className="action-buttons">
                <button onClick={() => openEventModal(selectedEvent)} className="btn btn-outline">
                  Edit Event
                </button>
                <button onClick={() => openTagModal()} className="btn btn-primary">
                  + Add Tag
                </button>
              </div>
            </div>

            {/* Event Statistics */}
            {eventStats && (
              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-value">{eventStats.totalTags}</div>
                  <div className="stat-label">Total Tags</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{eventStats.activeTags}</div>
                  <div className="stat-label">Active Tags</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{eventStats.totalScans}</div>
                  <div className="stat-label">Total Scans</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{eventStats.assignedTags}</div>
                  <div className="stat-label">Assigned Tags</div>
                </div>
              </div>
            )}

            {/* Bulk Tag Upload Section */}
            <div className="bulk-upload-section">
              <div className="section-header">
                <h2>Bulk Tag Upload</h2>
              </div>
              
              <div className="bulk-upload-container">
                <div className="upload-instructions">
                  <p>📋 Upload a CSV or Excel file to create multiple NFC tags for this event.</p>
                  <p><strong>Required columns:</strong> Tag ID, Name, Destination URL</p>
                  <p><strong>Optional columns:</strong> Description, Location</p>
                  <button
                    onClick={() => generateTagCSVTemplate()}
                    className="btn btn-outline btn-small"
                  >
                    📥 Download CSV Template
                  </button>
                </div>

                <div className="file-upload-area">
                  <input
                    type="file"
                    id="bulk-tag-file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBulkTagUpload}
                    className="file-input"
                  />
                  <label htmlFor="bulk-tag-file" className="file-label">
                    <span className="upload-icon">📁</span>
                    <span className="upload-text">Click to upload or drag and drop</span>
                    <span className="upload-hint">CSV or Excel files accepted</span>
                  </label>
                </div>
              </div>
            </div>

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

            {/* Tags Table */}
            <div className="tags-section">
              <div className="section-header">
                <h2>Event Tags</h2>
                <div className="filter-buttons">
                  <button
                    className={`filter-btn ${filterActive === 'all' ? 'active' : ''}`}
                    onClick={() => setFilterActive('all')}
                  >
                    All
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

              <div className="tags-table-container">
                {tags.filter(tag => 
                  filterActive === 'all' || 
                  (filterActive === 'active' && tag.isActive) ||
                  (filterActive === 'inactive' && !tag.isActive)
                ).length === 0 ? (
                  <div className="empty-state">
                    <p>No tags found. Create tags individually or use bulk upload!</p>
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
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tags.filter(tag => 
                        filterActive === 'all' || 
                        (filterActive === 'active' && tag.isActive) ||
                        (filterActive === 'inactive' && !tag.isActive)
                      ).map((tag) => (
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
                              className="url-link"
                            >
                              {tag.destinationUrl.substring(0, 40)}...
                            </a>
                          </td>
                          <td className="scans-cell">{tag.scanCount}</td>
                          <td>
                            <span className={`status-badge ${tag.isActive ? 'active' : 'inactive'}`}>
                              {tag.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button
                              onClick={() => openAttendeeModal(tag)}
                              className="btn-icon"
                              title="Assign Attendee"
                            >
                              👤
                            </button>
                            <button
                              onClick={() => openTagModal(tag)}
                              className="btn-icon"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleToggleTagActive(tag)}
                              className="btn-icon"
                              title={tag.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {tag.isActive ? '⏸️' : '▶️'}
                            </button>
                            <button
                              onClick={() => handleDeleteTag(tag._id)}
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
            </div>
          </div>
        )}

        {/* Event Modal */}
        {showEventModal && (
          <div className="modal-overlay" onClick={closeEventModal}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingEvent ? 'Edit Event' : 'Create New Event'}</h2>
                <button onClick={closeEventModal} className="close-btn">×</button>
              </div>

              <form onSubmit={handleEventSubmit} className="event-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event-name">Event Name *</label>
                    <input
                      type="text"
                      id="event-name"
                      value={eventForm.name}
                      onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                      required
                      placeholder="e.g., Tech Conference 2026"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="event-date">Event Date *</label>
                    <input
                      type="date"
                      id="event-date"
                      value={eventForm.eventDate}
                      onChange={(e) => setEventForm({ ...eventForm, eventDate: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event-type">Event Type</label>
                    <select
                      id="event-type"
                      value={eventForm.eventType}
                      onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                    >
                      <option value="conference">Conference</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                      <option value="exhibition">Exhibition</option>
                      <option value="festival">Festival</option>
                      <option value="campaign">Campaign</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="event-status">Status</label>
                    <select
                      id="event-status"
                      value={eventForm.status}
                      onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="event-description">Description</label>
                  <textarea
                    id="event-description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    rows="3"
                    placeholder="Brief description of the event"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="event-location">Location</label>
                    <input
                      type="text"
                      id="event-location"
                      value={eventForm.location}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      placeholder="e.g., Convention Center"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="expected-attendees">Expected Attendees</label>
                    <input
                      type="number"
                      id="expected-attendees"
                      value={eventForm.expectedAttendees}
                      onChange={(e) => setEventForm({ ...eventForm, expectedAttendees: e.target.value })}
                      min="0"
                      placeholder="e.g., 100"
                    />
                  </div>
                </div>

                <div className="form-section-title">Organizer Information (Optional)</div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="organizer-name">Organizer Name</label>
                    <input
                      type="text"
                      id="organizer-name"
                      value={eventForm.organizerName}
                      onChange={(e) => setEventForm({ ...eventForm, organizerName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="organizer-email">Organizer Email</label>
                    <input
                      type="email"
                      id="organizer-email"
                      value={eventForm.organizerEmail}
                      onChange={(e) => setEventForm({ ...eventForm, organizerEmail: e.target.value })}
                      placeholder="organizer@example.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="organizer-phone">Organizer Phone</label>
                  <input
                    type="tel"
                    id="organizer-phone"
                    value={eventForm.organizerPhone}
                    onChange={(e) => setEventForm({ ...eventForm, organizerPhone: e.target.value })}
                    placeholder="555-0000"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="event-notes">Notes</label>
                  <textarea
                    id="event-notes"
                    value={eventForm.notes}
                    onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                    rows="3"
                    placeholder="Additional notes or instructions"
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeEventModal} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tag Modal */}
        {showTagModal && (
          <div className="modal-overlay" onClick={closeTagModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingTag ? 'Edit Tag' : 'Create New Tag'}</h2>
                <button onClick={closeTagModal} className="close-btn">×</button>
              </div>

              <form onSubmit={handleTagSubmit} className="tag-form">
                <div className="form-group">
                  <label htmlFor="tagId">Tag ID *</label>
                  <input
                    type="text"
                    id="tagId"
                    value={tagForm.tagId}
                    onChange={(e) => setTagForm({ ...tagForm, tagId: e.target.value })}
                    required
                    disabled={!!editingTag}
                    placeholder="e.g., TAG-001"
                  />
                  <small>Unique identifier for the NFC tag</small>
                </div>

                <div className="form-group">
                  <label htmlFor="tag-name">Tag Name *</label>
                  <input
                    type="text"
                    id="tag-name"
                    value={tagForm.name}
                    onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                    required
                    placeholder="e.g., VIP Access Tag"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tag-description">Description</label>
                  <textarea
                    id="tag-description"
                    value={tagForm.description}
                    onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                    rows="3"
                    placeholder="Optional description"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="destinationUrl">Destination URL *</label>
                  <input
                    type="url"
                    id="destinationUrl"
                    value={tagForm.destinationUrl}
                    onChange={(e) => setTagForm({ ...tagForm, destinationUrl: e.target.value })}
                    required
                    placeholder="https://example.com"
                  />
                  <small>Where users will be redirected when they scan</small>
                </div>

                <div className="form-group">
                  <label htmlFor="tag-location">Location</label>
                  <input
                    type="text"
                    id="tag-location"
                    value={tagForm.location}
                    onChange={(e) => setTagForm({ ...tagForm, location: e.target.value })}
                    placeholder="e.g., Registration Desk"
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={tagForm.isActive}
                      onChange={(e) => setTagForm({ ...tagForm, isActive: e.target.checked })}
                    />
                    <span>Active (tag is enabled for scanning)</span>
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={closeTagModal} className="btn btn-outline">
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

        {/* Bulk Tag Upload Confirmation Modal */}
        {showBulkTagModal && (
          <div className="modal-overlay" onClick={() => setShowBulkTagModal(false)}>
            <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Confirm Bulk Tag Upload</h2>
                <button onClick={() => setShowBulkTagModal(false)} className="close-btn">×</button>
              </div>

              <div className="modal-body">
                <p>
                  You are about to create <strong>{bulkTags.length}</strong> NFC tags for <strong>{selectedEvent?.name}</strong>.
                </p>

                <div className="bulk-preview">
                  <h4>Preview (first 5):</h4>
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Tag ID</th>
                        <th>Name</th>
                        <th>URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkTags.slice(0, 5).map((tag, idx) => (
                        <tr key={idx}>
                          <td>{tag.tagId}</td>
                          <td>{tag.name}</td>
                          <td className="url-preview">{tag.destinationUrl.substring(0, 30)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {bulkTags.length > 5 && (
                    <p className="more-items">
                      ...and {bulkTags.length - 5} more
                    </p>
                  )}
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowBulkTagModal(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkTagCreate}
                    className="btn btn-primary"
                  >
                    Confirm & Create Tags
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendee Assignment Modal */}
        {showAttendeeModal && selectedTag && (
          <div className="modal-overlay" onClick={closeAttendeeModal}>
            <div className="modal-content modal-medium" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Assign Attendee to {selectedTag.tagId}</h2>
                <button onClick={closeAttendeeModal} className="close-btn">×</button>
              </div>

              <div className="modal-body">
                <p className="tag-info">
                  <strong>Tag:</strong> {selectedTag.name}
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
                      onClick={closeAttendeeModal}
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
      </div>
    </div>
  );
};

export default TagManagement;
