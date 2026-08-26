import { cloneElement, isValidElement, useCallback, useEffect, useState } from "react";
import { ThemeProvider } from "../../design-system/index.js";
import Breadcrumbs from "./Breadcrumbs.jsx";
import "../../design-system/styles.css";
import "./shell.css";
import "./navigation.css";
import { OwnerEditGuardProvider } from "../ownerEditGuard.jsx";
import OperationalGuideLayer from "../../components/OperationalGuideLayer.jsx";

const COLLAPSE_KEY="kevirio.sidebar.collapsed";
function readCollapsed(){try{return window.localStorage.getItem(COLLAPSE_KEY)==="true"}catch{return false}}
function editableTarget(target){return target instanceof Element&&Boolean(target.closest('input,textarea,select,[contenteditable="true"]'))}

export function ApplicationShell({sidebar,topbar,overlays,children}){
  const [mobileOpen,setMobileOpen]=useState(false),[collapsed,setCollapsed]=useState(readCollapsed);
  const closeMobile=useCallback(()=>{setMobileOpen(false);requestAnimationFrame(()=>document.querySelector(".kv-mobile-menu")?.focus())},[]);
  const toggleCollapsed=useCallback(()=>setCollapsed((current)=>!current),[]);
  useEffect(()=>{try{window.localStorage.setItem(COLLAPSE_KEY,String(collapsed))}catch{return}},[collapsed]);
  useEffect(()=>{const toggle=(event)=>{if(event.ctrlKey&&!event.metaKey&&!event.altKey&&!event.shiftKey&&!event.repeat&&event.key.toLowerCase()==="b"&&!editableTarget(event.target)){event.preventDefault();toggleCollapsed()}};document.addEventListener("keydown",toggle);return()=>document.removeEventListener("keydown",toggle)},[toggleCollapsed]);
  useEffect(()=>{if(!mobileOpen)return undefined;const previousOverflow=document.body.style.overflow;document.body.style.overflow="hidden";requestAnimationFrame(()=>document.querySelector(".kv-sidebar-close")?.focus());const contain=(event)=>{if(event.key==="Escape"){event.preventDefault();closeMobile();return}if(event.key!=="Tab")return;const drawer=document.querySelector("#production-navigation"),nodes=[...(drawer?.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')||[])].filter((node)=>!node.disabled);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}};document.addEventListener("keydown",contain);return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener("keydown",contain)}},[mobileOpen,closeMobile]);
  const renderedSidebar=isValidElement(sidebar)?cloneElement(sidebar,{mobileOpen,onMobileClose:closeMobile,collapsed,onCollapseToggle:toggleCollapsed}):sidebar;
  const renderedTopbar=isValidElement(topbar)?cloneElement(topbar,{onMenuToggle:()=>setMobileOpen((current)=>!current),mobileOpen,collapsed,onCollapseToggle:toggleCollapsed}):topbar;
  return <OwnerEditGuardProvider><ThemeProvider className="kv-production-theme"><a className="kv-skip-link" href="#main-content">本文へ移動</a><div className={`kv-app-shell ${collapsed?"kv-app-shell--collapsed":""}`}>{renderedSidebar}{mobileOpen?<button type="button" className="kv-drawer-backdrop" aria-label="ナビゲーションを閉じる" onClick={closeMobile}/>:null}<div className="kv-app-column">{topbar?<div className="kv-shell-topbar">{renderedTopbar}</div>:null}<div className="kv-shell-meta"><Breadcrumbs/></div><PageWrapper>{children}</PageWrapper></div></div><OperationalGuideLayer/>{overlays}</ThemeProvider></OwnerEditGuardProvider>;
}
export function ContentContainer({as:Element="div",children,className=""}){return <Element className={`kv-content-container ${className}`.trim()}>{children}</Element>}
export function PageWrapper({children,className=""}){return <ContentContainer className={`kv-page-wrapper ${className}`.trim()}><div id="main-content" className="kv-page-content" tabIndex={-1}>{children}</div></ContentContainer>}
