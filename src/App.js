import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppRouter from './routes/AppRouter';
import './styles/global.css';
import './App.css';

/**
 * Main App Component
 * Wraps the application with AuthProvider, ErrorBoundary, and Router
 */
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="App">
          <AppRouter />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

