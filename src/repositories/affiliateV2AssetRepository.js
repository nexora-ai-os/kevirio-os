import { mapAssetRow } from "../domain/affiliateV2Contracts.js";
import { createReadSupport } from "./affiliateV2RepositorySupport.js";
export function createAffiliateV2AssetRepository(client){const r=createReadSupport(client);return{
  listReusableAssets:async(workspaceId,filters={})=>(await r.list("reusable_business_assets",workspaceId,{filters:{asset_type:filters.assetType,maturity:filters.maturity},limit:filters.limit})).map(mapAssetRow),
  getReusableAssetById:(workspaceId,assetId)=>r.one("reusable_business_assets",workspaceId,assetId,mapAssetRow),
};}
