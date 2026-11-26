import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const content=stripTypeScriptTypes(fs.readFileSync('app/content.ts','utf8'));
fs.writeFileSync('src/content.js',content);
let api=stripTypeScriptTypes(fs.readFileSync('app/api/duel/route.ts','utf8')).replace("import { env } from 'cloudflare:workers';",'').replace("import { challenge } from '../../content';",'');
api=api.replace('POST(req)', 'POST(req, env)').replace('GET(req)', 'GET(req, env)');
fs.writeFileSync('src/api.js',"import { challenge } from './content.js';\n"+api);
