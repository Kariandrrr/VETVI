import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { RegisterPage } from '@/pages/RegisterPage';
import { LoginPage } from '@/pages/LoginPage';
import { HomePage } from '@/pages/HomePage';
import { FamiliesPage } from '@/pages/FamiliesPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { JoinPage } from '@/pages/JoinPage';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
              <Route path="/join/:token" element={<JoinPage />} />

            <Route
              path="/families"
              element={
                <ProtectedRoute>
                  <FamiliesPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

            <Toaster
              position="bottom-right"
              theme="dark"
              toastOptions={{
                style: {
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--foreground)',
                }
              }}
            />
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;