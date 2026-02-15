import React, { Suspense, lazy } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SplashScreen from "./components/SplashScreen";
import ContactWidget from "./components/ContactWidget";
import ScrollToTop from "./components/ScrollToTop";
import AdminAuthGate from "./admin/AdminAuthGate";
import "./App.css";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const About = lazy(() => import("./pages/About"));
const Profile = lazy(() => import("./pages/Profile"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const Contact = lazy(() => import("./pages/Contact"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Shipping = lazy(() => import("./pages/Shipping"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
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

const appVariant = import.meta.env.VITE_APP_VARIANT;
const isAdminHost = window.location.hostname.startsWith("admin.");
const isAdminApp =
  appVariant === "admin" || (appVariant !== "store" && isAdminHost);

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin") || isAdminApp;

  if (isAdminApp) {
    return (
      <div className="app">
        <SplashScreen />
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
    );
  }

  return (
    <div className="app">
      <SplashScreen />
      {!isAdminRoute && <Navbar />}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-orders" element={<MyOrders />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/admin/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ContactWidget />}
    </div>
  );
};

const App: React.FC = () => {
  const basename = isAdminApp ? "/" : "/";

  return (
    <Router basename={basename}>
      <AuthProvider>
        <ThemeProvider>
          <CartProvider>
            <WishlistProvider>
              <ScrollToTop />
              <AppContent />
            </WishlistProvider>
          </CartProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
