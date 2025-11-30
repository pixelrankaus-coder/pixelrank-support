import { Cog6ToothIcon } from "@heroicons/react/24/outline";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Cog6ToothIcon className="w-8 h-8 text-gray-400" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
      <p className="text-gray-500 max-w-md">
        Settings page coming soon. This will allow you to configure helpdesk
        settings, manage users, and customize workflows.
      </p>
    </div>
  );
}
