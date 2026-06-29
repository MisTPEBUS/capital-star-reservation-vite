interface DispatchManagementPageProps {
  title: string;
}

export function DispatchManagementPage({ title }: DispatchManagementPageProps) {
  return (
    <section>
      <p className="admin-page-kicker">DISPATCH MANAGEMENT</p>
      <h1 className="admin-page-title">{title}</h1>
    </section>
  );
}
