import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const {createAccessSessions}=createRequire(import.meta.url)('../apps/sistema-og/server-access-session.cjs');
const dataDir=mkdtempSync(path.join(tmpdir(),'og-session-test-'));
let clock=1000000;
const config={dataDir,secret:'artificial-test-secret-not-a-real-credential',pin:'123456',now:()=>clock};
try {
 let api=createAccessSessions(config);
 assert.equal(api.issue('wrong',true),null);
 const cookie=api.issue(config.pin,true);
 assert.match(cookie,/HttpOnly; Secure; SameSite=Strict; Max-Age=2592000/);
 assert.ok(!cookie.includes(config.pin));
 const request={headers:{cookie:cookie.split(';')[0],host:'pilot.example',origin:'https://pilot.example'},socket:{remoteAddress:'127.0.0.1'}};
 assert.ok(api.authorized(request));
 assert.ok(api.sameOrigin(request));assert.ok(!api.sameOrigin({...request,headers:{...request.headers,origin:'https://evil.example'}}));
 assert.ok(!api.authorized({...request,headers:{cookie:request.headers.cookie+'x'}}));
 assert.ok(!readFileSync(path.join(dataDir,'access-sessions.json'),'utf8').includes(config.pin));
 api=createAccessSessions(config);assert.ok(api.authorized(request),'restart uses persisted session');
 assert.ok(!createAccessSessions({...config,secret:'another-artificial-test-secret'}).authorized(request));
 api.revoke(request);assert.ok(!api.authorized(request),'logout revokes captured cookie');
 const sessionCookie=api.issue(config.pin,false);assert.ok(!sessionCookie.includes('Max-Age'));
 const expire={...request,headers:{cookie:api.issue(config.pin,true).split(';')[0]}};
 clock+=30*86400*1000;assert.ok(!api.authorized(expire));
 for(let i=0;i<8;i++)assert.ok(api.allowLogin(request));assert.ok(!api.allowLogin(request));clock+=60001;assert.ok(api.allowLogin(request));
 console.log('Access sessions: PIN/flags/tamper/expiry/origin/rate-limit/restart/logout/no raw PIN PASS');
} finally {rmSync(dataDir,{recursive:true,force:true});}
