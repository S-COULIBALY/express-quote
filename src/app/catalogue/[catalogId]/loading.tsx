export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 form-generator">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            <span className="text-gray-300">›</span>
            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
            <span className="text-gray-300">›</span>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>

          {/* Back Button Skeleton */}
          <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Section - Image Skeleton */}
            <div className="space-y-4">
              <div className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse shadow-ios"></div>
            </div>

            {/* Right Section - Content Skeleton */}
            <div className="space-y-6">
              {/* Title and Category */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-5 bg-gray-200 rounded w-2/3 animate-pulse"></div>
              </div>

              {/* Price Card Skeleton */}
              <div className="card-ios p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>

              {/* Quick Stats Skeleton */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card-ios p-4">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
                <div className="card-ios p-4">
                  <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                  <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>

              {/* Description Skeleton */}
              <div className="card-ios p-6">
                <div className="h-5 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title Skeleton */}
        <div className="text-center mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
        </div>

        {/* Form Skeleton */}
        <div className="card-ios p-8">
          <div className="space-y-6">
            {/* Form Fields Skeleton */}
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>

            {/* Button Skeleton */}
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Footer Info Skeleton */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center card-ios p-6">
              <div className="bg-green-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-32 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
            </div>
            
            <div className="text-center card-ios p-6">
              <div className="bg-blue-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-28 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-52 mx-auto animate-pulse"></div>
            </div>
            
            <div className="text-center card-ios p-6">
              <div className="bg-purple-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-5 bg-gray-200 rounded w-30 mx-auto mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-44 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 