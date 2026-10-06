import '@vitejs/plugin-react/preamble'
import './assets/main.css'
import { hydrateRoot } from 'react-dom/client'
import { App } from './app.tsx'

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('React root element was not found')
}

hydrateRoot(root, <App />)
