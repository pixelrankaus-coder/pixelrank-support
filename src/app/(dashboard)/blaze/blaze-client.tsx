"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolidIcon } from "@heroicons/react/24/solid";

// Brand Icons
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const GoogleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
  </svg>
);

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
);

const WordPressIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.109m-7.981.105c.647-.034 1.232-.1 1.232-.1.582-.075.514-.93-.067-.899 0 0-1.755.138-2.883.138-.975 0-2.618-.138-2.618-.138-.581-.031-.648.858-.066.899 0 0 .548.065 1.13.099l1.678 4.594-2.36 7.064-3.924-11.66c.648-.032 1.233-.1 1.233-.1.581-.074.514-.93-.068-.899 0 0-1.752.139-2.878.139-.201 0-.438-.005-.69-.014C5.634 3.81 8.571 2 12 2c2.546 0 4.861.962 6.618 2.545-.042-.003-.082-.008-.125-.008-1.044 0-1.785.912-1.785 1.889 0 .877.507 1.621 1.047 2.5.406.718.879 1.638.879 2.966 0 .92-.353 1.98-.82 3.462l-1.076 3.591-3.893-11.574h.002m-2.485 9.67l-3.237 9.4c-.97.285-1.997.44-3.063.44-1.06 0-2.082-.154-3.051-.437l3.264-9.475 3.087 9.071zM.816 12c0-2.086.576-4.041 1.576-5.708l4.29 11.748C2.797 16.217.816 14.319.816 12M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0"/>
  </svg>
);

const MailchimpIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none">
    <path d="M16 2C8.27812 2 2 8.27812 2 16C2 23.7219 8.27812 30 16 30C23.7219 30 30 23.7219 30 16C30 8.27812 23.7219 2 16 2Z" fill="#FDDD4C"/>
    <path d="M9.86884 19.6502C9.56272 19.1867 10.3327 18.4853 10.0195 17.8963C9.83897 17.5567 9.54389 17.345 9.18952 17.3006C8.84941 17.2579 8.49905 17.3824 8.27573 17.6257C7.92315 18.0094 7.86832 18.5317 7.93652 18.7165C7.96148 18.7842 8.00071 18.8027 8.02879 18.8067C8.22083 18.832 8.32889 18.3391 8.39519 18.2364C8.57851 17.9535 8.99476 17.8679 9.28223 18.0538C9.82731 18.4064 9.35467 18.9762 9.39545 19.4574C9.43513 19.926 9.72709 20.1144 9.98919 20.1342C10.2442 20.1438 10.4225 20.0022 10.4675 19.8988C10.5754 19.6519 10.1207 20.0315 9.86884 19.6502Z" fill="#000000"/>
    <path d="M21.2577 15.3958C21.1147 15.3761 20.9585 15.3765 20.7959 15.3958C20.6725 15.2401 20.5619 14.9879 20.4995 14.6936C20.3885 14.17 20.4001 13.7907 20.7099 13.7414C21.0197 13.6922 21.1694 14.009 21.2804 14.5326C21.3549 14.8846 21.3406 15.208 21.2577 15.3958Z" fill="#000000"/>
    <path d="M17.8646 15.7074C17.8769 15.8259 17.8812 15.9459 17.8777 16.0564C18.1775 16.074 18.3898 16.2163 18.4463 16.3067C18.4753 16.3533 18.4637 16.3837 18.4544 16.3977C18.4233 16.446 18.3568 16.4386 18.2175 16.4229C18.0958 16.4093 17.9648 16.3973 17.8286 16.4035C17.7545 16.6308 17.5348 16.6521 17.3804 16.484C17.2726 16.5168 17.0608 16.6521 16.9976 16.5051C16.9971 16.4322 17.0734 16.3261 17.2115 16.2325C17.1172 16.0526 17.054 15.8601 17.0167 15.6607C16.8209 15.696 16.6447 15.7508 16.5066 15.7938C16.4418 15.814 16.1853 15.9299 16.1552 15.7993C16.1351 15.7091 16.2755 15.5604 16.424 15.453C16.5898 15.3353 16.7738 15.2516 16.9646 15.2033C16.9605 14.9193 17.0329 14.7211 17.2393 14.6883C17.4951 14.6476 17.6537 14.8446 17.7634 15.2093C18.0726 15.2952 18.3814 15.5082 18.5177 15.7284C18.5707 15.8138 18.581 15.8798 18.5466 15.9146C18.4609 16.0034 17.9862 15.7459 17.8646 15.7074Z" fill="#000000"/>
    <path d="M19.8977 16.9838C20.0938 17.0788 20.3096 17.0414 20.38 16.9002C20.4504 16.7589 20.3484 16.5675 20.1522 16.4725C19.9561 16.3775 19.7404 16.4149 19.6699 16.5561C19.5995 16.6973 19.7016 16.8887 19.8977 16.9838Z" fill="#000000"/>
    <path d="M20.8632 16.2824C20.8667 16.0664 20.9991 15.8939 21.1583 15.8965C21.3174 15.8996 21.4435 16.0765 21.44 16.2921C21.4364 16.5077 21.304 16.6802 21.1449 16.6775C20.9857 16.6749 20.8596 16.498 20.8632 16.2824Z" fill="#000000"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M25.1785 18.9281C25.1816 18.9392 25.1772 18.9236 25.1785 18.9281C25.4981 18.9281 26 19.2907 26 20.1667C26 21.0384 25.6336 22.0257 25.5471 22.2449C24.2273 25.3671 21.0772 27.1051 17.3248 26.9951C13.8266 26.8926 10.8432 25.0705 9.53762 22.1001C8.7482 22.101 7.93426 21.7582 7.31556 21.217C6.66343 20.6468 6.26137 19.9089 6.18292 19.1393C6.12185 18.5401 6.19629 17.9826 6.38662 17.4964L5.65337 16.883C2.29777 14.0864 12.7929 2.57165 16.1494 5.46156C16.1663 5.47608 17.2914 6.56551 17.2941 6.56815C18.9125 5.88985 23.2489 4.5984 23.2537 7.60479C23.2555 8.60315 22.611 9.76738 21.5782 10.8238C22.7718 11.9164 22.457 13.4685 22.6471 14.8925L23.0616 15.006C23.8519 15.2247 24.414 15.5164 24.6891 15.8015C24.9641 16.0862 25.1005 16.3621 25.15 16.6855C25.1963 16.9464 25.1901 17.4071 24.8415 17.9223C24.967 18.2547 25.0816 18.5861 25.1785 18.9281ZM9.47834 21.2901C9.59557 21.2927 9.71191 21.2852 9.82602 21.2659C11.0523 21.0595 11.3732 19.7448 11.1713 18.4538C10.9431 16.9961 9.94414 16.4822 9.26616 16.4457C9.07761 16.436 8.90243 16.4527 8.75801 16.4813C7.5478 16.722 6.86447 17.7384 6.99908 19.0584C7.12077 20.253 8.3448 21.2601 9.47834 21.2901ZM6.73743 16.8395C7.14351 16.2574 7.80722 15.8363 8.56054 15.6915C9.51934 13.151 11.1205 10.8102 13.2396 9.19934C14.8122 7.90443 16.5082 6.97559 16.5082 6.97559C16.5082 6.97559 15.5949 5.93016 15.319 5.85316C13.622 5.40084 9.95707 7.89563 7.61689 11.1921C6.67012 12.5257 5.3146 14.8876 5.96272 16.1025C6.04251 16.253 6.49494 16.6397 6.73743 16.8395ZM20.4955 20.7066C20.4981 20.7339 20.4812 20.7621 20.4567 20.7722C20.4567 20.7722 19.0931 21.3983 16.9272 20.737C17.0051 21.3862 17.7924 21.6322 18.3425 21.7213C21.0263 22.1771 23.5355 20.6622 24.1002 20.2807C24.1972 20.2152 24.099 20.3836 24.0815 20.4083C23.3901 21.2887 21.5314 22.3082 19.1132 22.3078C18.0585 22.3073 17.0044 21.9408 16.6174 21.3772C16.017 20.5029 16.5876 19.2265 17.5883 19.3593C19.2798 19.5479 21.0139 19.4062 22.5798 18.6888C23.9451 18.0631 24.4608 17.375 24.3833 16.8175C24.263 15.9535 22.9821 15.8184 22.3346 15.6084C22.0529 15.5164 21.9138 15.4429 21.8822 14.9198C21.8684 14.6914 21.8282 13.8946 21.8135 13.565C21.7877 12.9882 21.7172 12.1993 21.2216 11.8737C21.0923 11.7887 20.9488 11.7478 20.7977 11.7399C20.6772 11.7341 20.6057 11.7507 20.5673 11.7596C20.5587 11.7616 20.5517 11.7632 20.5463 11.7641C20.2786 11.809 20.1146 11.9444 19.9212 12.1041C19.9101 12.1133 19.8988 12.1226 19.8875 12.1319C19.2692 12.6406 18.7472 12.7237 18.1664 12.6991C17.9855 12.6915 17.7991 12.6735 17.6024 12.6544C17.4215 12.6369 17.232 12.6185 17.0302 12.6067L16.7837 12.5926C15.8111 12.5433 14.768 13.3723 14.5946 14.5497C14.4009 15.864 15.1355 16.669 15.6132 17.1925C15.7313 17.3219 15.8337 17.434 15.9025 17.5325C15.9466 17.5919 15.9979 17.6755 15.9979 17.7551C15.9979 17.8502 15.9354 17.9254 15.8744 17.9896C14.8821 18.9968 14.5648 20.5971 14.9388 21.9307C14.9856 22.097 15.0448 22.2563 15.1148 22.4085C15.9921 24.4321 18.7138 25.3746 21.3722 24.5174C23.2354 23.9167 24.8816 22.465 25.2168 20.4624C25.2966 19.9406 25.1794 19.7391 25.0198 19.6418C24.8509 19.5393 24.6485 19.5749 24.6485 19.5749C24.6485 19.5749 24.5562 18.9515 24.295 18.3848C23.5199 18.9884 22.5223 19.4126 21.7627 19.6277C20.5458 19.9724 19.2312 20.1065 17.9737 19.944C17.4636 19.8781 17.1209 19.8338 16.974 20.3049C18.6514 20.9112 20.4268 20.6516 20.4268 20.6516C20.4611 20.6481 20.4919 20.6727 20.4955 20.7066ZM15.656 8.94062C14.7386 9.40394 13.7143 10.2289 12.8825 11.178C12.8531 11.2119 12.8968 11.2585 12.9329 11.2326C13.6514 10.7165 14.6365 10.2369 15.927 9.92622C17.3725 9.57818 18.7642 9.72426 19.6142 9.91654C19.657 9.92622 19.6837 9.85362 19.6459 9.8325C19.0842 9.52142 18.2221 9.31022 17.6106 9.30582C17.5807 9.30538 17.5638 9.27106 17.5816 9.2473C17.6872 9.10694 17.8321 8.96834 17.9645 8.86802C17.9939 8.84514 17.9761 8.79807 17.9386 8.80026C17.1779 8.84638 15.4402 9.63869 15.4465 9.60986C15.491 9.39866 15.6314 9.1197 15.7041 8.98946C15.7215 8.95866 15.6876 8.92478 15.656 8.94062Z" fill="#000000"/>
  </svg>
);

const N8nIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 16.97l-3.951-2.283v4.566l-3.951-2.283v-4.566L5.715 14.687V10.12l3.951-2.283V3.271l3.951 2.283v4.566l3.951-2.283v4.566l-3.951 2.283v4.284h3.951z"/>
  </svg>
);

const ZapierIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.357 12.003l3.136-3.136c.418-.418.418-1.095 0-1.513l-1.847-1.847c-.418-.418-1.095-.418-1.513 0L12 8.643 8.864 5.507c-.418-.418-1.095-.418-1.513 0L5.504 7.354c-.418.418-.418 1.095 0 1.513l3.136 3.136-3.136 3.136c-.418.418-.418 1.095 0 1.513l1.847 1.847c.418.418 1.095.418 1.513 0L12 15.363l3.133 3.136c.418.418 1.095.418 1.513 0l1.847-1.847c.418-.418.418-1.095 0-1.513l-3.136-3.136zM12 13.416c-.78 0-1.414-.633-1.414-1.413 0-.78.634-1.414 1.414-1.414.78 0 1.414.634 1.414 1.414 0 .78-.634 1.413-1.414 1.413z"/>
  </svg>
);

// Platform configuration with icons
const PLATFORMS = [
  { key: "blazeFacebook", label: "Facebook", color: "text-blue-600", Icon: FacebookIcon },
  { key: "blazeInstagram", label: "Instagram", color: "text-pink-600", Icon: InstagramIcon },
  { key: "blazeGoogle", label: "Google", color: "text-red-500", Icon: GoogleIcon },
  { key: "blazeLinkedIn", label: "LinkedIn", color: "text-blue-700", Icon: LinkedInIcon },
  { key: "blazeTikTok", label: "TikTok", color: "text-gray-900", Icon: TikTokIcon },
  { key: "blazeWordPress", label: "WordPress", color: "text-blue-500", Icon: WordPressIcon },
  { key: "blazeMailchimp", label: "Mailchimp", color: "text-yellow-600", Icon: MailchimpIcon },
  { key: "blazeN8n", label: "n8n", color: "text-orange-500", Icon: N8nIcon },
  { key: "blazeZapier", label: "Zapier", color: "text-orange-600", Icon: ZapierIcon },
] as const;

type PlatformKey = typeof PLATFORMS[number]["key"];

interface Company {
  id: string;
  name: string;
  website: string | null;
  isOnBlaze: boolean;
  blazeStartDate: string | null;
  blazeFacebook: boolean;
  blazeInstagram: boolean;
  blazeGoogle: boolean;
  blazeLinkedIn: boolean;
  blazeTikTok: boolean;
  blazeWordPress: boolean;
  blazeMailchimp: boolean;
  blazeN8n: boolean;
  blazeZapier: boolean;
  _count: { contacts: number; projects: number };
}

interface Agent {
  id: string;
  name: string | null;
  email: string;
}

type FilterMode = "all" | "on_blaze" | "not_on_blaze";

export function BlazeClient({
  initialCompanies,
  agents,
  currentUserId,
}: {
  initialCompanies: Company[];
  agents: Agent[];
  currentUserId: string;
}) {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const onBlaze = companies.filter((c) => c.isOnBlaze);
    const platformCounts: Record<string, number> = {};
    PLATFORMS.forEach((p) => {
      platformCounts[p.key] = companies.filter(
        (c) => c.isOnBlaze && c[p.key as PlatformKey]
      ).length;
    });

    return {
      total: companies.length,
      onBlaze: onBlaze.length,
      notOnBlaze: companies.length - onBlaze.length,
      platformCounts,
    };
  }, [companies]);

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    if (filterMode === "on_blaze") {
      result = result.filter((c) => c.isOnBlaze);
    } else if (filterMode === "not_on_blaze") {
      result = result.filter((c) => !c.isOnBlaze);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.website?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [companies, filterMode, searchQuery]);

  // Toggle Blaze status
  const toggleBlazeStatus = async (company: Company) => {
    const newStatus = !company.isOnBlaze;
    try {
      const res = await fetch(`/api/companies/${company.id}/blaze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isOnBlaze: newStatus,
          blazeStartDate: newStatus ? new Date().toISOString() : null,
        }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === company.id
              ? {
                  ...c,
                  isOnBlaze: newStatus,
                  blazeStartDate: newStatus ? new Date().toISOString() : null,
                }
              : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to update Blaze status:", err);
    }
  };

  // Toggle platform connection
  const togglePlatform = async (company: Company, platform: PlatformKey) => {
    const newValue = !company[platform];
    try {
      const res = await fetch(`/api/companies/${company.id}/blaze`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [platform]: newValue }),
      });
      if (res.ok) {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === company.id ? { ...c, [platform]: newValue } : c
          )
        );
      }
    } catch (err) {
      console.error("Failed to update platform:", err);
    }
  };

  // Create setup task with subtasks
  const createSetupTask = async (company: Company) => {
    setIsCreatingTask(true);
    try {
      const res = await fetch("/api/blaze/setup-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: company.id }),
      });
      if (res.ok) {
        const task = await res.json();
        alert(`Setup task created! Task ID: ${task.id}`);
        setShowSetupModal(false);
      } else {
        alert("Failed to create setup task");
      }
    } catch (err) {
      alert("Failed to create setup task");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const connectedPlatformsCount = (company: Company) => {
    return PLATFORMS.filter((p) => company[p.key as PlatformKey]).length;
  };

  return (
    <div className="p-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blaze.ai Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage client social media connections
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <BuildingOfficeIcon className="w-10 h-10 text-gray-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">On Blaze</p>
              <p className="text-2xl font-bold text-green-600">{stats.onBlaze}</p>
            </div>
            <CheckCircleSolidIcon className="w-10 h-10 text-green-300" />
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Not on Blaze</p>
              <p className="text-2xl font-bold text-gray-600">{stats.notOnBlaze}</p>
            </div>
            <XCircleIcon className="w-10 h-10 text-gray-300" />
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Platform Connections</h2>
        <div className="flex flex-wrap gap-3">
          {PLATFORMS.map((platform) => (
            <div
              key={platform.key}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg"
            >
              <platform.Icon className={`w-4 h-4 ${platform.color}`} />
              <span className="text-sm text-gray-700">{platform.label}</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.platformCounts[platform.key]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                filterMode === "all"
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterMode("on_blaze")}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                filterMode === "on_blaze"
                  ? "bg-green-50 border-green-300 text-green-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              On Blaze ({stats.onBlaze})
            </button>
            <button
              onClick={() => setFilterMode("not_on_blaze")}
              className={`px-3 py-1.5 text-sm rounded-lg border ${
                filterMode === "not_on_blaze"
                  ? "bg-gray-100 border-gray-400 text-gray-700"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Not on Blaze ({stats.notOnBlaze})
            </button>
          </div>
        </div>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Client
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                On Blaze
              </th>
              {PLATFORMS.map((p) => (
                <th
                  key={p.key}
                  className="text-center px-2 py-3 text-xs font-medium text-gray-500 uppercase"
                  title={p.label}
                >
                  <p.Icon className={`w-4 h-4 ${p.color} mx-auto`} />
                </th>
              ))}
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredCompanies.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                  No clients found
                </td>
              </tr>
            ) : (
              filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/companies/${company.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                          {company.name}
                        </span>
                        {company.website && (
                          <p className="text-xs text-gray-500">{company.website}</p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleBlazeStatus(company)}
                      className="mx-auto"
                    >
                      {company.isOnBlaze ? (
                        <CheckCircleSolidIcon className="w-6 h-6 text-green-500 hover:text-green-600" />
                      ) : (
                        <CheckCircleIcon className="w-6 h-6 text-gray-300 hover:text-green-500" />
                      )}
                    </button>
                  </td>
                  {PLATFORMS.map((platform) => (
                    <td key={platform.key} className="px-2 py-3 text-center">
                      <button
                        onClick={() =>
                          company.isOnBlaze &&
                          togglePlatform(company, platform.key as PlatformKey)
                        }
                        disabled={!company.isOnBlaze}
                        className={`mx-auto ${!company.isOnBlaze ? "opacity-30 cursor-not-allowed" : ""}`}
                        title={`${platform.label}: ${company[platform.key as PlatformKey] ? "Connected" : "Not Connected"}`}
                      >
                        {company[platform.key as PlatformKey] ? (
                          <CheckCircleSolidIcon className="w-5 h-5 text-green-500 hover:text-green-600" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                        )}
                      </button>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        setSelectedCompany(company);
                        setShowSetupModal(true);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      title="Create setup task"
                    >
                      <ClipboardDocumentListIcon className="w-4 h-4" />
                      Setup Task
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Setup Task Modal */}
      {showSetupModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold">Create Setup Task</h2>
              <p className="text-sm text-gray-500 mt-1">
                Create a task with subtasks for setting up {selectedCompany.name} on
                Blaze.ai
              </p>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-4">
                This will create a task with the following subtasks:
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-gray-400" />
                  Create Blaze workspace for {selectedCompany.name}
                </li>
                {PLATFORMS.filter(
                  (p) => !selectedCompany[p.key as PlatformKey]
                ).map((platform) => (
                  <li key={platform.key} className="flex items-center gap-2">
                    <CheckCircleIcon className="w-4 h-4 text-gray-400" />
                    Connect {platform.label}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => setShowSetupModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => createSetupTask(selectedCompany)}
                disabled={isCreatingTask}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isCreatingTask ? "Creating..." : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
