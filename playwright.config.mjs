import {defineConfig,devices} from "@playwright/test";
const authFile="playwright/.auth/owner.json";
export default defineConfig({
  testDir:"./tests/browser",timeout:45_000,expect:{timeout:10_000},fullyParallel:false,workers:1,forbidOnly:true,retries:0,
  reporter:[["list"],["json",{outputFile:"playwright-artifacts/results.json"}]],outputDir:"playwright-artifacts/test-results",
  use:{baseURL:"http://127.0.0.1:5173",trace:"retain-on-failure",screenshot:"only-on-failure",video:"retain-on-failure",locale:"ja-JP",timezoneId:"Asia/Tokyo"},
  projects:[
    {name:"auth",testMatch:/auth\.setup\.mjs/,use:{...devices["Desktop Chrome"]}},
    {name:"chromium",testIgnore:/auth\.setup\.mjs/,use:{...devices["Desktop Chrome"],storageState:authFile}}
  ],
  webServer:{command:"npm run dev:full",url:"http://127.0.0.1:5173",reuseExistingServer:true,timeout:120_000,stdout:"pipe",stderr:"pipe"}
});
