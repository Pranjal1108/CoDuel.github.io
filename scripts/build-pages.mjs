import fs from 'node:fs';
const origin = new URL(process.env.CODEDUEL_API_ORIGIN);
if (origin.protocol !== 'https:' || origin.origin !== origin.href.replace(/\/$/, '') || origin.username || origin.password) {
  throw new Error('CODEDUEL_API_ORIGIN must be an HTTPS origin.');
}
fs.mkdirSync('dist/pages', {recursive: true});
const html = fs.readFileSync('src/index.html', 'utf8').replace('<head>', '<head><meta name="duel-api" content="' + origin.origin + '">');
fs.writeFileSync('dist/pages/index.html', html);
for (const file of ['app.js', 'content.js']) fs.copyFileSync('src/' + file, 'dist/pages/' + file);
fs.copyFileSync('artifacts/code-duel-0.1.0.vsix', 'dist/pages/code-duel-0.1.0.vsix');
