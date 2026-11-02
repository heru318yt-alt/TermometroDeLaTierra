import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './app/App'
import './styles/base.css'
import './styles/site.css'
import './styles/editorial.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>,
)
