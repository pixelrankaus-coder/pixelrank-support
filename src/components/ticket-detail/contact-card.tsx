import Link from "next/link";
import { EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, UserCircleIcon } from "@heroicons/react/24/outline";

interface ContactCardProps {
  contact: {
    id: string;
    name: string | null;
    email: string | null;
    company: string | null;
    workPhone: string | null;
  } | null;
}

export function ContactCard({ contact }: ContactCardProps) {
  if (!contact) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-900 text-sm">Contact details</h3>
        </div>
        <div className="p-4 text-center">
          <UserCircleIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No contact associated</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-900 text-sm">Contact details</h3>
      </div>
      <div className="p-4">
        {/* Contact avatar and name */}
        <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 mb-4 group">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
            {(contact.name || contact.email || "C").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-gray-900 group-hover:text-blue-600">
              {contact.name || "Unknown"}
            </div>
            {contact.name && contact.email && (
              <div className="text-sm text-gray-500">{contact.email}</div>
            )}
          </div>
        </Link>

        {/* Contact details */}
        <div className="space-y-2">
          {contact.email && (
            <div className="flex items-center gap-2 text-sm">
              <EnvelopeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a
                href={`mailto:${contact.email}`}
                className="text-blue-600 hover:text-blue-800 hover:underline truncate"
              >
                {contact.email}
              </a>
            </div>
          )}

          {contact.workPhone && (
            <div className="flex items-center gap-2 text-sm">
              <PhoneIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <a
                href={`tel:${contact.workPhone}`}
                className="text-gray-600 hover:text-gray-900"
              >
                {contact.workPhone}
              </a>
            </div>
          )}

          {contact.company && (
            <div className="flex items-center gap-2 text-sm">
              <BuildingOfficeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">{contact.company}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
