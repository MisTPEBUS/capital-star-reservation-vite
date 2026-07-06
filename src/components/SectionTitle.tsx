interface SectionTitleProps {
  eyebrow: string;
  title: string;
  description?: string;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
}: SectionTitleProps) {
  return (
    <div className="mb-3">
      <p className="text-base font-black uppercase tracking-[0.28em] text-bus-600">
        {eyebrow}
      </p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-ink-900">
        {title}
      </h2>
      {description ? (
        <p className="mt-1.5 text-lg leading-6 text-ink-500">{description}</p>
      ) : null}
    </div>
  );
}
