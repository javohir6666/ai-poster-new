import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { OverviewPage } from "./pages/dashboard/OverviewPage";
import { ChannelsPage } from "./pages/dashboard/ChannelsPage";
import { AnalyticsPage } from "./pages/dashboard/AnalyticsPage";
import { AutomationPage } from "./pages/dashboard/AutomationPage";
import { PostsPage } from "./pages/dashboard/PostsPage";
import { SettingsPage } from "./pages/dashboard/SettingsPage";
import { SubscriptionPage } from "./pages/dashboard/SubscriptionPage";
import { RequireAuth } from "./components/auth/RequireAuth";
import { RequireGuest } from "./components/auth/RequireGuest";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
            <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />

            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <DashboardLayout />
                </RequireAuth>
              }
            >
              <Route index element={<OverviewPage />} />
              <Route path="channels" element={<ChannelsPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="automation" element={<AutomationPage />} />
              <Route path="posts" element={<PostsPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
