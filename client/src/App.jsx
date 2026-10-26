import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { ExploreMarketplace } from './pages/public/ExploreMarketplace';
import { ListingDetailPage } from './pages/public/ListingDetailPage';
import { PublicImpactPage } from './pages/public/PublicImpactPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { SafetyGuidelinesPage } from './pages/public/SafetyGuidelinesPage';
import { NotFoundPage } from './pages/public/NotFoundPage';
import { ForbiddenPage } from './pages/public/ForbiddenPage';

// Donor Pages
import { DonorDashboard } from './pages/donor/DonorDashboard';
import { CreateListingPage } from './pages/donor/CreateListingPage';
import { DonorReservationsPage } from './pages/donor/DonorReservationsPage';

// Recipient Pages
import { RecipientDashboard } from './pages/recipient/RecipientDashboard';
import { MyReservationsPage } from './pages/recipient/MyReservationsPage';
import { OrgVerificationPage } from './pages/recipient/OrgVerificationPage';

// Volunteer Pages
import { VolunteerDashboard } from './pages/volunteer/VolunteerDashboard';
import { TaskBoardPage } from './pages/volunteer/TaskBoardPage';
import { ActiveDeliveryPage } from './pages/volunteer/ActiveDeliveryPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { OrgVerificationQueue } from './pages/admin/OrgVerificationQueue';
import { ModerationReports } from './pages/admin/ModerationReports';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public Discovery Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/explore" element={<ExploreMarketplace />} />
                <Route path="/listings/:id" element={<ListingDetailPage />} />
                <Route path="/impact" element={<PublicImpactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/safety-guidelines" element={<SafetyGuidelinesPage />} />

                {/* Donor Protected Routes */}
                <Route
                  path="/donor/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['donor', 'admin']}>
                      <DonorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/donor/listings/new"
                  element={
                    <ProtectedRoute allowedRoles={['donor', 'admin']}>
                      <CreateListingPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/donor/listings"
                  element={
                    <ProtectedRoute allowedRoles={['donor', 'admin']}>
                      <DonorDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/donor/reservations"
                  element={
                    <ProtectedRoute allowedRoles={['donor', 'admin']}>
                      <DonorReservationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Recipient Protected Routes */}
                <Route
                  path="/recipient/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['recipient', 'admin']}>
                      <RecipientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recipient/reservations"
                  element={
                    <ProtectedRoute allowedRoles={['recipient', 'admin']}>
                      <MyReservationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/recipient/organization/verify"
                  element={
                    <ProtectedRoute allowedRoles={['recipient', 'admin']}>
                      <OrgVerificationPage />
                    </ProtectedRoute>
                  }
                />

                {/* Volunteer Protected Routes */}
                <Route
                  path="/volunteer/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                      <VolunteerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/volunteer/tasks"
                  element={
                    <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                      <TaskBoardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/volunteer/active"
                  element={
                    <ProtectedRoute allowedRoles={['volunteer', 'admin']}>
                      <ActiveDeliveryPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Protected Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/verifications"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <OrgVerificationQueue />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/moderation"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <ModerationReports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AuditLogsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Error & Access Control Pages */}
                <Route path="/forbidden" element={<ForbiddenPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
