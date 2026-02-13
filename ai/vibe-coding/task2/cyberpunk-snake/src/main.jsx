import React from 'react'
import ReactDOM from 'react-dom/client'
import SnakeGame from './SnakeGame'
import ErrorBoundary from './ErrorBoundary'
import './SnakeGame.css'

// 错误处理
const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="padding: 20px; color: red;">错误：找不到 root 元素</div>'
} else {
  try {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <SnakeGame />
        </ErrorBoundary>
      </React.StrictMode>,
    )
  } catch (error) {
    console.error('Error rendering app:', error)
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: monospace; background: #09090b; min-height: 100vh;">
        <h1>渲染错误</h1>
        <pre>${error.toString()}</pre>
        <pre>${error.stack || 'No stack trace'}</pre>
      </div>
    `
  }
}
