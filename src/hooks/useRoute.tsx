import { Layout } from "@/components/Layout";
import PrivateRoute from "@/components/PrivateRoute";
import { Suspense } from "react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

import { Role } from "@/constants/enum";

import PATHS from "@/constants/paths";
import AdminPage from "@/pages/AdminPage";
import HomePage from "@/pages/HomePage";
import { RoomsListPage, UpsertRoomPage } from "@/pages/RoomsManagement";
import StaffPage from "@/pages/StaffPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";

function useRoute() {
  return (
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

            <Route path={PATHS.ROOMS}>
              <Route
                index
                element={
                  <PrivateRoute requiredRoles={[Role.Admin]}>
                    <RoomsListPage />
                  </PrivateRoute>
                }
              />

              <Route
                path={PATHS.NEW_ROOM}
                element={
                  <PrivateRoute requiredRoles={[Role.Admin]}>
                    <UpsertRoomPage />
                  </PrivateRoute>
                }
              />

              <Route
                path={PATHS.EDIT_ROOM}
                element={
                  <PrivateRoute requiredRoles={[Role.Admin]}>
                    <UpsertRoomPage />
                  </PrivateRoute>
                }
              />
            </Route>

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
  );
}

export default useRoute;
