import React from 'react';
import { createRoot } from 'react-dom/client';
import ConsoleApp from './ConsoleApp.jsx';
import './console.css';

createRoot(document.getElementById('console-root')).render(<ConsoleApp />);
