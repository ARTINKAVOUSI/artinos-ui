import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
const require = createRequire(realpathSync(new URL('../showcase/node_modules/vite/package.json', import.meta.url)));
const { build } = require('esbuild');
const result = await build({ stdin: { contents: "export {createInspectorStore} from './src/inspector/store'; export {ParamSection} from './src/dock/params';", resolveDir: fileURLToPath(new URL('..', import.meta.url)), loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'esm', jsx: 'automatic', nodePaths: [fileURLToPath(new URL('../showcase/node_modules', import.meta.url))] });
const { createInspectorStore, ParamSection } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
const params = [
 { key:'normal', group:'g', label:'Normal', kind:'number', default:1, min:0, max:10, step:1 },
 { key:'advanced', group:'g', label:'Advanced', kind:'number', default:2, min:0, max:10, step:1, advanced:true },
 { key:'conditional', group:'g', label:'Conditional', kind:'text', default:'a', when:{key:'normal',is:0} },
];
test('undefined initial and patch values preserve defaults and stable snapshots', () => {
 const store=createInspectorStore(params,{normal:undefined});
 const before=store.get(); let calls=0; const unsubscribe=store.subscribe(()=>calls++);
 store.patch({normal:undefined}); assert.equal(store.get(),before); assert.equal(before.normal,1);
 store.patch({normal:3,advanced:4}); assert.equal(calls,1); assert.equal(before.normal,1);
 store.reset(); assert.equal(store.get().normal,1); assert.equal(store.get().advanced,2);
 unsubscribe(); store.set('normal',5); assert.equal(calls,2);
});
test('group reset includes search, advanced and conditionally filtered edits', () => {
 const store=createInspectorStore(params,{normal:3,advanced:4,conditional:'b'});
 const section=ParamSection({group:{id:'g',title:'Group'},params,values:store.get(),onChange:store.set,visibleKeys:['normal']});
 assert.equal(section.props.count,1); assert.equal(section.props.modified,true);
 section.props.onReset(); assert.deepEqual(store.get(),{normal:1,advanced:2,conditional:'a'});
});
test('sections fold without persistence and honor initial open state', () => {
 const section=ParamSection({group:{id:'g',title:'Group'},params,values:createInspectorStore(params).get(),onChange:()=>{}});
 assert.equal(section.props.collapsible,true); assert.equal(section.props.defaultOpen,false); assert.equal(section.props.storageKey,undefined);
});

