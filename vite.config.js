import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import handlebars from 'vite-plugin-handlebars'
import tailwindcss from '@tailwindcss/vite'
import { root, siteDir, forWp, input, mediaFor } from './src/build/shared.js'
import { seoTags, webpImages, thaiLines, fontPreload, seoFiles, cssOrder } from './src/build/plugins.js'
import { helpers } from './src/build/helpers.js'
import { pageContext } from './src/build/context.js'
export { mediaFor }

export default defineConfig({
  appType: 'mpa',
  root: siteDir,
  publicDir: resolve(root, 'public'),
  /* หน้าใน site/ เรียก /src/... เหมือนเดิม ชี้กลับไปที่ src/ ของโปรเจกต์ */
  resolve: { alias: [{ find: /^\/src\//, replacement: resolve(root, 'src') + '/' }] },
  server: { fs: { allow: [root] } },
  plugins: [
    tailwindcss(),
    seoTags(),
    webpImages(),
    thaiLines(),
    fontPreload(),
    cssOrder(),
    ...(forWp ? [] : [seoFiles()]),
    handlebars({
      partialDirectory: resolve(root, 'src/partials'),
      context: pageContext,
      helpers,
    }),
  ],
  define: { 'import.meta.env.TD_WP': JSON.stringify(forWp) },
  build: { outDir: resolve(root, forWp ? 'dist-wp' : 'dist'), emptyOutDir: true, rollupOptions: { input } },
})
