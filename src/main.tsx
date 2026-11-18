import { createRoot } from 'react-dom/client'
import './styles/global.css'
import './styles/app.css'
import { App } from './App'

const root = document.getElementById('root')!
;(window as unknown as { __staticBoot?: boolean }).__staticBoot = !!root.querySelector('.boot--static')
createRoot(root).render(<App />)
