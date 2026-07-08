import React, { memo } from "react";

function MotionBackground({ children, className = "" }) {
  return (
    <div className={`motion-shell ${className}`.trim()}>
      <div className="motion-orb motion-orb--one" />
      <div className="motion-orb motion-orb--two" />
      <div className="motion-grid" />
      <div className="motion-content">{children}</div>
    </div>
  );
}

export default memo(MotionBackground);
