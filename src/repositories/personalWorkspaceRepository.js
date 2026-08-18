const requireClient = (client) => {
  if (!client) throw new Error("supabase_client_required");
  return client;
};

export async function resolvePersonalWorkspace(client, expectedUserId = null) {
  const auth = await requireClient(client).auth.getUser();
  if (auth.error || !auth.data?.user?.id) throw new Error("authenticated_user_required");
  const userId = auth.data.user.id;
  if (expectedUserId && expectedUserId !== userId) throw new Error("authenticated_user_mismatch");
  const { data, error } = await requireClient(client).rpc("resolve_personal_workspace");
  if (error) throw error;
  if (!data) throw new Error("personal_workspace_required");
  return data;
}

export async function bootstrapPersonalWorkspace(client, { name = "Personal Workspace" } = {}) {
  const auth = await requireClient(client).auth.getUser();
  if (auth.error || !auth.data?.user?.id) throw new Error("authenticated_user_required");
  const { data, error } = await requireClient(client).rpc("bootstrap_personal_workspace_for_user", { p_user_id: auth.data.user.id, p_name: name });
  if (error) throw error;
  return data;
}

export async function listPersonalRecords(client, { workspaceId, recordType }) {
  const { data, error } = await requireClient(client)
    .from("personal_operational_records")
    .select("id,record_type,visibility,title,payload,lifecycle_status,created_at,updated_at")
    .eq("workspace_id", workspaceId)
    .eq("record_type", recordType)
    .neq("lifecycle_status", "DELETED")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function savePersonalRecord(client, { workspaceId, id = null, recordType, title, payload, lifecycleStatus = "DRAFT" }) {
  const { data, error } = await requireClient(client).rpc("save_personal_operational_record", {
    p_workspace_id: workspaceId,
    p_record_id: id,
    p_record_type: recordType,
    p_title: title,
    p_payload: payload,
    p_lifecycle_status: lifecycleStatus,
  });
  if (error) throw error;
  return data;
}

export async function loadCurrentLegalDocuments(client) {
  const { data, error } = await requireClient(client)
    .from("legal_documents")
    .select("id,document_type,document_version,lifecycle_status,mandatory,content_hash,content_reference,effective_at")
    .in("lifecycle_status", ["ACTIVE", "RECONSENT_REQUIRED"])
    .order("document_type");
  if (error) throw error;
  return data || [];
}

export async function transitionPersonalOpportunity(client, { opportunityId, nextStatus, createActiveWork = false }) {
  const { data, error } = await requireClient(client).rpc("transition_personal_opportunity", { p_opportunity_id: opportunityId, p_next_status: nextStatus, p_create_active_work: createActiveWork });
  if (error) throw error;
  return data;
}

export async function acceptCurrentLegalDocuments(client, { documents, workspaceId }) {
  const acceptances = documents.filter((document) => document.mandatory).map((document) => ({
    documentId: document.id,
    documentVersion: document.document_version,
    policyHash: document.content_hash,
    accepted: true,
  }));
  const { data, error } = await requireClient(client).rpc("accept_required_legal_documents", {
    p_acceptances: acceptances,
    p_workspace_id: workspaceId,
    p_technical_evidence: { method: "affirmative-checkbox", surface: "kevirio-next" },
  });
  if (error) throw error;
  return data;
}
