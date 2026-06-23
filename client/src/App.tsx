import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/ui/Navbar';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Matches from './pages/Matches';
import Leaderboard from './pages/Leaderboard';
import PollResult from './pages/PollResult';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateMatch from './pages/admin/CreateMatch';
import EditMatch from './pages/admin/EditMatch';
import ManageUsers from './pages/admin/ManageUsers';
import ManagePoints from './pages/admin/ManagePoints';
import Community from './pages/Community';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-gray-950">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/matches/:id/poll" element={<PollResult />} />
              <Route path="/community" element={<Community />} />

              {/* Authenticated user routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/matches"
                element={
                  <ProtectedRoute>
                    <Matches />
                  </ProtectedRoute>
                }
              />

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/create-match"
                element={
                  <ProtectedRoute adminOnly>
                    <CreateMatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/edit-match/:id"
                element={
                  <ProtectedRoute adminOnly>
                    <EditMatch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute adminOnly>
                    <ManageUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/points"
                element={
                  <ProtectedRoute adminOnly>
                    <ManagePoints />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#111827',
              color: '#fff',
              border: '1px solid #374151',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '600',
              padding: '14px 20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              maxWidth: '420px',
            },
            success: {
              iconTheme: { primary: '#4ade80', secondary: '#111827' },
              style: {
                border: '1px solid #166534',
                background: '#052e16',
              },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#111827' },
              style: {
                border: '1px solid #991b1b',
                background: '#2d0a0a',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

