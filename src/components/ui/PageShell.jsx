export default function PageShell({
  children,
  className = '',
  showMesh = true,
  maxWidth = 'max-w-7xl',
  padding = 'px-4 sm:px-6 lg:px-8 py-8 sm:py-10',
}) {
  return (
    <div className={`aura-page aura-scrollbar ${className}`}>
      {showMesh && (
        <div className="aura-page-mesh" aria-hidden>
          <div className="aura-mesh-orb aura-mesh-orb--cyan" />
          <div className="aura-mesh-orb aura-mesh-orb--violet" />
        </div>
      )}
      <div className={`aura-page-inner ${maxWidth} mx-auto ${padding}`}>
        {children}
      </div>
    </div>
  );
}
