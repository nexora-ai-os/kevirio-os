import {defineConfig,devices} from "@playwright/test";
import {getLocalSupabaseEnvironment} from "./tests/browser/local-supabase-fixture.mjs";
const authFile="playwright/.auth/owner.json";
const localSupabase=getLocalSupabaseEnvironment();
const resultFile=process.env.KEVIRIO_PLAYWRIGHT_RESULT||"playwright-artifacts/results.json";
export default defineConfig({
  globalSetup:"./tests/browser/global-setup.mjs",globalTeardown:"./tests/browser/global-teardown.mjs",
  testDir:"./tests/browser",timeout:45_000,expect:{timeout:10_000},fullyParallel:false,workers:1,forbidOnly:true,retries:0,
  reporter:[["list"],["./tests/browser/sanitized-json-reporter.mjs",{outputFile:resultFile}]],outputDir:"playwright-artifacts/test-results",
  use:{baseURL:"http://127.0.0.1:5173",trace:"retain-on-failure",screenshot:"only-on-failure",video:"retain-on-failure",locale:"ja-JP",timezoneId:"Asia/Tokyo"},
  projects:[
    {name:"auth",testMatch:/auth\.setup\.mjs/,use:{...devices["Desktop Chrome"],storageState:authFile}},
    {name:"chromium",testIgnore:/auth\.setup\.mjs/,use:{...devices["Desktop Chrome"],storageState:authFile}}
  ],
  webServer:{command:"node server/localDevServer.js",url:"http://127.0.0.1:5173",reuseExistingServer:false,timeout:120_000,stdout:"pipe",stderr:"pipe",env:{...process.env,VITE_SUPABASE_URL:localSupabase.url,VITE_SUPABASE_PUBLISHABLE_KEY:localSupabase.anonKey,SUPABASE_URL:localSupabase.url,SUPABASE_SECRET_KEY:localSupabase.serviceKey,KEVIRIO_ALLOWED_ORIGIN:"http://127.0.0.1:5173"}}
});
