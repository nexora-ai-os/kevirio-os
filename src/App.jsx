import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import "./styles.css";
import "./components/next/next-workspace.css";
import ErrorBoundary from "./components/ErrorBoundary";
import Sidebar from "./components/next/NextSidebar.jsx";
import TopBar from "./components/next/NextTopBar.jsx";
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
const NextWorkspace = lazy(() => import("./components/next/NextWorkspace.jsx"));
const GoogleIntegrationWorkspace = lazy(() => import("./components/GoogleIntegrationWorkspace.jsx"));
const NextDurableSurfaces = lazy(() => import("./components/next/NextDurablePage.jsx"));
const NextTeamAdministration = lazy(() => import("./components/next/NextTeamAdministration.jsx"));
const NextPersonalHome = lazy(() => import("./components/next/NextPersonalHome.jsx"));
const NextDurableAssistant = lazy(() => import("./components/next/NextDurableAssistant.jsx"));
const NextOpportunityLifecyclePage = lazy(() => import("./components/next/NextOpportunityLifecyclePage.jsx"));
const NextWorkPage = lazy(() => import("./components/next/NextWorkRevenueLearning.jsx").then(module=>({default:module.NextWorkPage})));
const NextRevenueCapturePage = lazy(() => import("./components/next/NextWorkRevenueLearning.jsx").then(module=>({default:module.NextRevenueCapturePage})));
const NextRetrospectivePage = lazy(() => import("./components/next/NextWorkRevenueLearning.jsx").then(module=>({default:module.NextRetrospectivePage})));

export default function App({ ownerSession, ownerSupabaseClient, onOwnerLogout, initialPage = "home", onPageChange }) {
  const [page, setPageState] = useState(initialPage);
  useEffect(() => { setPageState(initialPage); }, [initialPage]);
  const setPage = useCallback((nextPage) => { setPageState(nextPage); onPageChange?.(nextPage); }, [onPageChange]);
  const pages = useMemo(() => ({
    home:<NextPersonalHome client={ownerSupabaseClient} />, assistant:<NextDurableAssistant client={ownerSupabaseClient} />, goals:<NextWorkspace page="goals" />, sns:<NextWorkspace page="sns" />, snsAnalytics:<NextWorkspace page="snsAnalytics" />, content:<NextDurableSurfaces page="content" client={ownerSupabaseClient} />, note:<NextWorkspace page="note" />,
    opportunities:<NextOpportunityLifecyclePage client={ownerSupabaseClient} />, outreach:<NextWorkspace page="outreach" />, projects:<NextWorkPage client={ownerSupabaseClient} />, retrospective:<NextRetrospectivePage client={ownerSupabaseClient} />, studio:<NextWorkspace page="studio" />, revenueCenter:<NextRevenueCapturePage client={ownerSupabaseClient} />, crm:<NextWorkspace page="crm" />,
    employees:<NextWorkspace page="employees" />, team:<NextTeamAdministration session={ownerSession} />, knowledge:<NextWorkspace page="knowledge" />, feedback:<NextDurableSurfaces page="feedback" client={ownerSupabaseClient} />, connectors:<GoogleIntegrationWorkspace client={ownerSupabaseClient} session={ownerSession} />, safety:<NextWorkspace page="safety" />, legal:<NextDurableSurfaces page="legal" client={ownerSupabaseClient} />,
    googleOperations: <GoogleOperationsEmployee />,
    approval: <CanonicalApprovals ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    operations: <OfferOperationsWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    campaign: <OfferOperationsWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    affiliate: <AffiliateIntelligenceWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    production: <ProductionRevenueWorkspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    analytics: <NextWorkspace page="analytics" />,
    providerHub: <ProviderHub ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    inbox: <CanonicalInbox setPage={setPage} />,
    audit: <CanonicalAudit ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    settings: <NextWorkspace page="settings" />,
    companyCore: <CompanyCoreV3Workspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} />,
    businessIntelligence: <CompanyCoreV3Workspace ownerSupabaseClient={ownerSupabaseClient} ownerSession={ownerSession} mode="intelligence" />,
  }), [ownerSession, ownerSupabaseClient, setPage]);
  const environment=typeof window!=="undefined"&&window.location.hostname.endsWith(".vercel.app")?"Preview":import.meta.env.PROD?"Production":"Local";
  return <ApplicationShell sidebar={<Sidebar />} topbar={<TopBar onLogout={onOwnerLogout} environment={environment} />}><ErrorBoundary><Suspense fallback={<main className="content" aria-busy="true"><p role="status">画面を読み込み中</p></main>}>{pages[page] || pages.home}</Suspense></ErrorBoundary></ApplicationShell>;
}
