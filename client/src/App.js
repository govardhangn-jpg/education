import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LanguageProvider } from './hooks/useLanguage';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ChatPage from './pages/ChatPage';
import QuizPage from './pages/QuizPage';
import ProgressPage from './pages/ProgressPage';
import AdminPage from './pages/AdminPage';
import VisualLabPage from './pages/VisualLabPage';
import ARLabPage from './pages/ARLabPage';
import LifeSkillsPage from './pages/LifeSkillsPage';
import DigitalLegacyPage from './pages/DigitalLegacyPage';
import UPSCWritingPage from './pages/UPSCWritingPage';
import SessionsPage from './pages/SessionsPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0d0d1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>🎓</div>
        <div style={{ fontFamily:"'Baloo 2',cursive", fontSize:24, background:'linear-gradient(90deg,#ffd700,#ff9500)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>SamarthaaEdu</div>
        <div style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginTop:8 }}>Loading...</div>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="chat" element={<ChatPage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="admin" element={<AdminPage />} />
              <Route path="visual-lab" element={<VisualLabPage />} />
              <Route path="ar-lab" element={<ARLabPage />} />
              <Route path="life-skills" element={<LifeSkillsPage />} />
              <Route path="legacy" element={<DigitalLegacyPage />} />
              <Route path="upsc-writing" element={<UPSCWritingPage />} />
              <Route path="sessions" element={<SessionsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
