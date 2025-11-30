import { ClockIcon } from "@heroicons/react/24/outline";

export default function BusinessHoursPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Business Hours</h3>
          <p className="text-sm text-gray-500">
            Define working hours and holidays to set expectations with customers
          </p>
        </div>
      </div>

      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClockIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h4 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h4>
        <p className="text-gray-500 max-w-md mx-auto">
          Business Hours let you define when your support team is available,
          helping set customer expectations for response times.
        </p>
      </div>
    </div>
  );
}
