const requireClient = (client) => {
  if (!client) throw new Error("supabase_client_required");
  return client;
};

const key = (prefix) => `${prefix}:${globalThis.crypto?.randomUUID?.() || Date.now()}`;

export const CANONICAL_DOMAIN_CONFIG = Object.freeze({
  GOAL: { table: "campaigns", select: "id,status,version,offer,channel,forecast_currency,forecast_revenue_minor,forecast_cost_minor,updated_at,opportunity_id,brand_id,client_id,business_mode,lane", title: (row) => row.offer?.title || row.offer?.name || row.channel || "無題の目標" },
  APPLICATION: { table: "opportunities", select: "id,title,summary,lane,status,version,provenance,freshness_at,expires_at,updated_at,brand_id,client_id", title: (row) => row.title },
  WORK: { table: "tasks", select: "id,type,status,version,due_at,input_ref,output_ref,updated_at,campaign_id,assignee_type,assignee_ref", title: (row) => row.type },
  CLIENT: { table: "clients", select: "id,display_name,status,version,confidentiality_level,metadata,business_context,updated_at", title: (row) => row.display_name },
  KNOWLEDGE: { table: "business_memory_records", select: "id,record_type,sensitivity_level,provenance,content_json,retention_policy,deletion_status,version,updated_at", title: (row) => row.content_json?.title || row.content_json?.summary || row.record_type },
  CONTENT: { table: "personal_operational_records", select: "id,title,payload,lifecycle_status,version,updated_at", recordType: "CONTENT", title: (row) => row.title },
  IMPROVEMENT: { table: "personal_operational_records", select: "id,title,payload,lifecycle_status,version,updated_at", recordType: "FEEDBACK", title: (row) => row.title },
});

export async function listCanonicalDomain(client, type, { limit = 100 } = {}) {
  const config = CANONICAL_DOMAIN_CONFIG[type];
  if (!config) throw new Error("canonical_type_invalid");
  let query = requireClient(client).from(config.table).select(config.select).order("updated_at", { ascending: false }).limit(Math.min(limit, 200));
  if (config.recordType) query = query.eq("record_type", config.recordType).neq("lifecycle_status", "ARCHIVED");
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((row) => ({ ...row, canonical_type: type, canonical_title: config.title(row) }));
}

export async function loadCanonicalDependencies(client) {
  const [brands, applications, goals, clients] = await Promise.all([
    requireClient(client).from("brand_profiles").select("id,name").order("name"),
    requireClient(client).from("opportunities").select("id,title,version,status,brand_id").order("updated_at", { ascending: false }).limit(100),
    requireClient(client).from("campaigns").select("id,channel,status,version,offer").order("updated_at", { ascending: false }).limit(100),
    requireClient(client).from("clients").select("id,display_name,status,version").order("updated_at", { ascending: false }).limit(100),
  ]);
  const failed = [brands, applications, goals, clients].find((result) => result.error);
  if (failed) throw failed.error;
  return { brands: brands.data || [], applications: applications.data || [], goals: goals.data || [], clients: clients.data || [] };
}

export async function saveCanonicalDomain(client, { type, id = null, expectedVersion = null, payload }) {
  if (["CONTENT", "IMPROVEMENT"].includes(type)) {
    const recordType = type === "CONTENT" ? "CONTENT" : "FEEDBACK";
    const { data, error } = await requireClient(client).rpc("save_personal_operational_record_v2", {
      p_record_id: id, p_record_type: recordType, p_title: payload.title,
      p_payload: payload.payload || {}, p_lifecycle_status: payload.lifecycle_status || "ACTIVE",
      p_expected_version: id ? expectedVersion : null, p_idempotency_key: key(`ui:${type.toLowerCase()}`),
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  const { data, error } = await requireClient(client).rpc("save_canonical_domain_object", {
    p_type: type, p_id: id, p_expected_version: id ? expectedVersion : null,
    p_payload: payload, p_idempotency_key: key(`ui:${type.toLowerCase()}`),
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function saveCanonicalDraft(client, { type, id, expectedDraftVersion, baseObjectVersion, payload, deviceHint }) {
  const { data, error } = await requireClient(client).rpc("save_canonical_domain_draft", {
    p_type: type, p_id: id, p_expected_draft_version: expectedDraftVersion,
    p_base_object_version: baseObjectVersion, p_payload: payload, p_device_hint: deviceHint || null,
  });
  if (error) throw error;
  return data;
}

export async function loadCanonicalDrafts(client, type) {
  const { data, error } = await requireClient(client).from("canonical_domain_drafts")
    .select("id,object_id,object_type,base_object_version,draft_version,payload,device_hint,updated_at")
    .eq("object_type", type).order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function archiveCanonicalDomain(client, { type, id, expectedVersion, row = null }) {
  if (["CONTENT", "IMPROVEMENT"].includes(type)) {
    const { data, error } = await requireClient(client).rpc("save_personal_operational_record_v2", {
      p_record_id: id, p_record_type: type === "CONTENT" ? "CONTENT" : "FEEDBACK",
      p_title: row?.title || row?.canonical_title || "Archived",
      p_payload: row?.payload || {}, p_lifecycle_status: "ARCHIVED",
      p_expected_version: expectedVersion, p_idempotency_key: key(`ui:archive:${type.toLowerCase()}`),
    });
    if (error) throw error;
    return Array.isArray(data) ? data[0] : data;
  }
  const { data, error } = await requireClient(client).rpc("archive_canonical_domain_object", {
    p_type: type, p_id: id, p_expected_version: expectedVersion,
    p_idempotency_key: key(`ui:archive:${type.toLowerCase()}`),
  });
  if (error) throw error;
  return data;
}

export async function listCanonicalTimeline(client, type, limit = 50) {
  const { data, error } = await requireClient(client).from("operational_activity_events")
    .select("id,object_type,object_id,event_type,truth_class,safe_metadata,created_at")
    .eq("object_type", type).order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data || [];
}
