// Bundles the extension into dist/extension.js for both dev and packaged builds.
const esbuild = require('esbuild');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

async function main() {
  const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/extension.js',
    // pdfkit reads its .afm font metrics from disk relative to its own
    // module folder at runtime; bundling it would break that lookup, so it
    // (and its svg-to-pdfkit companion) stay external and are required
    // from node_modules instead.
    external: ['vscode', 'pdfkit', 'svg-to-pdfkit'],
    logLevel: 'info',
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
