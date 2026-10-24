import test from 'node:test';
import assert from 'node:assert/strict';
import { checkProductionConfig } from '../scripts/check-production-config';
import { readRequestJson, RequestBodyError, MAX_REQUEST_BODY_BYTES } from '../src/lib/requests/body-limit';
const config:Partial<NodeJS.ProcessEnv>={DATABASE_URL:'postgresql://test:synthetic@db.example.invalid:6543/postgres',DIRECT_URL:'postgresql://test:synthetic@db.example.invalid:5432/postgres',NEXTAUTH_URL:'https://fixtrack.example.invalid',NEXT_PUBLIC_BASE_URL:'https://fixtrack.example.invalid',NEXTAUTH_SECRET:'synthetic-local-unit-test-secret-32-characters',NEXT_PUBLIC_SUPABASE_URL:'https://test.example.invalid',NEXT_PUBLIC_SUPABASE_ANON_KEY:'synthetic-public-key',SUPABASE_SERVICE_ROLE_KEY:'synthetic-private-key',NEXT_PUBLIC_TURNSTILE_SITE_KEY:'synthetic-site-key',TURNSTILE_SECRET_KEY:'synthetic-secret-key',TURNSTILE_ALLOWED_HOSTNAMES:'fixtrack.example.invalid'};
test('production config checker accepts consistent shape without contacting services',()=>{assert.deepEqual(checkProductionConfig(config).errors,[]);});
test('production checker rejects localhost, dummy CAPTCHA, mismatched domain, public secrets and bootstrap flags',()=>{
 for(const override of [{DATABASE_URL:'postgresql://test:synthetic@127.0.0.1:54322/postgres'},{NEXTAUTH_URL:'http://localhost:3000'},{NEXT_PUBLIC_BASE_URL:'https://other.example.invalid'},{TURNSTILE_SECRET_KEY:'1x0000000000000000000000000000000AA'},{TURNSTILE_ALLOWED_HOSTNAMES:'https://fixtrack.example.invalid'},{NEXT_PUBLIC_SERVICE_ROLE_KEY:'synthetic-only'},{FIXTRACK_ALLOW_LOCAL_TESTS:'1'},{SEED_ADMIN_EMAIL:'seed@example.test'}])assert.ok(checkProductionConfig({...config,...override}).errors.length);
 assert.ok(checkProductionConfig({}).errors.length);
});
test('request JSON size bound accepts normal JSON and rejects malformed input',async()=>{
 assert.deepEqual(await readRequestJson(new Request('http://localhost',{method:'POST',body:'{"photos":[]}'})),{photos:[]});
 await assert.rejects(readRequestJson(new Request('http://localhost',{method:'POST',body:'invalid'})),(e:unknown)=>e instanceof RequestBodyError&&e.status===400);
});
test('request size guard rejects declared and actual oversized bodies without trusting Content-Length',async()=>{
 await assert.rejects(readRequestJson(new Request('http://localhost',{method:'POST',body:'{}',headers:{'content-length':String(MAX_REQUEST_BODY_BYTES+1)}})),(e:unknown)=>e instanceof RequestBodyError&&e.status===413);
 await assert.rejects(readRequestJson(new Request('http://localhost',{method:'POST',body:'x'.repeat(MAX_REQUEST_BODY_BYTES+1),headers:{'content-length':'1'}})),(e:unknown)=>e instanceof RequestBodyError&&e.status===413);
});

test('patched mailer can compose existing OTP-style mail without contacting SMTP',async()=>{
 const nodemailer=(await import('nodemailer')).default;
 const result=await nodemailer.createTransport({jsonTransport:true}).sendMail({from:'sender@example.test',to:'recipient@example.test',subject:'OTP test',html:'<p>123456</p>'});
 assert.ok(String(result.message).includes('OTP test'));
});
