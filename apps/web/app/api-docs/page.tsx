'use client'

import { useEffect } from 'react'

export default function ApiDocsPage() {
  useEffect(() => {
    // 1. Inject Swagger UI stylesheet
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css'
    link.id = 'swagger-ui-css'
    document.head.appendChild(link)

    // 2. Inject Swagger UI bundle script
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js'
    script.async = true
    script.onload = () => {
      const win = window as any
      if (win.SwaggerUIBundle) {
        win.SwaggerUIBundle({
          url: '/api/docs',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            win.SwaggerUIBundle.presets.apis
          ],
          layout: 'BaseLayout'
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      const existingLink = document.getElementById('swagger-ui-css')
      if (existingLink) document.head.removeChild(existingLink)
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 p-6">
      <div className="max-w-6xl mx-auto bg-slate-100 rounded-2xl shadow-2xl overflow-hidden p-6 border border-slate-700">
        <h1 className="text-xl font-bold text-slate-900 mb-4 px-4">Interactive API Documentation (Swagger)</h1>
        <div id="swagger-ui" />
      </div>
    </div>
  )
}
