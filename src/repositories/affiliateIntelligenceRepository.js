import { inspectOwnerWorkspace } from "../services/workspaceBootstrapService.js";

export function createAffiliateIntelligenceRepository(client) {
  const requireClient = () => { if (!client?.from || !client?.rpc) throw new Error("AFFILIATE_PROVIDER_REQUIRED"); };
  const list = async (table, workspaceId, optional = false) => {
    requireClient();
    const { data, error } = await client.from(table).select("*").eq("workspace_id", workspaceId);
    if (error && optional) return [];
    if (error) throw new Error("AFFILIATE_READ_FAILED");
    return data || [];
  };
  const command = async (name, args) => {
    requireClient();
    const { data, error } = await client.rpc(name, args);
    if (error) throw new Error("AFFILIATE_COMMAND_FAILED");
    return data;
  };
  return {
    async loadContext(session = null) {
      const value = await inspectOwnerWorkspace(client, session);
      if (!value.ok || value.status !== "ready") throw new Error("OWNER_WORKSPACE_REQUIRED");
      return value;
    },
    loadPrograms: (workspaceId) => list("affiliate_programs", workspaceId, true),
    loadMaterials: (workspaceId) => list("affiliate_materials", workspaceId, true),
    loadPublications: (workspaceId) => list("affiliate_publications", workspaceId, true),
    loadPerformance: (workspaceId) => list("affiliate_performance_records", workspaceId, true),
    saveProgram: (offerId, input, step, key) => command("save_affiliate_program_draft", { p_offer_id: offerId, p_input: input, p_preparation_step: step, p_idempotency_key: key }),
  };
}
