import { StrictMode , React} from 'react'
import { createRoot, reactDOM } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <>
    <App />
  </>,
)
