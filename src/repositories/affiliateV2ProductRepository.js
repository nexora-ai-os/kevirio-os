import { mapProductRow, mapProductSourceRow } from "../domain/affiliateV2Contracts.js";
import { createReadSupport } from "./affiliateV2RepositorySupport.js";
export function createAffiliateV2ProductRepository(client){const r=createReadSupport(client);return{
  listProducts:async(workspaceId,filters={})=>(await r.list("affiliate_products",workspaceId,{filters:{affiliate_program_id:filters.programId,lifecycle_status:filters.status,truth_class:filters.truthClass},limit:filters.limit})).map(mapProductRow),
  getProductById:(workspaceId,productId)=>r.one("affiliate_products",workspaceId,productId,mapProductRow),
  getProductSources:async(workspaceId,productId)=>(await r.list("affiliate_product_sources",workspaceId,{filters:{product_id:productId},order:"observed_at"})).map(mapProductSourceRow),
};}
