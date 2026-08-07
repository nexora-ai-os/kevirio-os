export const INTERNAL_ASSET_TYPES=Object.freeze(["prompt","workflow","checklist","template","strategy","ai_employee","reusable_asset"]);
export const MARKETPLACE_VISIBILITY=Object.freeze(["private","workspace","organization"]);

export function validateInternalAsset(value={}) {
  const errors=[];
  if(!value.workspaceId||!value.title||!value.version||!value.contentReference)errors.push("asset_identity_required");
  if(!INTERNAL_ASSET_TYPES.includes(value.assetType))errors.push("asset_type_invalid");
  if(!MARKETPLACE_VISIBILITY.includes(value.visibility))errors.push("visibility_invalid");
  if(value.public===true||value.checkout===true||value.payment===true)errors.push("public_commerce_forbidden");
  if(value.assetType==="prompt"&&(!value.hash||!value.model||value.promptBody))errors.push("prompt_metadata_boundary_invalid");
  return Object.freeze({valid:errors.length===0,errors:Object.freeze(errors),marketplace:"internal",checkout:false,payment:false});
}

export function buildInternalCatalog(assets=[]) {
  return Object.freeze(assets.filter((asset)=>validateInternalAsset(asset).valid).map((asset)=>Object.freeze({id:asset.id||null,title:asset.title,assetType:asset.assetType,version:asset.version,visibility:asset.visibility,contentReference:asset.contentReference,hash:asset.hash||null,model:asset.model||null,marketplace:"internal",checkout:false,payment:false})));
}
