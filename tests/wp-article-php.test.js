import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

// Optional local PHP-WASM runtime: no dependency download and no WordPress/DB bootstrap.
// PHP_WASM_MODULES points to an existing node_modules directory containing @php-wasm.
const runtime = process.env.PHP_WASM_MODULES
test('CMS article PHP parses and hub metadata never leaks into CMS pages', { skip: !runtime }, async () => {
  const { PHP } = await import(pathToFileURL(resolve(runtime, '@php-wasm/universal/index.js')).href)
  const { loadNodeRuntime } = await import(pathToFileURL(resolve(runtime, '@php-wasm/node/index.js')).href)
  const php = new PHP(await loadNodeRuntime('8.3', { emscriptenOptions: { processId: process.pid } }))
  try {
    for (const name of ['functions.php', 'single.php', 'category.php', 'home.php', 'templates/article-card.php', 'templates/article-archive.php']) {
      php.writeFile('/lint.php', readFileSync(new URL(`../wp-theme/teamdee/${name}`, import.meta.url)))
      const result = await php.run({ code: '<?php try { token_get_all(file_get_contents("/lint.php"), TOKEN_PARSE); echo "valid"; } catch (ParseError $e) { echo $e->getMessage(); }' })
      assert.equal(result.text, 'valid', name)
    }
    const source = readFileSync(new URL('../wp-theme/teamdee/functions.php', import.meta.url), 'utf8')
    const fn = source.slice(source.indexOf('function td_cms_asset_head('), source.indexOf("add_action('wp_head'", source.indexOf('function td_cms_asset_head(')))
    const input = `<title>Blog title</title><meta content="Wrong article" name="description"><meta name='robots' content='noindex'><meta property='og:title' content='Blog'><meta content='Blog' name='twitter:title'><link href='/blog/' rel='canonical'><script type='application/ld+json'>{"@type":"CollectionPage"}</script><meta name="theme-color" content="#FF6C00"><link rel="stylesheet" href="blog.css"><link rel="preconnect" href="https://fonts.googleapis.com"><script>window.consentMode = 'pending';</script><script type="module" src="blog.js"></script>`
    php.writeFile('/head.html', input)
    const result = await php.run({ code: `<?php ${fn}\necho td_cms_asset_head(file_get_contents('/head.html'));` })
    assert.equal(result.errors, '')
    for (const excluded of ['Blog title', 'description', 'robots', 'og:title', 'twitter:title', 'canonical', 'CollectionPage', 'application/ld+json']) assert.ok(!result.text.includes(excluded), excluded)
    for (const preserved of ['theme-color', 'blog.css', 'fonts.googleapis.com', "window.consentMode = 'pending'", 'blog.js']) assert.ok(result.text.includes(preserved), preserved)
  } finally { php.exit() }
})
