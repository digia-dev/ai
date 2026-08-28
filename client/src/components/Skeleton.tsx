export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className}`} />;
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-gray-200 rounded-xl p-4 ${className}`}>
      <SkeletonLine className="h-4 w-1/3 mb-3" />
      <SkeletonLine className="h-3 w-2/3 mb-2" />
      <SkeletonLine className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="p-6 space-y-4">
      <SkeletonLine className="h-6 w-48 mb-6" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function SkeletonChat() {
  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      {[1, 2, 3].map(i => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
          {i % 2 !== 0 && <SkeletonLine className="w-8 h-8 rounded-full shrink-0" />}
          <SkeletonLine className={`h-16 ${i % 2 === 0 ? 'w-2/3 ml-auto' : 'w-3/4'}`} />
        </div>
      ))}
    </div>
  );
}
