export function PageShell({ children }) {
  return (
    <div className="ml-64 min-h-screen flex-1 min-w-0">
      <main className="max-w-5xl mx-auto px-8 py-10">{children}</main>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
