import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import "./styles.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { ApplicationShell } from "./app/shell/ApplicationShell.jsx";

const CanonicalHome = lazy(() => import("./components/CanonicalHome.jsx"));
const GoogleOperationsEmployee = lazy(() => import("./components/GoogleOperationsEmployee.jsx"));
const CanonicalApprovals = lazy(() => import("./components/CanonicalApprovals.jsx"));
const OfferOperationsWorkspace = lazy(() => import("./components/OfferOperationsWorkspace.jsx"));
const AffiliateIntelligenceWorkspace = lazy(() => import("./components/affiliate-v2/AffiliateV2Experience.jsx"));
const ProductionRevenueWorkspace = lazy(() => import("./components/ProductionRevenueWorkspace.jsx"));
const Analytics = lazy(() => import("./components/Analytics.jsx"));
const ProviderHub = lazy(() => import("./components/ProviderHub.jsx"));
const CanonicalInbox = lazy(() => import("./components/CanonicalInbox.jsx"));
const CanonicalAudit = lazy(() => import("./components/CanonicalAudit.jsx"));
const CanonicalSettings = lazy(() => import("./components/CanonicalSettings.jsx"));
const CompanyCoreV3Workspace = lazy(() => import("./components/CompanyCoreV3Workspace.jsx"));

export default function App({ ownerSession, ownerSupabaseClient, onOwnerLogout, initialPage = "home", onPageChange }) {
  const [page, setPageState] = useState(initialPage);
  useEffect(() => { setPageState(initialPage); }, [initialPage]);
  const setPage = useCallback((nextPage) => { setPageState(nextPage); onPageChange?.(nextPage); }, [onPageChange]);
  const pages = useMemo(() => ({
    home: <CanonicalHome setPage={setPage} ownerSession={ownerSession} ownerSupabaseClient={ownerSupabaseClient} />,
    googleOperations: <GoogleOperationsEmployee />,
    approval: <CanonicalApprovals ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    operations: <OfferOperationsWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    campaign: <OfferOperationsWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    affiliate: <AffiliateIntelligenceWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    production: <ProductionRevenueWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    analytics: <Analytics ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    providerHub: <ProviderHub ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    inbox: <CanonicalInbox setPage={setPage} />,
    audit: <CanonicalAudit ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    settings: <CanonicalSettings />,
    companyCore: <CompanyCoreV3Workspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    businessIntelligence: <CompanyCoreV3Workspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} mode="intelligence" />,
  }), [ownerSession, ownerSupabaseClient, setPage]);
  return <ApplicationShell sidebar={<Sidebar page={page} setPage={setPage} />} topbar={<TopBar onLogout={onOwnerLogout} environment={import.meta.env.PROD ? "Production" : "ローカル開発環境"} />}><ErrorBoundary><Suspense fallback={<main className="content" aria-busy="true"><p role="status">画面を読み込み中</p></main>}>{pages[page] || pages.home}</Suspense></ErrorBoundary></ApplicationShell>;
}
