import { buildCompanyCoreSnapshot } from "../domain/companyCore.js";

const SOURCES = Object.freeze({
  workspace: ["workspaces", "id,owner_id,slug,name,status,created_at,updated_at"],
  organization: ["organizations", "id,workspace_id,owner_id,name,status,lifecycle_state,default_currency,created_at,updated_at"],
  business: ["businesses", "id,workspace_id,organization_id,owner_id,name,business_type,operating_status,status,lifecycle_state,profitability_status,maturity,created_at,updated_at"],
  team: ["teams", "id,workspace_id,organization_id,business_id,name,role_scope,permissions,membership_status,status,lifecycle_state,created_at,updated_at"],
  knowledge: ["business_memory_records", "id,workspace_id,brand_id,client_id,record_type,sensitivity_level,provenance,content_json,external_output_allowed,provider_output_allowed,retention_policy,deletion_status,created_at,updated_at"],
  asset: ["reusable_business_assets", "id,workspace_id,asset_type,title,version,maturity,ownership,license_classification,internal_reuse,content_reference,created_at,updated_at,archived_at"],
  decision: ["executive_decisions", "id,workspace_id,revenue_engine_id,source_entity,source_id,status,urgency,confidence,deadline,owner_action,evidence_reference,resolved_at,created_at"],
  permission: ["workspace_members", "workspace_id,user_id,role,status,created_at"],
  capability: ["provider_capabilities", "id,workspace_id,provider,capability,request_class,required_scopes,maturity,enabled,created_at,updated_at"],
  provider: ["provider_connections", "id,workspace_id,provider,connection_type,state,provider_account_label,granted_scopes,last_checked_at,last_success_at,last_error_class,revoked_at,created_at,updated_at"],
});

const MIGRATION_016_DOMAINS = new Set(["organization","business","team"]);

function requireClient(client) {
  if (!client?.from) throw new TypeError("company_core_client_required");
}

async function selectWorkspaceRows(client, domain, workspaceId) {
  const [table, columns] = SOURCES[domain];
  let query = client.from(table).select(columns);
  query = domain === "workspace" ? query.eq("id", workspaceId) : query.eq("workspace_id", workspaceId);
  const { data, error } = await query.limit(100);
  if (error?.code === "42P01" && MIGRATION_016_DOMAINS.has(domain)) return { rows:null, unavailable:true };
  if (error) throw Object.assign(new Error("company_core_read_failed"), { cause:error, domain });
  return { rows:data || [], unavailable:false };
}

export function createCompanyCoreRepository(client) {
  requireClient(client);
  return Object.freeze({
    async readSnapshot(workspaceId) {
      if (!workspaceId) throw new TypeError("workspace_id_required");
      const entries = await Promise.all(Object.keys(SOURCES).map(async (domain) => [domain, await selectWorkspaceRows(client, domain, workspaceId)]));
      const results = Object.fromEntries(entries);
      const values = Object.fromEntries(Object.entries(results).map(([domain,result]) => [domain,result.rows]));
      const unavailableDomains = Object.freeze(Object.entries(results).filter(([,result])=>result.unavailable).map(([domain])=>domain));
      return buildCompanyCoreSnapshot({
        workspaceId,
        ...values,
        sources: Object.fromEntries(Object.entries(SOURCES).map(([domain, [table]]) => [domain, table])),
        unavailableDomains,
        migrationUnavailable: unavailableDomains.some((domain)=>MIGRATION_016_DOMAINS.has(domain)),
      });
    },
  });
}
