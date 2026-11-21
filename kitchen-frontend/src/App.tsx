import { Navigate, Routes, Route, useParams } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import EventKitchen from './pages/EventKitchen'
import TeamRegistration from './pages/TeamRegistration'
import IndividualRegistration from './pages/IndividualRegistration'
import JoinTeam from './pages/JoinTeam'
import JoinOptions from './pages/JoinOptions'
import MemberDashboard from './pages/MemberDashboard'
import ProjectSubmission from './pages/ProjectSubmission'
import Login from './pages/Login'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminTeams from './pages/admin/AdminTeams'
import AdminIndividuals from './pages/admin/AdminIndividuals'
import AdminProjects from './pages/admin/AdminProjects'
import AdminEvaluations from './pages/admin/AdminEvaluations'
import AdminJuries from './pages/admin/AdminJuries'
import AdminCompetitions from './pages/admin/AdminCompetitions'
import AdminKitchens from './pages/admin/AdminKitchens'
import AuthCallback from './pages/AuthCallback'
import Leaderboard from './pages/Leaderboard'
import Instructions from './pages/Instructions'
import MemberRoute from './components/MemberRoute'
import ProtectedRoute from './components/ProtectedRoute'

function LegacyTopTeamsRedirect() {
  const { eventId } = useParams()
  return <Navigate to={`/events/${eventId}/leaderboard`} replace />
}

function RedirectToJoin() {
  const { eventId } = useParams()
  return <Navigate to={`/events/${eventId}/join`} replace />
}

function RedirectToPool() {
  const { eventId } = useParams()
  return <Navigate to={`/events/${eventId}/join/pool`} replace />
}

function RedirectToDashboard() {
  const { eventId } = useParams()
  return <Navigate to={`/events/${eventId}/dashboard`} replace />
}

function App() {
  return (
    <div className="min-h-screen">
      <div className="stars-bg"></div>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Navigate to="/login?next=/admin" replace />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="instructions" element={<Instructions />} />
          <Route path="top-teams" element={<Navigate to="/" replace />} />
          {/* Public leaderboard — no login */}
          <Route path="events/:eventId/leaderboard" element={<Leaderboard />} />
          <Route path="events/:eventId/top-teams" element={<LegacyTopTeamsRedirect />} />
          <Route path="events/:eventId/instructions" element={<Instructions />} />

          <Route element={<MemberRoute />}>
            <Route path="events/:eventId" element={<EventKitchen />} />
            <Route path="events/:eventId/dashboard" element={<MemberDashboard />} />
            <Route path="events/:eventId/my-team" element={<RedirectToDashboard />} />
            <Route path="events/:eventId/jury" element={<RedirectToDashboard />} />
            <Route path="events/:eventId/register/team" element={<TeamRegistration />} />
            <Route path="events/:eventId/join" element={<JoinOptions />} />
            <Route path="events/:eventId/join/team" element={<JoinTeam />} />
            <Route path="events/:eventId/join/pool" element={<IndividualRegistration />} />
            <Route path="events/:eventId/join-team" element={<RedirectToJoin />} />
            <Route path="events/:eventId/register/individual" element={<RedirectToPool />} />
            <Route path="events/:eventId/project/submit" element={<ProjectSubmission />} />
          </Route>

          {/* Legacy global form URLs → home (kitchens are event-scoped) */}
          <Route path="register/team" element={<Navigate to="/" replace />} />
          <Route path="register/individual" element={<Navigate to="/" replace />} />
          <Route path="project/submit" element={<Navigate to="/" replace />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute />}>
          <Route index element={<Navigate to="/admin/kitchens" replace />} />
          <Route path="kitchens" element={<AdminKitchens />} />
          <Route path="events/:eventId" element={<AdminDashboard />} />
          <Route path="events/:eventId/teams" element={<AdminTeams />} />
          <Route path="events/:eventId/individuals" element={<AdminIndividuals />} />
          <Route path="events/:eventId/projects" element={<AdminProjects />} />
          <Route path="events/:eventId/juries" element={<AdminJuries />} />
          <Route path="events/:eventId/competitions" element={<AdminCompetitions />} />
          <Route path="events/:eventId/evaluations" element={<AdminEvaluations />} />
          <Route path="management" element={<Navigate to="/admin/kitchens" replace />} />
          <Route path="teams" element={<Navigate to="/admin/kitchens" replace />} />
          <Route path="individuals" element={<Navigate to="/admin/kitchens" replace />} />
          <Route path="projects" element={<Navigate to="/admin/kitchens" replace />} />
          <Route path="evaluations" element={<Navigate to="/admin/kitchens" replace />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
