import{mkdirSync,writeFileSync}from"node:fs";import{dirname,relative}from"node:path";
const redact=value=>String(value||"").replace(/(?:eyJ|sb_(?:secret|publishable)_)[A-Za-z0-9._-]+/g,"[redacted]").replace(/Bearer\s+\S+/gi,"Bearer [redacted]");
export default class SanitizedJsonReporter{
  constructor(options={}){this.outputFile=options.outputFile||"playwright-artifacts/results.sanitized.json";this.tests=new Map();this.startedAt=null}
  onBegin(_config,suite){this.startedAt=new Date().toISOString();for(const test of suite.allTests()){const identity=`${relative(process.cwd(),test.location.file)}::${test.titlePath().join(" > ")}`;this.tests.set(test.id,{identity,file:relative(process.cwd(),test.location.file),title:test.titlePath().join(" > "),required:true,status:"missing",durationMs:0,error:null})}}
  onTestEnd(test,result){const row=this.tests.get(test.id);if(!row)return;row.status=result.status;row.durationMs=result.duration;row.error=result.error?redact(result.error.message):null}
  onEnd(result){const tests=[...this.tests.values()],count=status=>tests.filter(test=>test.status===status).length,payload={startedAt:this.startedAt,finishedAt:new Date().toISOString(),status:result.status,tests,summary:{expected:tests.length,executed:tests.filter(test=>test.status!=="missing").length,passed:count("passed"),failed:count("failed"),skipped:count("skipped"),timedOut:count("timedOut"),interrupted:count("interrupted"),missing:count("missing")}};mkdirSync(dirname(this.outputFile),{recursive:true});writeFileSync(this.outputFile,JSON.stringify(payload,null,2))}
}
