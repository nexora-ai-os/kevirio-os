import { AffiliateV2Error, mapRepositoryError } from "../domain/affiliateV2Contracts.js";
import { mapAffiliateProgramMasterRow, normalizeAffiliateLink, normalizeAffiliateProgramUpdate } from "../domain/affiliateProgramMaster.js";

export const AFFILIATE_PROGRAM_MASTER_COLUMNS = "id,workspace_id,asp_name,program_id,advertiser_name,program_name,category,reward_type,reward_summary,reward_details,epc,approval_rate,revisit_window_days,confirmation_days,conversion_conditions,rejection_conditions,pr_points,listing_policy,listing_ng_words,listing_ng_words_raw,listing_ng_words_verification_status,compliance_notes,program_status,affiliate_url,affiliate_link_status,affiliate_url_updated_at,affiliate_url_updated_by,source_type,source_verified_at,source_notes,owner_notes,created_at,updated_at";

export function createAffiliateProgramMasterRepository(client) {
  if (!client?.from || !client?.rpc) throw new AffiliateV2Error("RPC_UNAVAILABLE", { operation: "client_required", object: "affiliate_program_master" });
  return {
    async listPrograms(workspaceId) {
      if (!workspaceId) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "workspace_required", object: "affiliate_program_master" });
      try { const { data, error } = await client.from("affiliate_program_master").select(AFFILIATE_PROGRAM_MASTER_COLUMNS).eq("workspace_id", workspaceId).order("program_id", { ascending: true }).limit(100); if (error) throw error; return Object.freeze((data || []).map(mapAffiliateProgramMasterRow)); }
      catch (error) { throw mapRepositoryError(error, { operation: "list", object: "affiliate_program_master" }); }
    },
    async getProgram(workspaceId, id) {
      const rows = await this.listPrograms(workspaceId); const program = rows.find((row) => row.id === id); if (!program) throw new AffiliateV2Error("NOT_FOUND", { operation: "get", object: "affiliate_program_master" }); return program;
    },
    async saveAffiliateLink(workspaceId, id, input) {
      if (!workspaceId || !id) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "link_identity_required", object: "affiliate_program_master" });
      const normalized = normalizeAffiliateLink(input);
      try { const { data, error } = await client.rpc("save_affiliate_program_master_link", { p_workspace_id: workspaceId, p_program_master_id: id, p_affiliate_url: normalized.affiliateUrl, p_link_status: normalized.linkStatus }); if (error) throw error; return data; }
      catch (error) { throw mapRepositoryError(error, { operation: "save_link", object: "affiliate_program_master" }); }
    },
    async registerProgram(input) {
      const fields = ["aspName", "programId", "advertiserName", "programName"];
      if (fields.some((field) => !String(input?.[field] || "").trim())) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "required_registration_fields", object: "affiliate_program_master" });
      try { const { data, error } = await client.rpc("register_affiliate_program_master", { p_asp_name: input.aspName.trim(), p_program_id: input.programId.trim(), p_advertiser_name: input.advertiserName.trim(), p_program_name: input.programName.trim(), p_category: input.category?.trim() || null, p_source_notes: input.sourceNotes?.trim() || null }); if (error) throw error; return data; }
      catch (error) { throw mapRepositoryError(error, { operation: "register", object: "affiliate_program_master" }); }
    },
    async updateProgram(id, input) {
      if (!id) throw new AffiliateV2Error("VALIDATION_FAILED", { operation: "program_identity_required", object: "affiliate_program_master" });
      const normalized = normalizeAffiliateProgramUpdate(input);
      try { const { data, error } = await client.rpc("update_affiliate_program_master", { p_program_master_id: id, p_expected_updated_at: normalized.expectedUpdatedAt, p_changes: normalized.changes }); if (error) throw error; return data; }
      catch (error) { throw mapRepositoryError(error, { operation: "update", object: "affiliate_program_master" }); }
    },
  };
}
