import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/NavBar';
import PrintQueue from './components/PrintQueue';
import RequestForm from './components/RequestForm';
import Auth from './components/Auth';
import VerifyEmail from './components/VerifyEmail';
import AdminPanel from './components/Admin/AdminPanel';
import Showcase from './components/Showcase';
import { UserProvider, useUser } from './context/UserContext';
import './styles/base.css';
import './styles/variables.css';
import './styles/navbar.css';
import './styles/forms.css';
import './styles/modal.css';
import './styles/responsive.css';

const PrivateRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useUser();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useUser();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user?.isAdmin ? children : <Navigate to="/" />;
};

const App: React.FC = () => {
  return (
    <UserProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<PrintQueue />} />
              <Route path="/request" element={<PrivateRoute><RequestForm /></PrivateRoute>} />
              <Route path="/login" element={<Auth />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
              <Route path="/showcase" element={<Showcase />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  );
};

export default App;