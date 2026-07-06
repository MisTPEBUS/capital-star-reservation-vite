interface DispatchManagementPageProps {
  title: string;
}

export function DispatchManagementPage({ title }: DispatchManagementPageProps) {
  return (
    <section>
      <h1 className="admin-page-title">{title}</h1>
    </section>
  );
}
