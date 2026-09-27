import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {resolvePublicPath} from '../server/static-path.mjs';

test('extensionless standalone module routes to its own index, not the Academy shell',()=>{
 const root=path.resolve('public');
 const result=resolvePublicPath(root,'/trainer-activities/',null,file=>file===path.join(root,'trainer-activities','index.html'));
 assert.equal(result.file,path.join(root,'trainer-activities','index.html'));
});

test('unknown extensionless routes retain the Academy single-page fallback',()=>{
 const root=path.resolve('public');
 const result=resolvePublicPath(root,'/batches/43',null,()=>false);
 assert.equal(result.file,path.join(root,'index.html'));
});

test('public path resolution refuses traversal outside the static root',()=>{
 const result=resolvePublicPath(path.resolve('public'),'/../../outside.txt');
 assert.equal(result.status,403);
});
