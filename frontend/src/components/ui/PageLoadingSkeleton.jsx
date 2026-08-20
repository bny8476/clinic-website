import Skeleton from './Skeleton';

export default function PageLoadingSkeleton() {
  return (
    <div className="w-full h-full p-6 animate-pulse flex flex-col space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col space-y-2 w-1/3">
          <Skeleton variant="line" className="h-8 w-3/4" />
          <Skeleton variant="line" className="h-4 w-1/2" />
        </div>
        <div className="flex space-x-3">
          <Skeleton variant="line" className="h-10 w-24 rounded-lg" />
          <Skeleton variant="line" className="h-10 w-24 rounded-lg" />
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="flex-1 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-32" />
        </div>
        <div className="flex flex-col space-y-4">
          <Skeleton variant="table" count={5} />
        </div>
      </div>
    </div>
  );
}
