"use client";

import Link from "next/link";
import { DeviceForm } from "../../../components/DeviceForm";

export default function NewDevicePage() {
    return (
        <div className="max-w-6xl mx-auto">
            <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors mb-8 group"
            >
                <svg width="16" height="16" className="transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Inventory
            </Link>

            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight mb-8">
                Add New Device
            </h1>

            <DeviceForm mode="create" />
        </div>
    );
}
