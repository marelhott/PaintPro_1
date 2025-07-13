import React from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import LoginScreen from './LoginScreen';
import Dashboard from './Dashboard';
import OrderTable from './OptimizedOrderTable';
import CalculatorComponent from './CalculatorComponent';
import CalendarComponent from './CalendarComponent';
import GitLockManager from './GitLockManager';
import BackupManager from './BackupManager';
import './App.css';
import './MobileOptimizations.css';

function AppContent() {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Načítám aplikaci...</p>
      </div>
    );
  }

  // Pokud není uživatel načten, zobraz výběr profilů
  if (!currentUser) {
    return <LoginScreen />;
  }

  // Hlavní aplikace pro přihlášeného uživatele
  return (
    <div className="app">
      <GitLockManager />
      <BackupManager />

      <header className="app-header">
        <div className="header-content">
          <h1>PaintPro</h1>
          <div className="user-info">
            <div 
              className="user-avatar"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.avatar}
            </div>
            <span className="user-name">{currentUser.name}</span>
            <button 
              className="logout-btn"
              onClick={() => window.location.hash = ''}
              title="Změnit profil"
            >
              🔄
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Dashboard />
        <OrderTable />
        <CalculatorComponent />
        <CalendarComponent />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;