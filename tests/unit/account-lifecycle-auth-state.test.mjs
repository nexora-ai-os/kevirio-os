import assert from "node:assert/strict";
import test from "node:test";
import { OWNER_AUTH_STATES, resolveOwnerAuthState } from "../../src/services/ownerAuthState.js";
const session={user:{id:"user-a"}};
const clientFor=(data,error=null)=>({rpc:async(name)=>{assert.equal(name,"current_account_access_state");return{data,error}}});
test("account gate admits only server-authoritative ACTIVE",async()=>assert.equal(await resolveOwnerAuthState(clientFor("ACTIVE"),session),OWNER_AUTH_STATES.ACTIVE));
test("account gate routes incomplete lifecycle to consent",async()=>{for(const value of ["INVITED","REGISTERING","LEGAL_REVIEW_REQUIRED","CONSENT_REQUIRED"])assert.equal(await resolveOwnerAuthState(clientFor(value),session),OWNER_AUTH_STATES.CONSENT_REQUIRED)});
test("account gate blocks current suspended and deactivated state",async()=>{assert.equal(await resolveOwnerAuthState(clientFor("SUSPENDED"),session),OWNER_AUTH_STATES.SUSPENDED);assert.equal(await resolveOwnerAuthState(clientFor("DEACTIVATED"),session),OWNER_AUTH_STATES.DEACTIVATED)});
