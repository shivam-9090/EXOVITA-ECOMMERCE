import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ScrollToTop from "./components/ScrollToTop";
import SplashScreen from "./components/SplashScreen";
import AdminAuthGate from "./admin/AdminAuthGate";

const AdminLayout = lazy(() => import("./components/AdminLayout"));
const AdminLogin = lazy(() => import("./admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminProductForm = lazy(() => import("./pages/AdminProductForm"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers"));
const AdminInventory = lazy(() => import("./pages/AdminInventory"));
const AdminPayments = lazy(() => import("./pages/AdminPayments"));
const AdminCoupons = lazy(() => import("./pages/AdminCoupons"));
const AdminReviews = lazy(() => import("./pages/AdminReviews"));
const AdminReports = lazy(() => import("./pages/AdminReports"));
const AdminCMS = lazy(() => import("./pages/AdminCMS"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));

const PageLoader = () => null;

const AdminApp: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <div className="app">
            <SplashScreen />
            <ScrollToTop />
            <main>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route
                    path="/"
                    element={<Navigate to="/admin/login" replace />}
                  />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <AdminAuthGate>
                        <AdminLayout />
                      </AdminAuthGate>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductForm />} />
                    <Route
                      path="products/edit/:id"
                      element={<AdminProductForm />}
                    />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="inventory" element={<AdminInventory />} />
                    <Route path="payments" element={<AdminPayments />} />
                    <Route path="coupons" element={<AdminCoupons />} />
                    <Route path="reviews" element={<AdminReviews />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="cms" element={<AdminCMS />} />
                    <Route path="roles" element={<AdminRoles />} />
                    <Route path="logs" element={<AdminLogs />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>
                  <Route
                    path="*"
                    element={<Navigate to="/admin/login" replace />}
                  />
                </Routes>
              </Suspense>
            </main>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default AdminApp;
