import { Layout } from "@/components/Layout";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import PrivateRoute from "@/components/PrivateRoute";
import { AuthProvider } from "./context/Authorization.context";
import { Role } from "./constants/enum";

// Sử dụng lazy load
const HomePage = lazy(() => import("@/pages/HomePage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const StaffPage = lazy(() => import("@/pages/StaffPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/admin"
                element={
                  <PrivateRoute requiredRoles={[Role.Admin]}>
                    <AdminPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/staff"
                element={
                  <PrivateRoute requiredRoles={[Role.Staff]}>
                    <StaffPage />
                  </PrivateRoute>
                }
              />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
