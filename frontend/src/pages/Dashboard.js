import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import scanService from '../services/scanService';
import './Dashboard.css';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats
      const statsData = await scanService.getStats();
      setStats(statsData.data);

      // Fetch analytics with date filter
      const analyticsData = await scanService.getAnalytics(dateFilter);
      setAnalytics(analyticsData.data);

      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (e) => {
    setDateFilter({
      ...dateFilter,
      [e.target.name]: e.target.value,
    });
  };

  const resetDateFilter = () => {
    setDateFilter({ startDate: '', endDate: '' });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Analytics Dashboard</h1>
          
          <div className="date-filter">
            <input
              type="date"
              name="startDate"
              value={dateFilter.startDate}
              onChange={handleDateFilterChange}
              placeholder="Start Date"
            />
            <input
              type="date"
              name="endDate"
              value={dateFilter.endDate}
              onChange={handleDateFilterChange}
              placeholder="End Date"
            />
            {(dateFilter.startDate || dateFilter.endDate) && (
              <button onClick={resetDateFilter} className="btn btn-secondary btn-sm">
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Total Scans</h3>
              <p className="stat-value">{stats?.totalScans || 0}</p>
              <span className="stat-label">All time</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>Unique Users</h3>
              <p className="stat-value">{stats?.uniqueUsers || 0}</p>
              <span className="stat-label">Unique IPs</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <h3>Last 7 Days</h3>
              <p className="stat-value">{stats?.scansLast7Days || 0}</p>
              <span className="stat-label">Recent scans</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏷️</div>
            <div className="stat-content">
              <h3>Active Tags</h3>
              <p className="stat-value">{stats?.activeTags || 0}</p>
              <span className="stat-label">Currently active</span>
            </div>
          </div>
        </div>

        {/* Charts */}
        {analytics && (
          <>
            {/* Scans Over Time */}
            <div className="chart-card">
              <h2>Scans Over Time</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.scansOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2}
                    name="Scans"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="charts-row">
              {/* Device Type Distribution */}
              <div className="chart-card">
                <h2>Device Types</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.scansByDevice}
                      dataKey="count"
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {analytics.scansByDevice.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Browser Distribution */}
              <div className="chart-card">
                <h2>Browsers</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.scansByBrowser}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" name="Scans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Tags */}
            {analytics.topTags && analytics.topTags.length > 0 && (
              <div className="chart-card">
                <h2>Top Performing Tags</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topTags}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2563eb" name="Scans" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
