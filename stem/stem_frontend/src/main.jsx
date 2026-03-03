import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Theme } from '@radix-ui/themes/dist/cjs/index.js'
import axios from 'axios'

// Send auth cookies with every request to the main backend
axios.defaults.withCredentials = true;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Theme>
    <App />
    </Theme>
  </StrictMode>,
)
