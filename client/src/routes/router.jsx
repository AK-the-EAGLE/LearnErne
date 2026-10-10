import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../auth/AuthProvider'
import MainLayout from '../layouts/mainlayout'
import ProtectedLayout from '../layouts/ProtectedLayout'
import About from '../pages/publicpages/About'
import Auth from '../pages/publicpages/Auth'
import Home from '../pages/publicpages/Home'
import HowItWorks from '../pages/publicpages/HowItWorks'
import NotFound from '../pages/publicpages/NotFound'
import Dashboard from '../pages/privatepages/Dashboard'
import Learning from '../pages/privatepages/Learning'
import Profile from '../pages/privatepages/Profile'
import Settings from '../pages/privatepages/Settings'
import CourseDetail from '../pages/privatepages/CourseDetail'
import CourseLesson from '../pages/privatepages/CourseLesson'
import CourseCheckpoint from '../pages/privatepages/CourseCheckpoint'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="how-it-works" element={<HowItWorks />} />
            <Route path="auth" element={<Auth />} />
            <Route path="sign-in" element={<Navigate to="/auth?mode=signin" replace />} />
            <Route path="sign-up" element={<Navigate to="/auth?mode=signup" replace />} />

            <Route element={<ProtectedLayout />}>
              <Route path="courses" element={<Learning />} />
              <Route path="courses/:courseSlug" element={<CourseDetail />} />
              <Route path="courses/:courseSlug/lessons/:lessonId" element={<CourseLesson />} />
              <Route path="courses/:courseSlug/checkpoints/:checkpointId" element={<CourseCheckpoint />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
