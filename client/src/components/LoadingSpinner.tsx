export const LoadingSpinner = ({ className = "w-6 h-6" }: { className?: string }) => (
  <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary ${className}`} />
);

export const EventCardSkeleton = () => (
  <div className="bg-card rounded-xl overflow-hidden border animate-pulse">
    <div className="w-full h-48 bg-gray-300 dark:bg-gray-700" />
    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-16" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20" />
      </div>
      <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full mb-4" />
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-24" />
        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-16" />
      </div>
    </div>
  </div>
);
