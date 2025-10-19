import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import CSS files in order
import './styles/variables.css';
import './styles/base.css';
import './styles/forms.css';
import './styles/navbar.css';
import './styles/modal.css';
import './styles/components/Auth.css';
import './styles/components/PrintQueue.css';
import './styles/components/Admin.css';
import './styles/components/UserManagement.css';
import './styles/components/ServerSettings.css';
import './styles/components/AccessLogs.css';
import './styles/components/Showcase.css';
import './styles/responsive.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);