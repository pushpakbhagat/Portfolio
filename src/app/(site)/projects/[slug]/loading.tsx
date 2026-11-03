/** Placeholder while a case study loads: the page's own shape, gently pulsing. */
export default function CaseStudyLoading() {
  return (
    <div className="container-page animate-pulse pt-28 pb-24 md:pt-36" aria-busy aria-label="Loading">
      <div className="mb-12 h-3 w-24 rounded-sm bg-surface" />
      <div className="mb-6 h-3 w-48 rounded-sm bg-surface" />
      <div className="mb-10 h-[clamp(3rem,10vw,10rem)] w-3/4 rounded-sm bg-surface" />
      <div className="mb-14 grid gap-6 border-t pt-8 md:grid-cols-12">
        <div className="space-y-3 md:col-span-7">
          <div className="h-6 w-full rounded-sm bg-surface" />
          <div className="h-6 w-4/5 rounded-sm bg-surface" />
        </div>
      </div>
      <div className="aspect-[16/9] w-full rounded-sm bg-surface" />
    </div>
  );
}
