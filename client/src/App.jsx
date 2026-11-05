
import React, { useEffect } from 'react';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import TransportPage from './pages/TransportPage';
import AccommodationPage from './pages/AccommodationPage';
import FoodPage from './pages/FoodPage';
import ActivitiesPage from './pages/ActivitiesPage';
import PackagesPage from './pages/PackagesPage';
import ToolsSuite from './pages/ToolsSuite';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import Modals from './components/modals/Modals';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { initSutrivaRuntime } from './sutriva-runtime';

export default function App() {
  useEffect(() => {
    const timer = setTimeout(() => {
      initSutrivaRuntime();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ModalProvider>
          <ToastProvider>
            <div className="sutriva-app-root">
              <div className="nav-wrapper">
                <Navbar />
              </div>
              <main className="main-content">
                <HomePage />
                <TransportPage />
                <AccommodationPage />
                <FoodPage />
                <ActivitiesPage />
                <PackagesPage />
                <ToolsSuite />
                <MapPage />
                <ProfilePage />
                <Footer />
              </main>
              <Modals />
            </div>
          </ToastProvider>
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
