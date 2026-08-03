export default function BrandMark({ size = 48, className = "" }) {
  return <span className={`kv-brand-mark ${className}`.trim()} style={{ width: size, height: size }}><svg viewBox="0 0 64 64" role="img" aria-hidden="true"><defs><linearGradient id="kv-gold" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff4c9"/><stop offset=".28" stopColor="#d9a62e"/><stop offset=".52" stopColor="#8b5a08"/><stop offset=".73" stopColor="#f4cf67"/><stop offset="1" stopColor="#b77b12"/></linearGradient></defs><path fill="url(#kv-gold)" d="M13 7h12v21L45 7h15L37 31l24 26H45L25 35v22H13z"/></svg></span>;
}
