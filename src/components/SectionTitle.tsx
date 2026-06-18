interface SectionTitleProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionTitle({ eyebrow, title, description }: SectionTitleProps) {
  return (
    <div className="mb-4">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-bus-600">{eyebrow}</p>
      <h2 className="mt-1 text-xl font-black tracking-tight text-ink-900">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-ink-500">{description}</p> : null}
    </div>
  );
}
