import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Landing from './pages/Landing';
import About from './pages/About';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TagManagement from './pages/TagManagement';
import UserManagement from './pages/UserManagement';
import ScanHandler from './pages/ScanHandler';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main style={{ minHeight: 'calc(100vh - 200px)' }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/scan/:tagId" element={<ScanHandler />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />

              {/* Staff/Admin Only Routes */}
              <Route
                path="/tags"
                element={
                  <PrivateRoute roles={['staff', 'admin']}>
                    <TagManagement />
                  </PrivateRoute>
                }
              />

              {/* Admin Only Routes */}
              <Route
                path="/users"
                element={
                  <PrivateRoute roles={['admin']}>
                    <UserManagement />
                  </PrivateRoute>
                }
              />

              {/* 404 Route */}
              <Route
                path="*"
                element={
                  <div className="container" style={{ marginTop: '4rem', textAlign: 'center' }}>
                    <h1>404 - Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
                    <a href="/" className="btn btn-primary">Go Home</a>
                  </div>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
