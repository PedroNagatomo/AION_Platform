import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/authStore";
import { usePreferencesStore } from "./store/preferencesStore";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChatPage } from "./pages/ChatPage";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { ContactsPage } from "./pages/ContactsPage";
import { SpreadsheetPage } from "./pages/SpreadsheetPage";
import { ChartsPage } from "./pages/ChartsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotesPage } from "./pages/NotesPage";
import { JarvisAssistant } from "./components/jarvis/JarvisAssistant";
import { RemindersPage } from "./pages/RemindersPage";
import { FilesPage } from "./pages/FilesPage";
import { GlobalSearch } from "./components/search/GlobalSearch";
import { IntegrationsPage } from "./pages/IntegrationsPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { GitHubOAuthCallbackPage } from "./pages/GitHubOAuthCallbackPage";
import { WhiteboardPage } from "./pages/WhiteboardPage";
import { WorkflowsPage } from "./pages/WorkflowsPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { isAuthenticated } = useAuthStore();
  const { preferences, loadPreferences } = usePreferencesStore();

  useEffect(() => {
    if (isAuthenticated) {
      loadPreferences();
    }
  }, [isAuthenticated]);

  return (
    <Router>
      <GlobalSearch />

      <Routes>
        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rota de callback OAuth - PÚBLICA, dentro do Routes */}
        <Route path="/oauth/notion/callback" element={<OAuthCallbackPage />} />
        <Route path="/oauth/notion/callback" element={<OAuthCallbackPage />} />
        <Route
          path="/oauth/github/callback"
          element={<GitHubOAuthCallbackPage />}
        />

        {/* Rotas privadas */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/chat/:conversationId"
          element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/notes"
          element={
            <PrivateRoute>
              <NotesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/spreadsheets"
          element={
            <PrivateRoute>
              <SpreadsheetPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/charts"
          element={
            <PrivateRoute>
              <ChartsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/whiteboard"
          element={
            <PrivateRoute>
              <WhiteboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <CalendarPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <PrivateRoute>
              <ContactsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <PrivateRoute>
              <IntegrationsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/reminders"
          element={
            <PrivateRoute>
              <RemindersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/files"
          element={
            <PrivateRoute>
              <FilesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SettingsPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/workflows"
          element={
            <PrivateRoute>
              <WorkflowsPage />
            </PrivateRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>

      {/* JARVIS - só aparece se ativado nas configurações e autenticado */}
      {isAuthenticated && preferences?.jarvisEnabled && <JarvisAssistant />}
    </Router>
  );
}

export default AppContent;
