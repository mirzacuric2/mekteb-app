type AuthHeroPanelProps = {
  title: string;
  subtitle: string;
};

export function AuthHeroPanel({ title, subtitle }: AuthHeroPanelProps) {
  return (
    <div className="relative flex shrink-0 flex-col justify-end overflow-x-hidden bg-gradient-to-br from-[#064e3b] via-[#0f766e] to-[#134e4a] px-5 pb-5 pt-6 text-white sm:px-8 sm:pb-10 sm:pt-14 lg:min-h-screen lg:w-1/2 lg:justify-center lg:overflow-hidden lg:pb-16 lg:pt-16 lg:pl-12 lg:pr-10 xl:pl-16 xl:pr-14">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-emerald-300/15 blur-3xl"
        aria-hidden
      />
      <div className="relative min-w-0 max-w-lg space-y-2 sm:space-y-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-100/90 sm:text-sm">Mekteb</p>
        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl lg:text-4xl">{title}</h1>
        <p className="break-words text-sm leading-snug text-emerald-50/90 sm:text-base sm:leading-relaxed">{subtitle}</p>
      </div>
    </div>
  );
}
