import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const sourcePath=new URL("../../src/components/affiliate-v2/AffiliateProgramMaster.jsx",import.meta.url);

test("Affiliate Content hydrates canonical data only at the Program boundary",async()=>{
  const source=await readFile(sourcePath,"utf8");
  assert.match(source,/loadRef=useRef\(onLoad\)/);
  assert.match(source,/if\(!active\|\|dirtyRef\.current\)return/);
  assert.match(source,/\},\[program\.id\]\);/);
  assert.doesNotMatch(source,/\[program\.id,onLoad\]/);
});

test("title body CTA and publication edits share the dirty-preserving updater",async()=>{
  const source=await readFile(sourcePath,"utf8");
  assert.match(source,/const markDirty=updater=>\{dirtyRef\.current=true/);
  assert.match(source,/const set=\(key,value\)=>markDirty/);
  assert.match(source,/const setExecution=\(key,value\)=>markDirty/);
  assert.match(source,/const setPerformance=\(key,value\)=>markDirty/);
  assert.match(source,/dirtyRef\.current=false;setStatus\("saved"\)/);
});

test("save failure and conflict never replace the Owner draft",async()=>{
  const source=await readFile(sourcePath,"utf8");
  const save=source.match(/const save=async\(lifecycleStatus="DRAFT"\)=>\{[^\n]+/)?.[0]||"";
  assert.match(save,/setDraft\(rows\[0\]\?\.payload\|\|draft\)/);
  assert.match(save,/catch\(error\)\{setStatus/);
  assert.doesNotMatch(save,/catch\(error\)\{[^}]*setDraft/);
});
