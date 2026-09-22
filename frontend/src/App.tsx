import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClubListPage } from './pages/clubs/ClubListPage';
import { ClubDetailPage } from './pages/clubs/ClubDetailPage';
import { ManageClubsPage } from './pages/clubs/ManageClubsPage';
import { EventListPage } from './pages/events/EventListPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { CreateEventPage } from './pages/events/CreateEventPage';
import { ManageEventsPage } from './pages/events/ManageEventsPage';
import { MyRegistrationsPage } from './pages/registrations/MyRegistrationsPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { ReportsDashboardPage } from './pages/reports/ReportsDashboardPage';
import { CreateUserPage } from './pages/admin/CreateUserPage';
import { FacultyOverviewPage } from './pages/faculty/FacultyOverviewPage';
import { ProfilePage } from './pages/profile/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clubs" element={<ClubListPage />} />
            <Route path="/clubs/:id" element={<ClubDetailPage />} />
            <Route path="/events" element={<EventListPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/registrations" element={<MyRegistrationsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin only */}
            <Route element={<ProtectedRoute allowedRoles={['ADMINISTRATOR']} />}>
              <Route path="/clubs/manage" element={<ManageClubsPage />} />
              <Route path="/reports" element={<ReportsDashboardPage />} />
              <Route path="/admin/users" element={<CreateUserPage />} />
            </Route>

            {/* Coordinator & Admin */}
            <Route element={<ProtectedRoute allowedRoles={['CLUB_COORDINATOR', 'ADMINISTRATOR']} />}>
              <Route path="/events/create" element={<CreateEventPage />} />
              <Route path="/events/manage" element={<ManageEventsPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
            </Route>

            {/* Faculty */}
            <Route element={<ProtectedRoute allowedRoles={['FACULTY_COORDINATOR', 'ADMINISTRATOR']} />}>
              <Route path="/faculty" element={<FacultyOverviewPage />} />
            </Route>

          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
