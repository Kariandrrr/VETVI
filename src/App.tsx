import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import {AuthProvider} from '@/context/AuthContext';
import {RegisterPage} from '@/pages/RegisterPage';
import {LoginPage} from '@/pages/LoginPage';
import {HomePage} from '@/pages/HomePage';
import {FamiliesPage} from '@/pages/FamiliesPage';
import {ProtectedRoute} from '@/components/ProtectedRoute';
import {JoinPage} from '@/pages/JoinPage';
import { FamilyTreePage } from '@/pages/FamilyTreePage';
import { MemberProfilePage } from '@/pages/MemberProfilePage';
import { FamilyFeedPage } from '@/pages/FamilyFeedPage';


import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Toaster} from 'sonner';

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
              <Route path="/family/:id" element={<FamilyTreePage />} />

            <Route path="*" element={<Navigate to="/" replace />} />


            <Route
              path="/families/:familyId/feed"
              element={
                <ProtectedRoute>
                  <FamilyFeedPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/families/:familyId/members/:memberId"
              element={
                <ProtectedRoute>
                  <MemberProfilePage />
                </ProtectedRoute>
              }
            />
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