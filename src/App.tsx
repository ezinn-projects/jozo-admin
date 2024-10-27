import { Layout } from "@/components/Layout";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import PrivateRoute from "@/components/PrivateRoute";
import { AuthProvider } from "./context/Authorization.context";
import { Role } from "./constants/enum";
import PATHS from "./constants/paths";

// Sử dụng lazy load
const HomePage = lazy(() => import("@/pages/HomePage"));
const AdminPage = lazy(() => import("@/pages/AdminPage"));
const StaffPage = lazy(() => import("@/pages/StaffPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));
const RoomsManagementPage = lazy(
  () => import("@/pages/RoomsManagement/RoomsManagementPage")
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path={PATHS.HOME}
                element={
                  <PrivateRoute requiredRoles={[Role.Admin]}>
                    <AdminPage />
                  </PrivateRoute>
                }
              />

              <Route
                path={PATHS.ROOMS}
                element={
                  <PrivateRoute requiredRoles={[Role.Admin]}>
                    <RoomsManagementPage />
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
