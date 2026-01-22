import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SplashScreen from './components/SplashScreen';
import ContactWidget from './components/ContactWidget';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const Cart = lazy(() => import('./pages/Cart'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const About = lazy(() => import('./pages/About'));
const ProductDetails = lazy(() => import('./pages/ProductDetails'));
const Contact = lazy(() => import('./pages/Contact'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const Shipping = lazy(() => import('./pages/Shipping'));

const PageLoader = () => null;

const App: React.FC = () => {
  return (
    <Router>
      <ScrollToTop />
      <div className="app">
        <SplashScreen />
        <Navbar />
        <main>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/about" element={<About />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/shipping" element={<Shipping />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <ContactWidget />
      </div>
    </Router>
  );
};

export default App;
