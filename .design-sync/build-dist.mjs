// Pre-build a plain-JS component "dist" for design-sync to consume.
//
// This repo is a Next.js app whose components use CSS-module SCSS
// (`import styles from "./X.module.scss"`). The design-sync converter bundles
// with esbuild and has no SCSS/CSS-modules loader (and its lib/bundle.mjs is
// off-limits to fork), so we compile the components ourselves here:
//   - esbuild bundles a barrel of the 12 components,
//   - a plugin compiles each *.module.scss via dart-sass and hands the CSS to
//     esbuild's `local-css` loader (scopes class names, emits the class map the
//     JS imports, and collects the CSS into dist/index.css),
//   - react/react-dom stay external (the converter externalizes them; lucide is
//     bundled in so icons ship).
// globals.scss (the :root token layer + resets) is compiled separately and
// prepended to dist/index.css, which design-sync points `cssEntry` at.
//
// Output: dist/index.js (plain JS, class names baked in) + dist/index.css.
// Re-run on any component/scss change before the converter.

import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath as f2p } from 'node:url';

const require = createRequire(import.meta.url);
const sass = require('sass');

const ROOT = process.cwd();
const OUT = join(ROOT, 'dist');
mkdirSync(OUT, { recursive: true });

// Barrel: every synced component, plus the FormulaProvider (a bundle export the
// FormulaPreview card wraps itself in — not a card of its own).
const BARREL = `
export { ConfigPanel } from "@/components/formula/ConfigPanel";
export { FormulaEdit } from "@/components/formula/FormulaEdit";
export { FormulaPreview } from "@/components/formula/FormulaPreview";
export { RecipeEdit } from "@/components/recipe/RecipeEdit";
export { RecipePreview } from "@/components/recipe/RecipePreview";
export { ArchetypeTile } from "@/components/shared/ArchetypeTile";
export { GramScrubField } from "@/components/shared/GramScrubField";
export { IngredientNote } from "@/components/shared/IngredientNote";
export { IngredientSelector } from "@/components/shared/IngredientSelector";
export { PintCup } from "@/components/shared/PintCup";
export { SearchModule } from "@/components/shared/SearchModule";
export { SectionHeader } from "@/components/shared/SectionHeader";
export { FormulaProvider } from "@/context/FormulaContext";
`;

const scssModules = {
  name: 'scss-modules',
  setup(b) {
    b.onLoad({ filter: /\.module\.scss$/ }, (args) => {
      const res = sass.compile(args.path, {
        loadPaths: [ROOT, join(ROOT, 'src'), join(ROOT, 'src/app')],
        style: 'expanded',
      });
      return {
        contents: res.css,
        loader: 'local-css',
        watchFiles: res.loadedUrls.map((u) => f2p(u)),
      };
    });
  },
};

const result = await build({
  stdin: { contents: BARREL, resolveDir: ROOT, loader: 'ts', sourcefile: 'ds-barrel.ts' },
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  tsconfig: join(ROOT, 'tsconfig.json'),
  outfile: join(OUT, 'index.js'),
  loader: { '.svg': 'dataurl', '.png': 'dataurl', '.woff': 'dataurl', '.woff2': 'dataurl' },
  plugins: [scssModules],
  define: { 'process.env.NODE_ENV': '"development"' },
  logLevel: 'info',
});
if (result.errors?.length) { console.error(result.errors); process.exit(1); }

// Prepend the compiled global token layer (globals.scss :root + resets) so
// tokens are defined ahead of the scoped component rules.
const tokens = sass.compile(join(ROOT, 'src/app/globals.scss'), { style: 'expanded' }).css;
const cssPath = join(OUT, 'index.css');
const componentCss = readFileSync(cssPath, 'utf8');
// Define --font-bricolage (the app injects it at runtime via next/font; without
// it, --font-display's var() is invalid and everything falls back to serif).
// The @font-face that actually loads the face ships via cfg.extraFonts.
const fontVar = ':root { --font-bricolage: "Bricolage Grotesque"; }\n';
writeFileSync(cssPath, `/* tokens + resets (globals.scss) */\n${tokens}\n${fontVar}\n/* component styles */\n${componentCss}`);

console.log('dist/index.js + dist/index.css written');

// ── Declaration tree (dist/types/) ────────────────────────────────────────
// design-sync extracts each component's <Name>Props from the shipped .d.ts
// tree (findTypesRoot picks up dist/types/), not from src. So emit a real
// declaration tree via tsc, then rewrite the "@/…" path-alias imports to
// relative — design-sync's ts-morph project has no `paths` config, so only
// on-disk relative imports resolve (otherwise domain types like Recipe /
// MacroRatios collapse to `any` and the prop bodies come out empty).
const TYPES = join(OUT, 'types');
rmSync(TYPES, { recursive: true, force: true });
execFileSync(
  join(ROOT, 'node_modules/.bin/tsc'),
  ['-p', join(ROOT, '.design-sync/tsconfig.dts.json')],
  { stdio: 'inherit', cwd: ROOT },
);

// Rewrite @/foo → correct relative path (rootDir=src ⇒ @/foo lands at dist/types/foo).
const walk = (dir) => {
  const out = [];
  for (const e of require('node:fs').readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.name.endsWith('.d.ts')) out.push(p);
  }
  return out;
};
let rewrites = 0;
for (const file of walk(TYPES)) {
  const src = readFileSync(file, 'utf8');
  let rel = relative(dirname(file), TYPES).split('\\').join('/');
  if (!rel) rel = '.';
  const next = src.replace(/(['"])@\/([^'"]+)\1/g, (_m, q, rest) => `${q}${rel}/${rest}${q}`);
  if (next !== src) { writeFileSync(file, next); rewrites++; }
}
console.log(`dist/types: ${walk(TYPES).length} .d.ts (${rewrites} alias-rewritten)`);
