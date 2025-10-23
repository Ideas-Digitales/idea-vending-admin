'use client';

import Sidebar from '@/components/Sidebar';

export default function UserPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 min-h-screen overflow-auto">
        {/* Header Skeleton */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                <div>
                  <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-56 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="h-10 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </header>

        <div className="relative">
          {/* Stats Cards Skeleton */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Filters Skeleton */}
          <div className="sticky top-20 z-50 bg-gray-50 py-4">
            <div className="px-6">
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-6 w-36 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                {/* Search bar skeleton */}
                <div className="mb-6">
                  <div className="h-14 w-full bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
                
                {/* Filter dropdowns skeleton */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="h-12 flex-1 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-12 flex-1 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* User Cards Grid Skeleton */}
          <div className="px-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex items-center space-x-4">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              
              {/* User cards grid skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-3"></div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="h-5 w-16 bg-gray-200 rounded-full animate-pulse"></div>
                          <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom spacing */}
          <div className="h-8"></div>
        </div>
      </div>
    </div>
  );
}
