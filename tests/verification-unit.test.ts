import test from 'node:test';
import assert from 'node:assert/strict';
import { verificationId, verificationInput, VerificationError } from '../src/lib/verification/validation';
test('verification accepts only bounded account identifiers and exact actions',()=>{
  for(const id of ['legacy-user','cm01234','550e8400-e29b-41d4-a716-446655440000'])assert.equal(verificationId(id),id);
  for(const id of ['',null,'../user','a b','a'.repeat(129)])assert.throws(()=>verificationId(id),VerificationError);
  for(const body of [null,[],{action:['APPROVE']},{action:'ACTIVATE'},{action:'APPROVE',role:'ADMIN'},{action:'APPROVE',accountStatus:'ACTIVE'}])assert.throws(()=>verificationInput(body),VerificationError);
  assert.deepEqual(verificationInput({action:'APPROVE'}),{action:'APPROVE',reason:''});
});
test('rejection reason is optional, bounded, trimmed and never accepted as approval notes',()=>{
  assert.deepEqual(verificationInput({action:'REJECT',reason:'  Please submit a clear ID.  '}),{action:'REJECT',reason:'Please submit a clear ID.'});
  assert.equal(verificationInput({action:'REJECT'}).reason,'');
  assert.equal(verificationInput({action:'REJECT',reason:'a'.repeat(300)}).reason.length,300);
  for(const body of [{action:'REJECT',reason:'a'.repeat(301)},{action:'REJECT',reason:3},{action:'REJECT',reason:'bad\0text'},{action:'APPROVE',reason:'internal note'}])assert.throws(()=>verificationInput(body),VerificationError);
});
