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
const ProductionRevenueWorkspace = lazy(() => import("./components/ProductionRevenueWorkspace.jsx"));
const Analytics = lazy(() => import("./components/Analytics.jsx"));
const ProviderHub = lazy(() => import("./components/ProviderHub.jsx"));
const CanonicalInbox = lazy(() => import("./components/CanonicalInbox.jsx"));
const CanonicalAudit = lazy(() => import("./components/CanonicalAudit.jsx"));
const CanonicalSettings = lazy(() => import("./components/CanonicalSettings.jsx"));

export default function App({ ownerSession, ownerSupabaseClient, initialPage = "home", onPageChange }) {
  const [page, setPageState] = useState(initialPage);
  useEffect(() => { setPageState(initialPage); }, [initialPage]);
  const setPage = useCallback((nextPage) => { setPageState(nextPage); onPageChange?.(nextPage); }, [onPageChange]);
  const pages = useMemo(() => ({
    home: <CanonicalHome setPage={setPage} ownerSession={ownerSession} ownerSupabaseClient={ownerSupabaseClient} />,
    googleOperations: <GoogleOperationsEmployee />,
    approval: <CanonicalApprovals ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    operations: <OfferOperationsWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    campaign: <OfferOperationsWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    production: <ProductionRevenueWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    analytics: <Analytics ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    providerHub: <ProviderHub ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    inbox: <CanonicalInbox />,
    audit: <CanonicalAudit ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    settings: <CanonicalSettings />,
  }), [ownerSession, ownerSupabaseClient, setPage]);
  return <ApplicationShell sidebar={<Sidebar page={page} setPage={setPage} />} topbar={<TopBar />}><ErrorBoundary><Suspense fallback={<main className="content" aria-busy="true"><p role="status">Loading screen</p></main>}>{pages[page] || pages.home}</Suspense></ErrorBoundary></ApplicationShell>;
}
