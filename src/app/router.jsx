import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { APP_ROUTES, LEGACY_REDIRECTS, pathForPage } from "./routes.js";
import { isDeveloperModeEnabled } from "./developerMode.js";

const LegacyApp = lazy(() => import("../App.jsx"));
const ComponentPreview = lazy(() => import("../labs/ComponentPreview.jsx"));

function RoutedLegacyApp({ page, ...ownerProps }) {
  const navigate = useNavigate();
  const onPageChange = (nextPage) => navigate(pathForPage(nextPage));
  return <LegacyApp {...ownerProps} initialPage={page} onPageChange={onPageChange} />;
}

function MessageRoute({ title }) { return <main><h1>{title}</h1></main>; }

function ProtectedRoutes(ownerProps) {
  return (
    <Suspense fallback={<p role="status">Loading</p>}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        {APP_ROUTES.map(({ path, page }) => <Route key={path} path={path} element={<RoutedLegacyApp {...ownerProps} page={page} />} />)}
        <Route path="/labs/components" element={isDeveloperModeEnabled() ? <ComponentPreview /> : <MessageRoute title="404 Not Found" />} />
        {LEGACY_REDIRECTS.map(({ from, to }) => <Route key={from} path={from} element={<Navigate to={to} replace />} />)}
        <Route path="*" element={<MessageRoute title="404 Not Found" />} />
      </Routes>
    </Suspense>
  );
}

export default function AppRouter(ownerProps) {
  return <BrowserRouter><ProtectedRoutes {...ownerProps} /></BrowserRouter>;
}
