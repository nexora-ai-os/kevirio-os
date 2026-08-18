import test from "node:test";
import assert from "node:assert/strict";
import { OWNER_AUTH_STATES, resolveOwnerAuthState } from "../../src/services/ownerAuthState.js";

const client=(data,error=null)=>({rpc:async()=>({data,error})});
test("unauthenticated is fail closed",async()=>assert.equal(await resolveOwnerAuthState(client({}),null),OWNER_AUTH_STATES.UNAUTHENTICATED));
test("active account is accepted",async()=>assert.equal(await resolveOwnerAuthState(client("ACTIVE"),{user:{id:"u"}}),OWNER_AUTH_STATES.ACTIVE));
test("suspended account is rejected",async()=>assert.equal(await resolveOwnerAuthState(client("SUSPENDED"),{user:{id:"u"}}),OWNER_AUTH_STATES.SUSPENDED));
test("member requiring consent is routed to consent",async()=>assert.equal(await resolveOwnerAuthState(client("CONSENT_REQUIRED"),{user:{id:"u"}}),OWNER_AUTH_STATES.CONSENT_REQUIRED));
