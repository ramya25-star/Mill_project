const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('reset_db') === 'true') {
  localStorage.removeItem("pms_users");
  window.location.href = window.location.origin + window.location.hash;
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
