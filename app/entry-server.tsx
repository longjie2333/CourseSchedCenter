import { renderToReadableStream } from 'react-dom/server.edge'
import { App } from './app.tsx'
import './assets/main.css'

import clientAssets from './entry-client.tsx?assets=client'
import serverAssets from './entry-server.tsx?assets=ssr'

export default {
  async fetch() {
    const assets = clientAssets.merge(serverAssets)

    return new Response(
      await renderToReadableStream(
        <html lang="zh-CN">
          <head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>小江课表工作台</title>
            {assets.css.map((attributes) => (
              <link key={attributes.href} rel="stylesheet" {...attributes} />
            ))}
            {assets.js.map((attributes) => (
              <link key={attributes.href} rel="modulepreload" {...attributes} />
            ))}
            <script type="module" src={assets.entry} />
          </head>
          <body id="app">
            <App />
          </body>
        </html>,
      ),
      { headers: { 'content-type': 'text/html; charset=utf-8' } },
    )
  },
}
