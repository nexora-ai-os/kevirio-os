import test from "node:test";
import assert from "node:assert/strict";
import { OWNER_AUTH_STATES, resolveOwnerAuthState } from "../../src/services/ownerAuthState.js";

const client=(data,error=null)=>({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data,error})})})})});
test("unauthenticated is fail closed",async()=>assert.equal(await resolveOwnerAuthState(client({}),null),OWNER_AUTH_STATES.UNAUTHENTICATED));
test("active owner is accepted",async()=>assert.equal(await resolveOwnerAuthState(client({role:"owner",status:"active"}),{user:{id:"u"}}),OWNER_AUTH_STATES.ACTIVE));
test("inactive owner is rejected",async()=>assert.equal(await resolveOwnerAuthState(client({role:"owner",status:"disabled"}),{user:{id:"u"}}),OWNER_AUTH_STATES.INACTIVE));
test("non-owner is rejected",async()=>assert.equal(await resolveOwnerAuthState(client({role:"member",status:"active"}),{user:{id:"u"}}),OWNER_AUTH_STATES.NOT_OWNER));
