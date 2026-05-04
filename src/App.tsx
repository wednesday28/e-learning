import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useAuth } from './hooks/useAuth'
import { DashboardLayout } from './components/layout'
import { Spinner } from './components/ui'

// Lazy load pages
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const RoleSelection = lazy(() => import('./pages/auth/RoleSelection'))

// Student
const StudentDashboard = lazy(() => import('./pages/student/Dashboard'))
const Learning = lazy(() => import('./pages/student/Learning'))
const Quiz = lazy(() => import('./pages/student/Quiz'))
const Tryout = lazy(() => import('./pages/student/Tryout'))
const Results = lazy(() => import('./pages/student/Results'))

// Teacher
const TeacherDashboard = lazy(() => import('./pages/teacher/Dashboard'))
const ManageClasses = lazy(() => import('./pages/teacher/ManageClasses'))
const ManageQuizzes = lazy(() => import('./pages/teacher/ManageQuizzes'))

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const UploadJSON = lazy(() => import('./pages/admin/UploadJSON'))
const UserManagement = lazy(() => import('./pages/admin/UserManagement'))

// Super Admin
const SuperAdminOverview = lazy(() => import('./pages/super-admin/Overview'))
const UserControl = lazy(() => import('./pages/super-admin/UserControl'))
const SystemSettings = lazy(() => import('./pages/super-admin/SystemSettings'))
const AuditLogs = lazy(() => import('./pages/super-admin/AuditLogs'))
const UploadCurriculum = lazy(() => import('./pages/super-admin/UploadCurriculum'))
const Profile = lazy(() => import('./pages/shared/Profile'))

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, profile, isLoading } = useAuthStore()
  if (isLoading) return <div className="h-screen w-full flex items-center justify-center"><Spinner /></div>
  if (!user) return <Navigate to="/login" />

  // If user is logged in but profile is still null, it might be an RLS or fetch error
  // We allow it to proceed to dashboard where it might show a fallback or retry
  if (user && !profile && !isLoading && window.location.pathname !== '/role-selection') {
     // Optional: you could retry fetchProfile here or just let it be
  }

  // Only redirect to role-selection if the profile exists but HAS NO ROLE
  if (user && profile && !profile.role && window.location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" />
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" />
  }

  // If teacher is logged in but status is pending, show waiting state or limited dashboard
  if (profile?.role === 'teacher' && profile.status === 'pending' && window.location.pathname !== '/teacher/pending') {
    // We can either redirect to a special page or just handle it in the Dashboard
    // For simplicity, let's keep it in the dashboard but with a limited UI (handled in TeacherDashboard)
  }

  return <>{children}</>
}

const App = () => {
  useAuth()

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Spinner /></div>}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/role-selection" element={<ProtectedRoute><RoleSelection /></ProtectedRoute>} />

          {/* Student */}
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="learning" element={<Learning />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="tryout" element={<Tryout />} />
            <Route path="results" element={<Results />} />
          </Route>

          {/* Teacher */}
          <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<TeacherDashboard />} />
            <Route path="classes" element={<ManageClasses />} />
            <Route path="quizzes" element={<ManageQuizzes />} />
          </Route>

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'super_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="upload" element={<UploadJSON />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          {/* Super Admin */}
          <Route path="/super-admin" element={<ProtectedRoute allowedRoles={['super_admin']}><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<SuperAdminOverview />} />
            <Route path="users" element={<UserControl />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="upload" element={<UploadCurriculum />} />
          </Route>

          <Route path="/profile" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
