"use client";

import { useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DeviceForm } from "../../../../components/DeviceForm";
import { LoadingPanel } from "../../../../components/LoadingPanel";

const GET_DEVICE = gql`
  query GetDevice($where: DeviceWhereInput!) {
    device(where: $where) {
      id
      name
      additionalName
      manufacturer
      modelNumber
      serialNumber
      releaseYear
      location
      info
      isFavorite
      externalUrl
      status
      functionalStatus
      hasOriginalBox
      isAssetTagged
      dateAcquired
      whereAcquired
      priceAcquired
      estimatedValue
      listPrice
      soldPrice
      soldDate
      cpu
      ram
      graphics
      storage
      isWifiEnabled
      isPramBatteryRemoved
      lastPowerOnDate
      category {
        id
        name
        type
      }
    }
  }
`;

export default function EditDevicePage() {
    const params = useParams();
    const id = params.id;

    const { loading, error, data } = useQuery(GET_DEVICE, {
        variables: { where: { id: parseInt(id as string) } },
        skip: !id,
    });

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingPanel title="Loading device…" subtitle="Opening the editor" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center rounded-full bg-red-100 mb-4" style={{ width: 48, height: 48 }}>
                        <svg width="24" height="24" className="text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <p className="text-[var(--foreground)] font-medium">Error loading device</p>
                    <p className="text-sm text-[var(--muted-foreground)] mt-1">{error.message}</p>
                </div>
            </div>
        );
    }

    if (!data?.device) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center rounded-full bg-gray-100 mb-4" style={{ width: 48, height: 48 }}>
                        <svg width="24" height="24" className="text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <p className="text-[var(--foreground)] font-medium">Device not found</p>
                    <Link href="/" className="text-sm text-[var(--apple-blue)] hover:underline mt-2 inline-block">
                        Return to inventory
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <Link
                href={`/devices/${id}`}
                className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-8 group"
            >
                <svg width="16" height="16" className="transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Device
            </Link>

            <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight mb-8">
                Edit {data.device.name}
            </h1>

            <DeviceForm device={data.device} mode="edit" />
        </div>
    );
}
