import { useLocation, useNavigate } from "react-router-dom";
import { navigationContext } from "../navigation.js";

export default function Breadcrumbs() {
  const location = useLocation();
  const navigate = useNavigate();
  const { crumbs } = navigationContext(location.pathname);
  return <nav className="kv-breadcrumb" aria-label="パンくずリスト"><ol>{crumbs.map((crumb) => <li key={crumb.id}>{crumb.route && !crumb.current ? <button type="button" onClick={() => navigate(crumb.route)}>{crumb.label}</button> : <span aria-current={crumb.current ? "page" : undefined}>{crumb.label}</span>}</li>)}</ol></nav>;
}
