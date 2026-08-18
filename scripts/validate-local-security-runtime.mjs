import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const url=process.env.LOCAL_SUPABASE_URL;
const anonKey=process.env.LOCAL_SUPABASE_ANON_KEY;
const serviceKey=process.env.LOCAL_SUPABASE_SERVICE_KEY;
assert.ok(url?.startsWith("http://127.0.0.1:"),"local Supabase URL required");
assert.ok(anonKey&&serviceKey,"local Supabase keys required");

const options={auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}};
const admin=createClient(url,serviceKey,options);
const emails={owner:"phase16-owner@local.test",a:"phase16-a@local.test",b:"phase16-b@local.test",c:"phase16-c@local.test"};
const password="Local-only-Phase16!2026";
const checks=[];
const pass=(name,actor,expected,actual)=>{checks.push({name,actor,expected,actual,status:"PASS"});};
const expectNoError=(result,label)=>assert.equal(result.error,null,`${label}: ${result.error?.message}`);
const uuid=(value)=>{assert.match(value,/^[0-9a-f-]{36}$/i);return value};
const localSql=(sql)=>execFileSync("docker",["exec","-i","supabase_db_kevirio-os","psql","-v","ON_ERROR_STOP=1","-U","postgres","-d","postgres","-c",sql],{stdio:"pipe",encoding:"utf8"});

async function recreateUser(email){
  const listed=await admin.auth.admin.listUsers({page:1,perPage:1000});
  expectNoError(listed,"list local users");
  const old=listed.data.users.find(user=>user.email===email);
  if(old) expectNoError(await admin.auth.admin.deleteUser(old.id),`delete ${email}`);
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true});
  expectNoError(created,`create ${email}`);
  const client=createClient(url,anonKey,options);
  const signed=await client.auth.signInWithPassword({email,password});
  expectNoError(signed,`sign in ${email}`);
  assert.ok(signed.data.session?.access_token,`JWT missing for ${email}`);
  return {id:created.data.user.id,client};
}

const users={};
for(const [key,email] of Object.entries(emails)) users[key]=await recreateUser(email);
pass("actual Supabase JWT sessions","OWNER/A/B/C","authenticated","authenticated");

const workspaceA=crypto.randomUUID(),workspaceB=crypto.randomUUID();
localSql(`insert into public.owner_profiles(owner_id,role,status) values ('${uuid(users.owner.id)}','owner','active');
insert into public.workspaces(id,owner_id,slug,name) values
('${uuid(workspaceA)}','${uuid(users.owner.id)}','phase16-a','Phase 1.6 A'),
('${uuid(workspaceB)}','${uuid(users.owner.id)}','phase16-b','Phase 1.6 B');
insert into public.workspace_members(workspace_id,user_id,role,status) values
('${workspaceA}','${uuid(users.owner.id)}','owner','active'),
('${workspaceA}','${uuid(users.a.id)}','member','active'),
('${workspaceA}','${uuid(users.b.id)}','member','active'),
('${workspaceA}','${uuid(users.c.id)}','member','active'),
('${workspaceB}','${uuid(users.b.id)}','member','active');`);
pass("least-privilege fixture setup","LOCAL_POSTGRES_ADMIN","service_role writes not required","local admin only");

const hash=(char)=>char.repeat(64);
const docs=[
  {id:crypto.randomUUID(),document_type:"TERMS",document_version:"TERMS_1.0",lifecycle_status:"ACTIVE",mandatory:true,content_hash:hash("1"),content_reference:"local://terms/1.0"},
  {id:crypto.randomUUID(),document_type:"PRIVACY",document_version:"PRIVACY_1.0",lifecycle_status:"ACTIVE",mandatory:true,content_hash:hash("2"),content_reference:"local://privacy/1.0"},
  {id:crypto.randomUUID(),document_type:"AI_NOTICE",document_version:"AI_NOTICE_1.0",lifecycle_status:"ACTIVE",mandatory:true,content_hash:hash("3"),content_reference:"local://ai/1.0"},
  {id:crypto.randomUUID(),document_type:"EXTERNAL_SERVICES_NOTICE",document_version:"EXTERNAL_SERVICES_NOTICE_1.0",lifecycle_status:"ACTIVE",mandatory:true,content_hash:hash("4"),content_reference:"local://external/1.0"},
];
const draft={id:crypto.randomUUID(),document_type:"ADDITIONAL_CONSENT",document_version:"ADDITIONAL_CONSENT_1.0",lifecycle_status:"DRAFT",mandatory:false,content_hash:hash("5"),content_reference:"local://draft/1.0"};
expectNoError(await admin.from("legal_documents").insert([...docs,draft]),"legal documents");
expectNoError(await admin.from("user_account_states").insert(Object.values(users).map(user=>({user_id:user.id,lifecycle_state:"CONSENT_REQUIRED"}))),"initial account states");
const acceptance=(document)=>({documentId:document.id,documentVersion:document.document_version,policyHash:document.content_hash,accepted:true});
const all=docs.map(acceptance);

const anonymous=createClient(url,anonKey,options);
assert.ok((await anonymous.rpc("accept_required_legal_documents",{p_acceptances:all,p_workspace_id:workspaceA,p_technical_evidence:{method:"local-runtime"}})).error);
pass("unauthenticated consent spoof","ANON","DENY","DENY");

const invalid=all.map((item,index)=>index?item:{...item,documentVersion:"TERMS_9.9"});
assert.ok((await users.a.client.rpc("accept_required_legal_documents",{p_acceptances:invalid,p_workspace_id:workspaceA,p_technical_evidence:{method:"local-runtime"}})).error);
assert.equal((await admin.from("user_consent_records").select("id",{count:"exact",head:true}).eq("user_id",users.a.id)).count,0);
pass("invalid version is atomic","MEMBER_A","DENY/0 rows","DENY/0 rows");

const partial=await users.a.client.rpc("accept_required_legal_documents",{p_acceptances:[all[0]],p_workspace_id:workspaceA,p_technical_evidence:{method:"local-runtime"}});
assert.ok(partial.error);
assert.equal((await users.a.client.rpc("current_account_access_state")).data,"CONSENT_REQUIRED");
pass("partial mandatory consent","MEMBER_A","ACTIVE DENY","ACTIVE DENY");

const draftAttempt=all.map((item,index)=>index?item:acceptance(draft));
assert.ok((await users.a.client.rpc("accept_required_legal_documents",{p_acceptances:draftAttempt,p_workspace_id:workspaceA,p_technical_evidence:{method:"local-runtime"}})).error);
pass("DRAFT acceptance","MEMBER_A","DENY","DENY");

for(const key of ["owner","a","b","c"]){
  const result=await users[key].client.rpc("accept_required_legal_documents",{p_acceptances:all,p_workspace_id:workspaceA,p_technical_evidence:{method:"local-runtime"}});
  expectNoError(result,`accept all ${key}`);
  assert.equal(result.data.status,"ACTIVE");
}
pass("all mandatory consent and lifecycle","OWNER/A/B/C","ACTIVE","ACTIVE");

const duplicate=await users.a.client.rpc("accept_required_legal_documents",{p_acceptances:all,p_workspace_id:workspaceA,p_technical_evidence:{method:"local-runtime"}});
expectNoError(duplicate,"duplicate acceptance");
assert.equal(duplicate.data.acceptedCount,0);
assert.equal((await admin.from("user_consent_records").select("id",{count:"exact",head:true}).eq("user_id",users.a.id)).count,4);
pass("duplicate acceptance","MEMBER_A","idempotent/4 rows","idempotent/4 rows");

const directSpoof=await users.a.client.from("user_consent_records").insert({user_id:users.b.id,legal_document_id:docs[0].id,document_type:"TERMS",document_version:"TERMS_1.0",policy_hash:hash("1"),consent_method:"AFFIRMATIVE_CHECKBOX"});
assert.ok(directSpoof.error);
pass("cross-user consent spoof","MEMBER_A -> MEMBER_B","DENY","DENY");

const save=async(client,type,title,payload,id=null,status="DRAFT")=>{
  const result=await client.rpc("save_personal_operational_record",{p_workspace_id:workspaceA,p_record_id:id,p_record_type:type,p_title:title,p_payload:payload,p_lifecycle_status:status});
  expectNoError(result,`save ${type}`); return result.data;
};
const contentA=await save(users.a.client,"CONTENT","Private Threads",{platform:"Threads",content_type:"SNS_POST",purpose:"認知",body:null,status:"DRAFT"});
const opportunityA=await save(users.a.client,"OPPORTUNITY","CrowdWorks local",{platform:"CROWDWORKS",url:"https://example.invalid/job",description:"local runtime",compensation_state:"UNKNOWN",compensation_value:null,deadline:null,status:"SAVED"});
const feedbackA=await save(users.a.client,"FEEDBACK","Private feedback",{category:"使いにくい",message:"local runtime",desired_outcome:"clear",route:"/home",status:"OPEN"});
const contentB=await save(users.b.client,"CONTENT","B private",{platform:"Threads",body:"private"});

const visibleIds=async(client)=>{const result=await client.from("personal_operational_records").select("id");expectNoError(result,"select personal records");return result.data.map(row=>row.id)};
assert.ok((await anonymous.rpc("save_personal_operational_record",{p_workspace_id:workspaceA,p_record_id:null,p_record_type:"CONTENT",p_title:"anon",p_payload:{},p_lifecycle_status:"DRAFT"})).error);
assert.ok((await users.b.client.rpc("save_personal_operational_record",{p_workspace_id:workspaceA,p_record_id:contentA,p_record_type:"CONTENT",p_title:"spoof",p_payload:{},p_lifecycle_status:"DRAFT"})).error);
assert.ok((await users.b.client.rpc("set_personal_record_sharing",{p_record_id:contentA,p_visibility:"PRIVATE",p_grantee_user_ids:[],p_team_id:null})).error);
assert.equal((await users.b.client.rpc("has_current_required_consents",{p_user_id:users.a.id})).data,false);
assert.equal((await users.b.client.rpc("can_read_personal_record",{p_record_id:contentA,p_user_id:users.a.id})).data,false);
pass("protected RPC identity and ownership","ANON/MEMBER_B","DENY","DENY");
assert.ok((await visibleIds(users.a.client)).includes(contentA));
for(const key of ["b","c","owner"]){assert.ok(!(await visibleIds(users[key].client)).includes(contentA));}
assert.ok(!(await visibleIds(users.a.client)).includes(contentB));
pass("PRIVATE RLS","A/B/C/OWNER","owner only","owner only");

expectNoError(await users.a.client.rpc("set_personal_record_sharing",{p_record_id:contentA,p_visibility:"EXPLICIT_SHARED",p_grantee_user_ids:[users.b.id],p_team_id:null}),"share content A");
assert.ok((await visibleIds(users.b.client)).includes(contentA));
assert.ok(!(await visibleIds(users.c.client)).includes(contentA));
assert.ok(!(await visibleIds(users.owner.client)).includes(contentA));
pass("EXPLICIT_SHARED RLS","A -> B","B READ; C/OWNER DENY","B READ; C/OWNER DENY");

const h=hash("a"),organizationId=crypto.randomUUID(),teamId=crypto.randomUUID();
expectNoError(await admin.from("organizations").insert({id:organizationId,workspace_id:workspaceA,owner_id:users.owner.id,name:"Local Org",slug:"local-org",idempotency_key:"phase16-org",request_hash:h}),"organization");
expectNoError(await admin.from("organization_workspaces").insert({organization_id:organizationId,workspace_id:workspaceA,relationship_type:"home"}),"organization workspace");
expectNoError(await admin.from("teams").insert({id:teamId,workspace_id:workspaceA,organization_id:organizationId,name:"Local Team",idempotency_key:"phase16-team",request_hash:h}),"team");
expectNoError(await admin.from("team_memberships").insert([
  {workspace_id:workspaceA,team_id:teamId,user_id:users.a.id,role:"member",status:"active"},
  {workspace_id:workspaceA,team_id:teamId,user_id:users.b.id,role:"member",status:"active"},
]),"team memberships");
const teamContent=await save(users.a.client,"CONTENT","Team content",{body:"team"});
expectNoError(await users.a.client.rpc("set_personal_record_sharing",{p_record_id:teamContent,p_visibility:"TEAM",p_grantee_user_ids:[],p_team_id:teamId}),"team share");
assert.ok((await visibleIds(users.b.client)).includes(teamContent));
assert.ok(!(await visibleIds(users.c.client)).includes(teamContent));
pass("TEAM RLS","A/B/C","A/B READ; C DENY","A/B READ; C DENY");
expectNoError(await admin.from("team_memberships").update({status:"inactive"}).eq("team_id",teamId).eq("user_id",users.b.id),"remove B from team");
assert.ok(!(await visibleIds(users.b.client)).includes(teamContent));
pass("removed team member","MEMBER_B","TEAM READ DENY","TEAM READ DENY");

const crossB=await users.b.client.rpc("save_personal_operational_record",{p_workspace_id:workspaceB,p_record_id:null,p_record_type:"CONTENT",p_title:"Workspace B",p_payload:{body:"B"},p_lifecycle_status:"DRAFT"});
expectNoError(crossB,"B workspace B save");
assert.ok(!(await visibleIds(users.a.client)).includes(crossB.data));
pass("cross-workspace RLS","MEMBER_A -> WORKSPACE_B","DENY","DENY");

for(const status of ["EVALUATING","APPLYING","APPLIED","WON","ARCHIVED"]){
  await save(users.a.client,"OPPORTUNITY","CrowdWorks local",{platform:"CROWDWORKS",status},opportunityA,"ACTIVE");
}
const opportunity=await users.a.client.from("personal_operational_records").select("payload").eq("id",opportunityA).single();
expectNoError(opportunity,"opportunity reload"); assert.equal(opportunity.data.payload.status,"ARCHIVED");
pass("opportunity transitions","MEMBER_A","SAVED->...->ARCHIVED","ARCHIVED");

const ownerPrivate=await visibleIds(users.owner.client);
assert.ok(!ownerPrivate.includes(opportunityA)&&!ownerPrivate.includes(feedbackA));
const servicePrivate=await admin.from("personal_operational_records").select("id").eq("id",contentA).single();
expectNoError(servicePrivate,"service role private read");
pass("Owner vs service role","OWNER/SERVICE_ROLE","OWNER DENY; service technical read","OWNER DENY; service technical read");

const beforeConsent=(await admin.from("user_consent_records").select("id",{count:"exact",head:true}).eq("user_id",users.a.id)).count;
assert.ok((await users.a.client.from("user_consent_records").update({accepted_at:new Date(0).toISOString()}).eq("user_id",users.a.id)).error);
assert.ok((await users.a.client.from("user_consent_records").delete().eq("user_id",users.a.id)).error);
assert.equal((await admin.from("user_consent_records").select("id",{count:"exact",head:true}).eq("user_id",users.a.id)).count,beforeConsent);
pass("append-only consent","MEMBER_A","UPDATE/DELETE DENY","UPDATE/DELETE DENY");

for(const [state,expected] of [["INVITED","CONSENT_REQUIRED"],["REGISTERING","CONSENT_REQUIRED"],["SUSPENDED","SUSPENDED"]]){
  expectNoError(await admin.from("user_account_states").update({lifecycle_state:state,suspended_at:state==="SUSPENDED"?new Date().toISOString():null}).eq("user_id",users.c.id),`set C ${state}`);
  assert.equal((await users.c.client.rpc("current_account_access_state")).data,expected);
  assert.equal((await visibleIds(users.c.client)).length,0);
}
expectNoError(await admin.from("user_account_states").update({lifecycle_state:"ACTIVE",suspended_at:null}).eq("user_id",users.c.id),"restore C active");
pass("account lifecycle deny states","MEMBER_C","INVITED/REGISTERING/SUSPENDED DENY","DENY");

expectNoError(await admin.from("user_account_states").update({lifecycle_state:"DEACTIVATED",deactivated_at:new Date().toISOString()}).eq("user_id",users.b.id),"deactivate B");
assert.equal((await users.b.client.rpc("current_account_access_state")).data,"DEACTIVATED");
assert.ok(!(await visibleIds(users.b.client)).includes(contentA));
const sharesB=await users.b.client.from("personal_record_shares").select("record_id");expectNoError(sharesB,"deactivated share read");assert.equal(sharesB.data.length,0);
assert.equal((await admin.from("user_consent_records").select("id",{count:"exact",head:true}).eq("user_id",users.b.id)).count,4);
pass("deactivated account","MEMBER_B","records/shares DENY; consent retained","records/shares DENY; consent retained");

expectNoError(await admin.from("legal_documents").update({lifecycle_status:"SUPERSEDED"}).eq("id",docs[1].id),"supersede privacy v1");
const privacyV2={id:crypto.randomUUID(),document_type:"PRIVACY",document_version:"PRIVACY_2.0",lifecycle_status:"RECONSENT_REQUIRED",mandatory:true,material_revision:true,content_hash:hash("6"),content_reference:"local://privacy/2.0"};
expectNoError(await admin.from("legal_documents").insert(privacyV2),"privacy v2");
assert.equal((await users.a.client.rpc("current_account_access_state")).data,"CONSENT_REQUIRED");
assert.ok(!(await visibleIds(users.a.client)).includes(contentA));
const currentDocs=[docs[0],privacyV2,docs[2],docs[3]];
assert.ok((await users.a.client.rpc("accept_required_legal_documents",{p_acceptances:all,p_workspace_id:workspaceA,p_technical_evidence:{method:"superseded-attempt"}})).error);
pass("superseded version is not current","MEMBER_A","DENY","DENY");
expectNoError(await users.a.client.rpc("accept_required_legal_documents",{p_acceptances:currentDocs.map(acceptance),p_workspace_id:workspaceA,p_technical_evidence:{method:"local-reconsent"}}),"reconsent A");
assert.equal((await users.a.client.rpc("current_account_access_state")).data,"ACTIVE");
const history=await admin.from("user_consent_records").select("document_version").eq("user_id",users.a.id).order("accepted_at");expectNoError(history,"consent history");
assert.ok(history.data.some(row=>row.document_version==="PRIVACY_1.0")&&history.data.some(row=>row.document_version==="PRIVACY_2.0"));
pass("material reconsent","MEMBER_A","block then restore; v1+v2 retained","block then restore; v1+v2 retained");

assert.ok((await visibleIds(users.a.client)).includes(contentA));
assert.ok(!(await visibleIds(users.c.client)).includes(contentA));
pass("AI privacy data contract","A/C","own/shared only; other private empty","own/shared only; other private empty");

console.log(JSON.stringify({summary:{passed:checks.length,failed:0},checks},null,2));
