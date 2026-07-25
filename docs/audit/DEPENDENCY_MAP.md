# Dependency Map

Lockfile resolved versions (監査時build表示含む):

| Package | Role | Usage | Risk |
|---|---|---|---|
| react/react-dom | UI runtime | 全SPA | direct |
| vite 8.1.3 | build/dev runtime | scripts/server | latest rangeで再現性低下 |
| @vitejs/plugin-react | JSX transform | transitive/config implicit | config fileなし |
| @supabase/supabase-js 2.x | Auth/DB client | browser/server | key boundary重要 |
| lucide-react | icon package | source import確認なし | unused候補 |
| postcss <=8.5.17 | Vite transitive | build | npm audit High, fix available |

`dependencies`にbuild-only packageも入り、`devDependencies`は空。`latest`指定は将来installで破壊的更新を招く。License自動監査は未構成。

Scripts: `dev`, `dev:full`, `build`, `preview`のみ。`lint`, `typecheck`, `test`, `test:*`, `format`, `security scan`は存在しない。
