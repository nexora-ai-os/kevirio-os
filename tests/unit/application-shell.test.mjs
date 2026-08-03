import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const shell = read("../../src/app/shell/ApplicationShell.jsx");
const shellCss = read("../../src/app/shell/shell.css");
const sidebar = read("../../src/components/Sidebar.jsx");
const topbar = read("../../src/components/TopBar.jsx");
const app = read("../../src/App.jsx");

test("Production content is wrapped without moving screen implementations", () => {
  assert.match(app, /<ApplicationShell/);
  assert.match(app, /\{pages\[page\] \|\| pages\.home\}/);
  assert.match(app, /<ErrorBoundary>/);
  assert.doesNotMatch(shell, /repositor|supabase|rpc\(|fetch\(/i);
});

test("shell integrates the public theme and shared layout primitives", () => {
  assert.match(shell, /import \{ ThemeProvider \} from "\.\.\/\.\.\/design-system\/index\.js"/);
  assert.match(shell, /className="kv-app-shell"/);
  assert.match(shell, /className="kv-app-column"/);
  assert.match(shell, /<PageWrapper>/);
  assert.match(shell, /className=\{`kv-content-container/);
});

test("landmarks, skip navigation and current-page state are explicit", () => {
  assert.match(shell, /href="#main-content"/);
  assert.match(shell, /id="main-content"/);
  assert.match(shell, /tabIndex=\{-1\}/);
  assert.match(sidebar, /<aside[^>]+aria-label=/);
  assert.match(sidebar, /<nav[^>]+aria-label=/);
  assert.match(sidebar, /aria-current=\{page === key \? "page" : undefined\}/);
  assert.match(topbar, /<header[^>]+aria-label=/);
});

test("existing navigation callback remains button and keyboard native", () => {
  assert.match(sidebar, /type="button"/);
  assert.match(sidebar, /setPage\(key\)/);
  assert.match(sidebar, /onMobileClose\?\.\(\)/);
  assert.doesNotMatch(sidebar, /labs|Component Preview/i);
});

test("shell provides bounded desktop, tablet and mobile layouts", () => {
  assert.match(shellCss, /max-inline-size:var\(--content-full\)/);
  assert.match(shellCss, /grid-template-columns:minmax\(248px,276px\)/);
  assert.match(shellCss, /@media\(max-width:1024px\)/);
  assert.match(shellCss, /@media\(max-width:600px\)/);
  assert.match(shellCss, /\.kv-skip-link:focus/);
  assert.match(shell, /mobileOpen/);
  assert.match(shell, /event\.key === "Escape"/);
});

test("Production shell owns one shared TopBar", () => {
  assert.match(app, /topbar=\{<TopBar/);
  assert.match(app, /onLogout=\{onOwnerLogout\}/);
  assert.match(topbar, /kv-owner-menu/);
  assert.match(topbar, /ログアウト/);
  assert.doesNotMatch(app, /screenHasLegacyTopBar/);
});
