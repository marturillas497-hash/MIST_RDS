export function PageShell({ children }) {
  return (
    <div className="md:ml-64 min-h-screen flex-1 min-w-0">
      <div className="h-14 md:hidden" /> {/* spacer for mobile top bar */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10">{children}</main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-6 md:mb-8">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}