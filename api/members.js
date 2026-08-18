import { createSupabaseServerClient } from "../server/supabaseServerClient.js";
import { resolveVerifiedOwnerContext } from "../server/verifiedOwnerContext.js";

const blocked=(reasonCode)=>({ok:false,status:"blocked",reasonCode});
const allowedActions=new Set(["inspect","invite","suspend","reactivate","deactivate"]);
async function audit(client,actorId,targetId,workspaceId,action,outcome,reasonCode){await client.rpc("record_member_administration_event",{p_actor_user_id:actorId,p_target_user_id:targetId,p_workspace_id:workspaceId||null,p_action:action,p_outcome:outcome,p_reason_code:reasonCode})}

export default async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json(blocked("METHOD_NOT_ALLOWED"));
  const body=req.body&&typeof req.body==="object"&&!Array.isArray(req.body)?req.body:{};
  if(!allowedActions.has(body.action))return res.status(400).json(blocked("MEMBER_ACTION_INVALID"));
  const client=createSupabaseServerClient();const verified=await resolveVerifiedOwnerContext(req,{client});
  if(!verified.ok)return res.status(403).json(blocked(verified.reasonCode));
  const actorId=verified.context.ownerId;
  if(body.action==="inspect"){
    const listed=await client.auth.admin.listUsers({page:1,perPage:1000});if(listed.error)return res.status(503).json(blocked("MEMBER_DIRECTORY_UNAVAILABLE"));
    const ids=listed.data.users.map(user=>user.id);const [states,mappings,memberships,profiles]=await Promise.all([
      client.from("user_account_states").select("user_id,lifecycle_state,created_at,updated_at").in("user_id",ids),
      client.from("account_personal_workspaces").select("user_id,workspace_id").in("user_id",ids),
      client.from("workspace_members").select("user_id,workspace_id,role,status").in("user_id",ids),
      client.from("owner_profiles").select("owner_id,role,status").in("owner_id",ids),
    ]);if(states.error||mappings.error||memberships.error)return res.status(503).json(blocked("MEMBER_DIRECTORY_UNAVAILABLE"));
    return res.status(200).json({ok:true,members:listed.data.users.map(user=>({id:user.id,email:user.email||null,role:profiles.data?.find(row=>row.owner_id===user.id&&row.role==="owner"&&row.status==="active")?"owner":"member",invitationState:user.last_sign_in_at?"ACCEPTED":user.invited_at?"INVITED":"REGISTERED",accountState:states.data.find(row=>row.user_id===user.id)?.lifecycle_state||"REGISTERING",personalWorkspaceId:mappings.data.find(row=>row.user_id===user.id)?.workspace_id||null,memberships:memberships.data.filter(row=>row.user_id===user.id).map(({workspace_id,role,status})=>({workspaceId:workspace_id,role,status}))}))});
  }
  if(body.action==="invite"){
    const email=String(body.email||"").trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return res.status(400).json(blocked("MEMBER_EMAIL_INVALID"));
    const origin=String(process.env.KEVIRIO_ALLOWED_ORIGIN||"").replace(/\/$/,"");
    let invited=await client.auth.admin.inviteUserByEmail(email,origin?{redirectTo:`${origin}/home`}:undefined);
    if((invited.error||!invited.data?.user?.id)&&/^http:\/\/127\.0\.0\.1(?::\d+)?$/.test(origin))invited=await client.auth.admin.generateLink({type:"invite",email,options:{redirectTo:`${origin}/home`}});
    if(invited.error||!invited.data?.user?.id)return res.status(409).json(blocked("MEMBER_INVITATION_FAILED"));const targetId=invited.data.user.id;
    const state=await client.from("user_account_states").upsert({user_id:targetId,lifecycle_state:"INVITED"},{onConflict:"user_id"});
    const workspace=await client.rpc("bootstrap_personal_workspace_for_user",{p_user_id:targetId,p_name:"Personal Workspace"});
    if(state.error||workspace.error){await audit(client,actorId,targetId,null,"INVITED","FAILED","MEMBER_BOOTSTRAP_FAILED");return res.status(503).json(blocked("MEMBER_BOOTSTRAP_FAILED"))}
    await audit(client,actorId,targetId,workspace.data,"INVITED","SUCCEEDED","MEMBER_INVITED");return res.status(200).json({ok:true,targetUserId:targetId,status:"INVITED"});
  }
  const targetId=String(body.targetUserId||"");if(!/^[0-9a-f-]{36}$/i.test(targetId)||targetId===actorId)return res.status(400).json(blocked("MEMBER_TARGET_INVALID"));
  const mapping=await client.from("account_personal_workspaces").select("workspace_id").eq("user_id",targetId).maybeSingle();if(mapping.error||!mapping.data)return res.status(404).json(blocked("MEMBER_NOT_FOUND"));
  const transition={suspend:{lifecycle_state:"SUSPENDED",suspended_at:new Date().toISOString()},reactivate:{lifecycle_state:"CONSENT_REQUIRED",suspended_at:null,deactivated_at:null},deactivate:{lifecycle_state:"DEACTIVATED",deactivated_at:new Date().toISOString()}}[body.action];
  const updated=await client.from("user_account_states").update({...transition,updated_at:new Date().toISOString()}).eq("user_id",targetId);const action={suspend:"SUSPENDED",reactivate:"REACTIVATED",deactivate:"DEACTIVATED"}[body.action];
  if(updated.error){await audit(client,actorId,targetId,mapping.data.workspace_id,action,"FAILED","MEMBER_STATE_UPDATE_FAILED");return res.status(503).json(blocked("MEMBER_STATE_UPDATE_FAILED"))}
  await audit(client,actorId,targetId,mapping.data.workspace_id,action,"SUCCEEDED",`MEMBER_${action}`);return res.status(200).json({ok:true,targetUserId:targetId,status:transition.lifecycle_state});
}
