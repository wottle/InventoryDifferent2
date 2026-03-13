"use client";

import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ImageUploader } from "../../../components/ImageUploader";
import { ImageGallery } from "../../../components/ImageGallery";
import { ShareModal } from "../../../components/ShareModal";
import { API_BASE_URL } from "../../../lib/config";
import { LoadingPanel } from "../../../components/LoadingPanel";
import { DeepLinkBanner } from "../../../components/DeepLinkBanner";
import { useAuth } from "../../../lib/auth-context";

const DeviceValueChart = dynamic(() => import("../../../components/DeviceValueChart"), { ssr: false });

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
      operatingSystem
      isWifiEnabled
      isPramBatteryRemoved
      lastPowerOnDate
      category {
        id
        name
        type
      }
      images {
        id
        path
        thumbnailPath
        caption
        dateTaken
        isThumbnail
        isShopImage
        isListingImage
      }
      notes {
        id
        content
        date
      }
      maintenanceTasks {
        id
        label
        dateCompleted
        notes
        cost
      }
      tags {
        id
        name
      }
      customFieldValues {
        id
        customFieldId
        customFieldName
        value
        isPublic
        sortOrder
      }
    }
  }
`;

const GET_TAGS = gql`
  query GetTags {
    tags {
      id
      name
    }
  }
`;

const GET_VALUE_HISTORY = gql`
  query GetValueHistory($deviceId: Int!) {
    valueHistory(deviceId: $deviceId) {
      id
      estimatedValue
      snapshotDate
    }
  }
`;

const GET_MAINTENANCE_TASK_LABELS = gql`
  query GetMaintenanceTaskLabels {
    maintenanceTaskLabels
  }
`;

const CREATE_MAINTENANCE_TASK = gql`
  mutation CreateMaintenanceTask($input: MaintenanceTaskCreateInput!) {
    createMaintenanceTask(input: $input) {
      id
      label
      dateCompleted
      notes
      cost
    }
  }
`;

const DELETE_MAINTENANCE_TASK = gql`
  mutation DeleteMaintenanceTask($id: Int!) {
    deleteMaintenanceTask(id: $id)
  }
`;

const CREATE_NOTE = gql`
  mutation CreateNote($input: NoteCreateInput!) {
    createNote(input: $input) {
      id
      content
      date
    }
  }
`;

const DELETE_NOTE = gql`
  mutation DeleteNote($id: Int!) {
    deleteNote(id: $id)
  }
`;

const UPDATE_NOTE = gql`
  mutation UpdateNote($input: NoteUpdateInput!) {
    updateNote(input: $input) {
      id
      content
      date
    }
  }
`;

const UPDATE_LAST_POWER_ON_DATE = gql`
  mutation UpdateLastPowerOnDate($input: DeviceUpdateInput!) {
    updateDevice(input: $input) {
      id
      lastPowerOnDate
    }
  }
`;

const TOGGLE_FAVORITE = gql`
  mutation ToggleFavorite($input: DeviceUpdateInput!) {
    updateDevice(input: $input) {
      id
      isFavorite
    }
  }
`;

const DELETE_DEVICE = gql`
  mutation DeleteDevice($id: Int!) {
    deleteDevice(id: $id)
  }
`;

const ADD_DEVICE_TAG = gql`
  mutation AddDeviceTag($deviceId: Int!, $tagName: String!) {
    addDeviceTag(deviceId: $deviceId, tagName: $tagName) {
      id
      tags {
        id
        name
      }
    }
  }
`;

const REMOVE_DEVICE_TAG = gql`
  mutation RemoveDeviceTag($deviceId: Int!, $tagId: Int!) {
    removeDeviceTag(deviceId: $deviceId, tagId: $tagId) {
      id
      tags {
        id
        name
      }
    }
  }
`;

function linkifyText(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
        if (part.match(urlRegex)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline break-all"
                >
                    {part}
                </a>
            );
        }
        return part;
    });
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        AVAILABLE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        FOR_SALE: "bg-amber-50 text-amber-700 ring-amber-600/20",
        PENDING_SALE: "bg-orange-50 text-orange-700 ring-orange-600/20",
        SOLD: "bg-slate-50 text-slate-600 ring-slate-500/20",
        DONATED: "bg-sky-50 text-sky-700 ring-sky-600/20",
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.AVAILABLE}`}>
            {status.replace(/_/g, " ")}
        </span>
    );
}

function FunctionalBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        YES: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
        PARTIAL: "bg-amber-50 text-amber-700 ring-amber-600/20",
        NO: "bg-red-50 text-red-700 ring-red-600/20",
    };
    const labels: Record<string, string> = {
        YES: "Fully Functional",
        PARTIAL: "Partially Functional",
        NO: "Not Functional",
    };
    return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status] || styles.YES}`}>
            {labels[status] || status}
        </span>
    );
}

function FunctionalStatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'YES':
            return (
                <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center" title="Fully Functional">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-green-600 dark:text-green-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            );
        case 'PARTIAL':
            return (
                <div className="w-5 h-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center" title="Partially Functional">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-yellow-600 dark:text-yellow-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            );
        case 'NO':
            return (
                <div className="w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center" title="Not Functional">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600 dark:text-red-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </div>
            );
        default:
            return null;
    }
}

function StatusIndicatorIcons({ device }: { device: any }) {
    return (
        <div className="flex gap-1.5">
            {/* Functional Status */}
            <FunctionalStatusIcon status={device.functionalStatus} />
            
            {/* Favorite indicator */}
            {device.isFavorite && (
                <div className="w-5 h-5 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center" title="Favorite">
                    <span className="text-yellow-600 dark:text-yellow-400 text-xs">★</span>
                </div>
            )}

            {/* Original Box indicator */}
            {device.hasOriginalBox && (
                <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center" title="Has Original Box">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-purple-600 dark:text-purple-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>
            )}

            {/* Asset Tagged indicator */}
            {device.isAssetTagged && (
                <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center" title="Asset Tagged">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-600 dark:text-blue-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                </div>
            )}

            {/* PRAM Battery indicator - only for computers, shows warning if NOT removed */}
            {device.category?.type === "COMPUTER" && !device.isPramBatteryRemoved && (
                <div className="w-5 h-5 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center" title="PRAM Battery Not Removed">
                    <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-600 dark:text-red-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            )}
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    if (!value) return null;
    return (
        <div className="flex justify-between py-3 border-b border-[var(--border)] last:border-0">
            <dt className="text-sm text-[var(--muted-foreground)]">{label}</dt>
            <dd className="text-sm font-medium text-[var(--foreground)]">{value}</dd>
        </div>
    );
}

function formatDateForDisplay(dateString: string): string {
    try {
        // Create date object directly from the ISO string
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', dateString, error);
        return 'Invalid date';
    }
}

export default function DeviceDetail() {
    const params = useParams();
    const id = params.id;
    const { isAuthenticated } = useAuth();
    const [selectedImage, setSelectedImage] = useState(0);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxZoom, setLightboxZoom] = useState(1);
    const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef<{ x: number; y: number } | null>(null);
    const panOriginRef = useRef<{ x: number; y: number } | null>(null);
    const lightboxContainerRef = useRef<HTMLDivElement | null>(null);
    const lastPointerOffsetRef = useRef<{ x: number; y: number } | null>(null);
    const [showUploader, setShowUploader] = useState(false);
    const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
    const [maintenanceFormData, setMaintenanceFormData] = useState({
        label: '',
        dateCompleted: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
        notes: '',
        cost: '',
    });
    const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [noteFormData, setNoteFormData] = useState({
        content: '',
        date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    });
    const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [editNoteFormData, setEditNoteFormData] = useState({
        content: '',
        date: ''
    });
    const [deleteDeviceConfirm, setDeleteDeviceConfirm] = useState(false);
    const [tagName, setTagName] = useState('');
    const [showShareModal, setShowShareModal] = useState(false);

    const { loading, error, data, refetch } = useQuery(GET_DEVICE, {
        variables: { where: { id: parseInt(id as string), deleted: { equals: false } } },
        skip: !id,
        fetchPolicy: "cache-and-network",
    });

    const { data: tagsData } = useQuery(GET_TAGS);
    const { data: taskLabelsData } = useQuery(GET_MAINTENANCE_TASK_LABELS);
    const { data: valueHistoryData } = useQuery(GET_VALUE_HISTORY, {
        variables: { deviceId: parseInt(id as string) },
        skip: !id || !isAuthenticated,
    });
    const [showLabelSuggestions, setShowLabelSuggestions] = useState(false);

    const imageCountForNav = (data?.device?.images ?? []).filter((img: any) => !img.isThumbnail).length;

    useEffect(() => {
        if (!isLightboxOpen) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [isLightboxOpen]);

    const applyLightboxZoom = useCallback(
        (
            getNextZoom: (prevZoom: number) => number,
            anchorOffset?: { x: number; y: number }
        ) => {
            setLightboxZoom((prevZoom) => {
                const nextZoom = Math.min(6, Math.max(1, getNextZoom(prevZoom)));

                setLightboxPan((prevPan) => {
                    if (nextZoom <= 1.01) return { x: 0, y: 0 };

                    const anchor = anchorOffset ?? lastPointerOffsetRef.current ?? { x: 0, y: 0 };

                    const ratio = nextZoom / prevZoom;

                    return {
                        x: prevPan.x * ratio + anchor.x * (1 - ratio),
                        y: prevPan.y * ratio + anchor.y * (1 - ratio),
                    };
                });

                return nextZoom;
            });
        },
        []
    );

    useEffect(() => {
        if (!isLightboxOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                setIsLightboxOpen(false);
                return;
            }

            if (e.key === '+' || e.key === '=' || e.key === '-') {
                e.preventDefault();
                applyLightboxZoom((prev) => (e.key === '-' ? prev / 1.2 : prev * 1.2));
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [applyLightboxZoom, isLightboxOpen]);

    useEffect(() => {
        if (!isLightboxOpen) return;
        if (lightboxZoom > 1.01) return;

        setLightboxPan({ x: 0, y: 0 });
        setIsPanning(false);
        panStartRef.current = null;
        panOriginRef.current = null;
    }, [isLightboxOpen, lightboxZoom]);

    useEffect(() => {
        setSelectedImage((prev) => {
            if (imageCountForNav <= 0) return 0;
            return Math.min(prev, imageCountForNav - 1);
        });
    }, [imageCountForNav]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (imageCountForNav <= 1) return;
            if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

            const target = e.target as HTMLElement | null;
            const tagName = target?.tagName?.toLowerCase();
            const isTypingTarget =
                tagName === 'input' ||
                tagName === 'textarea' ||
                tagName === 'select' ||
                (target?.getAttribute('contenteditable') === 'true');

            if (isTypingTarget) return;

            e.preventDefault();
            setSelectedImage((prev) => {
                if (e.key === 'ArrowRight') return (prev + 1) % imageCountForNav;
                return (prev - 1 + imageCountForNav) % imageCountForNav;
            });
        };

        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [imageCountForNav]);

    const [createMaintenanceTask, { loading: creatingTask }] = useMutation(CREATE_MAINTENANCE_TASK);
    const [deleteMaintenanceTask, { loading: deletingTask }] = useMutation(DELETE_MAINTENANCE_TASK);
    const [createNote, { loading: creatingNote }] = useMutation(CREATE_NOTE);
    const [updateNote, { loading: updatingNote }] = useMutation(UPDATE_NOTE);
    const [deleteNote, { loading: deletingNote }] = useMutation(DELETE_NOTE);
    const [updateLastPowerOnDate, { loading: updatingPowerDate }] = useMutation(UPDATE_LAST_POWER_ON_DATE);
    const [toggleFavorite, { loading: togglingFavorite }] = useMutation(TOGGLE_FAVORITE);
    const [deleteDevice, { loading: deletingDevice }] = useMutation(DELETE_DEVICE);
    const [addDeviceTag, { loading: addingTag }] = useMutation(ADD_DEVICE_TAG);
    const [removeDeviceTag, { loading: removingTag }] = useMutation(REMOVE_DEVICE_TAG);

    const handleAddTag = async (e: React.FormEvent) => {
        e.preventDefault();
        const name = tagName.trim();
        if (!name) return;

        try {
            await addDeviceTag({
                variables: {
                    deviceId: device.id,
                    tagName: name,
                },
            });
            setTagName('');
            refetch();
        } catch (err) {
            console.error('Error adding tag:', err);
        }
    };

    const handleRemoveTag = async (tagId: number) => {
        try {
            await removeDeviceTag({
                variables: {
                    deviceId: device.id,
                    tagId,
                },
            });
            refetch();
        } catch (err) {
            console.error('Error removing tag:', err);
        }
    };

    const handleCreateMaintenanceTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createMaintenanceTask({
                variables: {
                    input: {
                        deviceId: device.id,
                        label: maintenanceFormData.label,
                        dateCompleted: maintenanceFormData.dateCompleted,
                        notes: maintenanceFormData.notes || null,
                        cost: maintenanceFormData.cost ? parseFloat(maintenanceFormData.cost) : null,
                    },
                },
            });
            // Reset form and close
            setMaintenanceFormData({ label: '', dateCompleted: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10), notes: '', cost: '' });
            setShowMaintenanceForm(false);
            // Refetch device data to show new task
            refetch();
        } catch (err) {
            console.error('Error creating maintenance task:', err);
        }
    };

    const handleDeleteMaintenanceTask = async () => {
        if (!deleteTaskId) return;
        try {
            await deleteMaintenanceTask({
                variables: { id: deleteTaskId },
            });
            setDeleteTaskId(null);
            // Refetch device data to remove deleted task
            refetch();
        } catch (err) {
            console.error('Error deleting maintenance task:', err);
        }
    };

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Parse datetime-local input as local time
            const dateTimeParts = noteFormData.date.split('T');
            const dateParts = dateTimeParts[0].split('-');
            const timeParts = dateTimeParts[1].split(':');
            const localDate = new Date(
                parseInt(dateParts[0]), // year
                parseInt(dateParts[1]) - 1, // month (0-based)
                parseInt(dateParts[2]), // day
                parseInt(timeParts[0]), // hour
                parseInt(timeParts[1]) // minute
            );

            await createNote({
                variables: {
                    input: {
                        deviceId: device.id,
                        content: noteFormData.content,
                        date: localDate.toISOString(),
                    },
                },
            });
            // Reset form and close
            setNoteFormData({ content: '', date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) });
            setShowNoteForm(false);
            // Refetch device data to show new note
            refetch();
        } catch (err) {
            console.error('Error creating note:', err);
        }
    };

    const handleEditNote = (note: any) => {
        setEditingNoteId(note.id);
        // Convert UTC timestamp to local datetime format for datetime-local input
        const utcDate = new Date(note.date);
        const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
        const localDateTimeString = localDate.toISOString().slice(0, 16); // YYYY-MM-DDTHH:MM format
        setEditNoteFormData({
            content: note.content,
            date: localDateTimeString,
        });
    };

    const handleUpdateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingNoteId) return;
        try {
            // Parse datetime-local input as local time
            const dateTimeParts = editNoteFormData.date.split('T');
            const dateParts = dateTimeParts[0].split('-');
            const timeParts = dateTimeParts[1].split(':');
            const localDate = new Date(
                parseInt(dateParts[0]), // year
                parseInt(dateParts[1]) - 1, // month (0-based)
                parseInt(dateParts[2]), // day
                parseInt(timeParts[0]), // hour
                parseInt(timeParts[1]) // minute
            );

            await updateNote({
                variables: {
                    input: {
                        id: editingNoteId,
                        content: editNoteFormData.content,
                        date: localDate.toISOString(),
                    },
                },
            });
            // Reset edit state
            setEditingNoteId(null);
            setEditNoteFormData({ content: '', date: '' });
            // Refetch device data to show updated note
            refetch();
        } catch (err) {
            console.error('Error updating note:', err);
        }
    };

    const handleDeleteNote = async () => {
        if (!deleteNoteId) return;
        try {
            await deleteNote({
                variables: { id: deleteNoteId },
            });
            setDeleteNoteId(null);
            // Refetch device data to remove deleted note
            refetch();
        } catch (err) {
            console.error('Error deleting note:', err);
        }
    };

    const handleToggleFavorite = async () => {
        try {
            await toggleFavorite({
                variables: {
                    input: {
                        id: device.id,
                        isFavorite: !device.isFavorite,
                    },
                },
            });
            refetch();
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

    const handleUpdateLastPowerOnDate = async () => {
        try {
            await updateLastPowerOnDate({
                variables: {
                    input: {
                        id: device.id,
                        lastPowerOnDate: new Date().toISOString(),
                    },
                },
            });
            // Refetch device data to show updated power date
            refetch();
        } catch (err) {
            console.error('Error updating last power on date:', err);
        }
    };

    const handleDeleteDevice = async () => {
        try {
            await deleteDevice({
                variables: { id: device.id },
            });
            // Redirect to main page after successful deletion
            window.location.href = '/';
        } catch (err) {
            console.error('Error deleting device:', err);
            setDeleteDeviceConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingPanel title="Loading device…" subtitle="Fetching details" />
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
                    <p className="text-[var(--foreground)] font-medium">Something went wrong</p>
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

    const device = data.device;
    const images = device.images || [];

    const existingTagNames = new Set((device.tags ?? []).map((t: any) => (t?.name ?? '').toLowerCase()));

    const thumbnailImage = images.find((i: any) => i.isThumbnail);

    // Sort images for the management grid: thumbnail first, then remaining images by dateTaken descending
    // Use id as tiebreaker for stable sorting when dates are equal
    const galleryImages = [...images].sort((a, b) => {
        if (a.isThumbnail) return -1;
        if (b.isThumbnail) return 1;

        const aDate = new Date(a.dateTaken).getTime();
        const bDate = new Date(b.dateTaken).getTime();
        if (bDate !== aDate) return bDate - aDate;
        return a.id - b.id;
    });

    // Sort images for carousel: exclude thumbnail, then remaining images by dateTaken descending (most recent first)
    // Use id as tiebreaker for stable sorting when dates are equal
    const carouselImages = [...images]
        .filter((i: any) => !i.isThumbnail)
        .sort((a, b) => {
            const aDate = new Date(a.dateTaken).getTime();
            const bDate = new Date(b.dateTaken).getTime();
            if (bDate !== aDate) return bDate - aDate;
            return a.id - b.id;
        });

    const currentImage = carouselImages[selectedImage] || carouselImages[0] || thumbnailImage;

    const openLightbox = () => {
        if (!currentImage) return;
        if ((currentImage as any).isThumbnail) return;
        setLightboxZoom(1);
        setLightboxPan({ x: 0, y: 0 });
        setIsPanning(false);
        panStartRef.current = null;
        panOriginRef.current = null;
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
        setIsPanning(false);
        panStartRef.current = null;
        panOriginRef.current = null;
    };

    return (
        <>
            <DeepLinkBanner deviceId={id as string} />
            <div className="w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Top Bar with Back Link and Actions */}
                <div className="flex items-center justify-between mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors group"
                >
                    <svg width="16" height="16" className="transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Inventory
                </Link>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    {/* Main Actions - Top row on mobile */}
                    <div className="flex items-center gap-2">
                        {isAuthenticated && (
                            <div className="relative group">
                                <button
                                    onClick={handleToggleFavorite}
                                    disabled={togglingFavorite}
                                    aria-label={device.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                    className={`inline-flex items-center justify-center p-2 ${
                                        device.isFavorite
                                            ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600'
                                            : 'btn-retro'
                                    } rounded transition-colors disabled:opacity-50`}
                                >
                                    <svg width="16" height="16" fill={device.isFavorite ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </button>
                                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                    {device.isFavorite ? 'Unfavorite' : 'Favorite'}
                                </span>
                            </div>
                        )}

                        <div className="relative group">
                            <button
                                onClick={() => setShowShareModal(true)}
                                aria-label="Share device"
                                className="btn-retro inline-flex items-center justify-center p-2"
                            >
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                            </button>
                            <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                Share
                            </span>
                        </div>

                        {isAuthenticated && (
                            <div className="relative group">
                                <Link
                                    href={`/devices/${id}/edit`}
                                    aria-label="Edit device"
                                    className="btn-retro inline-flex items-center justify-center p-2"
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </Link>
                                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                    Edit
                                </span>
                            </div>
                        )}

                        {isAuthenticated && (
                            <div className="relative group">
                                <button
                                    onClick={handleUpdateLastPowerOnDate}
                                    disabled={updatingPowerDate}
                                    aria-label="Mark as powered on"
                                    className="inline-flex items-center justify-center p-2 text-[var(--apple-green)] bg-[var(--card)] border border-[var(--apple-green)] rounded hover:brightness-110 transition-colors disabled:opacity-50"
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </button>
                                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                    {updatingPowerDate ? 'Updating...' : 'Power On'}
                                </span>
                            </div>
                        )}

                        {isAuthenticated && (
                            <div className="relative group">
                                <button
                                    onClick={() => setDeleteDeviceConfirm(true)}
                                    aria-label="Delete device"
                                    className="inline-flex items-center justify-center p-2 text-[var(--apple-red)] bg-[var(--card)] border border-[var(--apple-red)] rounded hover:brightness-110 transition-colors"
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                    Delete
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="hidden sm:block w-px h-6 bg-[var(--border)] mx-1" />

                    {/* Helper Actions - Bottom row on mobile (only shown when authenticated) */}
                    {isAuthenticated && (
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <button
                                    onClick={() => setShowUploader(true)}
                                    aria-label="Add Photos"
                                    className="btn-retro inline-flex items-center justify-center p-2"
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </button>
                                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                    Add Photos
                                </span>
                            </div>

                            <div className="relative group">
                                <button
                                    onClick={() => setShowMaintenanceForm(true)}
                                    aria-label="Add Maintenance Task"
                                    className="btn-retro inline-flex items-center justify-center p-2"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                                    </svg>
                                </button>
                                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                    Add Maintenance
                                </span>
                            </div>

                            <div className="relative group">
                                <button
                                    onClick={() => setShowNoteForm(true)}
                                    aria-label="Add Note"
                                    className="btn-retro inline-flex items-center justify-center p-2"
                                >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>
                                <span className="pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                                    Add Note
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:[grid-template-columns:minmax(0,1fr)_24rem] 2xl:[grid-template-columns:minmax(0,1fr)_28rem] gap-12">
                {/* Left Column: Images */}
                <div className="space-y-4 order-2 lg:order-1">
                    {/* Main Image */}
                    <div className="group relative aspect-[4/3] w-full rounded-xl bg-[var(--muted)] overflow-hidden card-retro">
                        {currentImage ? (
                            <img
                                src={`${API_BASE_URL}${currentImage.path}`}
                                alt={currentImage.caption || device.name}
                                className={`h-full w-full object-contain ${(currentImage as any).isThumbnail ? "" : "cursor-zoom-in"}`}
                                onClick={(currentImage as any).isThumbnail ? undefined : openLightbox}
                            />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center">
                                <div className="text-center">
                                    <svg width="48" height="48" className="mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="mt-2 text-sm text-[var(--muted-foreground)]">No image available</p>
                                </div>
                            </div>
                        )}

                        {currentImage?.dateTaken && (
                            <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2 py-1 text-xs text-white backdrop-blur-sm pointer-events-none">
                                {formatDateForDisplay(currentImage.dateTaken)}
                            </div>
                        )}

                        {carouselImages.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedImage((prev) =>
                                            (prev - 1 + carouselImages.length) % carouselImages.length
                                        )
                                    }
                                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-[var(--card)]/80 p-2 text-[var(--foreground)] shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--card)]"
                                    aria-label="Previous image"
                                >
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedImage((prev) => (prev + 1) % carouselImages.length)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[var(--card)]/80 p-2 text-[var(--foreground)] shadow-sm opacity-0 transition-opacity group-hover:opacity-100 hover:bg-[var(--card)]"
                                    aria-label="Next image"
                                >
                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Thumbnail Strip */}
                    {carouselImages.length > 1 && (
                        <div className="thumbnail-strip flex gap-2 overflow-x-auto overflow-y-visible pt-1 pb-2 px-1">
                            {carouselImages.map((img: any, idx: number) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(idx)}
                                    className={`flex-shrink-0 h-16 w-16 rounded-lg overflow-hidden transition-all ${
                                        selectedImage === idx
                                            ? "ring-2 ring-[var(--foreground)] ring-offset-2 ring-offset-[var(--background)]"
                                            : "opacity-60 hover:opacity-100"
                                    }`}
                                >
                                    <img
                                        src={`${API_BASE_URL}${img.thumbnailPath || img.path}`}
                                        alt={img.caption || `${device.name} ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Image Management */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-[var(--foreground)]">Photos</h3>
                        <button
                            onClick={() => setShowUploader(true)}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc] transition-colors"
                        >
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Photos
                        </button>
                    </div>

                    <ImageGallery images={galleryImages} onImagesChanged={refetch} />

                    {/* Maintenance Tasks */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-[var(--foreground)]">Maintenance Tasks</h3>
                            <button
                                onClick={() => setShowMaintenanceForm(true)}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc] transition-colors"
                            >
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Task
                            </button>
                        </div>
                        {device.maintenanceTasks && device.maintenanceTasks.length > 0 && (
                            <div className="space-y-3">
                                {[...device.maintenanceTasks].sort((a, b) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime()).map((task: any) => (
                                    <div
                                        key={task.id}
                                        className="relative bg-[var(--card)] border border-[var(--border)] rounded p-4 group card-retro"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="text-sm font-medium text-[var(--foreground)]">{task.label}</h4>
                                                {task.notes && (
                                                    <p className="text-sm text-[var(--muted-foreground)] mt-1 whitespace-pre-wrap">{task.notes}</p>
                                                )}
                                                {task.cost != null && (
                                                    <p className="text-xs text-[var(--muted-foreground)] mt-1">Cost: ${Number(task.cost).toFixed(2)}</p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-[var(--muted-foreground)]">
                                                    {new Date(task.dateCompleted).toLocaleDateString('en-US', {
                                                        timeZone: 'UTC',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                                <button
                                                    onClick={() => setDeleteTaskId(task.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                                    title="Delete maintenance task"
                                                >
                                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Delete confirmation overlay */}
                                        {deleteTaskId === task.id && (
                                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 rounded-lg">
                                                <p className="text-white text-sm text-center mb-3">Delete this maintenance task?</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDeleteMaintenanceTask()}
                                                        disabled={deletingTask}
                                                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        {deletingTask ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteTaskId(null)}
                                                        className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded hover:bg-gray-100"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                    </div>

                    {/* Add Maintenance Task Modal */}
                    {showMaintenanceForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowMaintenanceForm(false)}>
                            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 card-retro w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                <h4 className="text-lg font-medium text-[var(--foreground)] mb-4">Add Maintenance Task</h4>
                                <form onSubmit={handleCreateMaintenanceTask} className="space-y-4">
                                    <div className="relative">
                                        <label htmlFor="label" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                                            Task Label *
                                        </label>
                                        <input
                                            type="text"
                                            id="label"
                                            value={maintenanceFormData.label}
                                            onChange={(e) => {
                                                setMaintenanceFormData(prev => ({ ...prev, label: e.target.value }));
                                                setShowLabelSuggestions(true);
                                            }}
                                            onFocus={() => setShowLabelSuggestions(true)}
                                            onBlur={() => setTimeout(() => setShowLabelSuggestions(false), 150)}
                                            className="input-retro w-full px-3 py-2 text-[var(--foreground)]"
                                            required
                                            autoFocus
                                            autoComplete="off"
                                        />
                                        {showLabelSuggestions && maintenanceFormData.label.trim() && (
                                            (() => {
                                                const searchTerm = maintenanceFormData.label.toLowerCase().trim();
                                                const suggestions = (taskLabelsData?.maintenanceTaskLabels || [])
                                                    .filter((label: string) => 
                                                        label.toLowerCase().includes(searchTerm) && 
                                                        label.toLowerCase() !== searchTerm
                                                    )
                                                    .slice(0, 8);
                                                
                                                if (suggestions.length === 0) return null;
                                                
                                                return (
                                                    <div className="absolute z-10 w-full mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg max-h-48 overflow-y-auto">
                                                        {suggestions.map((label: string, idx: number) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                className="w-full px-3 py-2 text-left text-sm text-[var(--foreground)] hover:bg-[var(--muted)] focus:bg-[var(--muted)] focus:outline-none"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    setMaintenanceFormData(prev => ({ ...prev, label }));
                                                                    setShowLabelSuggestions(false);
                                                                }}
                                                            >
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="dateCompleted" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                                            Date Completed *
                                        </label>
                                        <input
                                            type="date"
                                            id="dateCompleted"
                                            value={maintenanceFormData.dateCompleted}
                                            onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, dateCompleted: e.target.value }))}
                                            className="input-retro w-full px-3 py-2 text-[var(--foreground)]"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="notes" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                                            Notes
                                        </label>
                                        <textarea
                                            id="notes"
                                            value={maintenanceFormData.notes}
                                            onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, notes: e.target.value }))}
                                            rows={3}
                                            className="input-retro w-full px-3 py-2 text-[var(--foreground)]"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="cost" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                                            Cost (optional)
                                        </label>
                                        <input
                                            type="number"
                                            id="cost"
                                            min="0"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={maintenanceFormData.cost}
                                            onChange={(e) => setMaintenanceFormData(prev => ({ ...prev, cost: e.target.value }))}
                                            className="input-retro w-full px-3 py-2 text-[var(--foreground)]"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowMaintenanceForm(false)}
                                            className="btn-retro px-4 py-2 text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creatingTask}
                                            className="px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {creatingTask ? 'Adding...' : 'Add Task'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}


                    {/* Notes */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-medium text-[var(--foreground)]">Notes</h3>
                            <button
                                onClick={() => setShowNoteForm(true)}
                                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc] transition-colors"
                            >
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Add Note
                            </button>
                        </div>
                        {device.notes && device.notes.length > 0 && (
                            <div className="space-y-3">
                                {[...device.notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((note: any) => (
                                    <div
                                        key={note.id}
                                        className="relative bg-[var(--card)] border border-[var(--border)] rounded p-4 group card-retro"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                {editingNoteId === note.id ? (
                                                    // Edit form
                                                    <form onSubmit={handleUpdateNote} className="space-y-3">
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                                                                Note Content *
                                                            </label>
                                                            <textarea
                                                                value={editNoteFormData.content}
                                                                onChange={(e) => setEditNoteFormData(prev => ({ ...prev, content: e.target.value }))}
                                                                rows={3}
                                                                className="input-retro w-full px-3 py-2 text-[var(--foreground)]"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                                                                Date *
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                value={editNoteFormData.date}
                                                                onChange={(e) => setEditNoteFormData(prev => ({ ...prev, date: e.target.value }))}
                                                                className="input-retro w-full px-3 py-2 text-[var(--foreground)]"
                                                                required
                                                            />
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setEditingNoteId(null)}
                                                                className="btn-retro px-3 py-1.5 text-sm font-medium"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                type="submit"
                                                                disabled={updatingNote}
                                                                className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc] disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {updatingNote ? 'Updating...' : 'Update'}
                                                            </button>
                                                        </div>
                                                    </form>
                                                ) : (
                                                    // Display mode
                                                    <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{linkifyText(note.content)}</p>
                                                )}
                                            </div>
                                            {editingNoteId !== note.id && (
                                                <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
                                                    <span className="text-xs text-[var(--muted-foreground)] leading-tight text-right">
                                                        <span className="block sm:inline">
                                                            {new Date(note.date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                        <span className="block sm:inline sm:ml-1">
                                                            {new Date(note.date).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </span>
                                                    <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                                                        <button
                                                            onClick={() => handleEditNote(note)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-all"
                                                            title="Edit note"
                                                        >
                                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteNoteId(note.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                                                            title="Delete note"
                                                        >
                                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Delete confirmation overlay */}
                                        {deleteNoteId === note.id && (
                                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 rounded-lg">
                                                <p className="text-white text-sm text-center mb-3">Delete this note?</p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleDeleteNote()}
                                                        disabled={deletingNote}
                                                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                                                    >
                                                        {deletingNote ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteNoteId(null)}
                                                        className="px-3 py-1.5 bg-white text-gray-700 text-sm rounded hover:bg-gray-100"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Add Note Modal */}
                    {showNoteForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNoteForm(false)}>
                            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 card-retro w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
                                <h4 className="text-lg font-medium text-[var(--foreground)] mb-4">Add Note</h4>
                                <form onSubmit={handleCreateNote} className="space-y-4">
                                    <div>
                                        <label htmlFor="noteContent" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                                            Note Content *
                                        </label>
                                        <textarea
                                            id="noteContent"
                                            value={noteFormData.content}
                                            onChange={(e) => setNoteFormData(prev => ({ ...prev, content: e.target.value }))}
                                            rows={4}
                                            className="input-retro w-full px-3 py-2 text-[var(--foreground)]"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="noteDate" className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                                            Date *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="noteDate"
                                            value={noteFormData.date}
                                            onChange={(e) => setNoteFormData(prev => ({ ...prev, date: e.target.value }))}
                                            className="input-retro w-full px-3 py-2 text-[var(--foreground)]"
                                            required
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowNoteForm(false)}
                                            className="btn-retro px-4 py-2 text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={creatingNote}
                                            className="px-4 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc] disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {creatingNote ? 'Adding...' : 'Add Note'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </div>

                {/* Right Column: Details */}
                <div className="space-y-6 order-1 lg:order-2">
                    {/* Header */}
                    <div>
                        <span className="text-sm font-medium text-[var(--muted-foreground)] mb-3 block">
                            {device.category.name}
                        </span>
                        <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">
                            {device.name}
                            {device.additionalName && (
                                <span className="text-[var(--muted-foreground)] font-normal"> {device.additionalName}</span>
                            )}
                        </h1>
                        <p className="text-lg text-[var(--muted-foreground)] mt-1">
                            {(device.manufacturer || device.modelNumber) ? `${device.manufacturer || ''} ${device.modelNumber || ''}`.trim() : ''}
                        </p>
                        <div className="flex items-center gap-3 mt-4">
                            <StatusBadge status={device.status} />
                            <StatusIndicatorIcons device={device} />
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                            Tags
                        </h2>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {(device.tags ?? []).map((t: any) => (
                                <span
                                    key={t.id}
                                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-[var(--card)] text-[var(--foreground)] rounded ring-1 ring-inset ring-[var(--border)]"
                                >
                                    {t.name}
                                    {isAuthenticated && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTag(t.id)}
                                            disabled={removingTag}
                                            className="ml-1 inline-flex items-center justify-center rounded hover:bg-[var(--muted)] px-1 disabled:opacity-50"
                                            aria-label={`Remove tag ${t.name}`}
                                            title="Remove tag"
                                        >
                                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </span>
                            ))}
                            {(device.tags ?? []).length === 0 && (
                                <span className="text-sm text-[var(--muted-foreground)]">No tags</span>
                            )}
                        </div>
                        {isAuthenticated && (
                            <form onSubmit={handleAddTag} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={tagName}
                                    onChange={(e) => setTagName(e.target.value)}
                                    list="tag-suggestions"
                                    placeholder="Add a tag"
                                    className="input-retro flex-1 px-3 py-2 text-[var(--foreground)]"
                                />
                                <datalist id="tag-suggestions">
                                    {(tagsData?.tags ?? [])
                                        .filter((t: any) => {
                                            const n = (t?.name ?? '').toLowerCase();
                                            if (!n) return false;
                                            return !existingTagNames.has(n);
                                        })
                                        .map((t: any) => (
                                            <option key={t.id} value={t.name} />
                                        ))}
                                </datalist>
                                <button
                                    type="submit"
                                    disabled={addingTag}
                                    className="px-3 py-2 text-sm font-medium text-white bg-[var(--apple-blue)] hover:brightness-110 rounded border border-[#007acc] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {addingTag ? 'Adding...' : 'Add'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Specifications */}
                    <div className="bg-[var(--muted)] rounded-xl p-5 card-retro">
                        <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                            Specifications
                        </h2>
                        <dl>
                            <DetailRow label="Device ID" value={device.id} />
                            <DetailRow label="Serial Number" value={device.serialNumber} />
                            <DetailRow label="Release Year" value={device.releaseYear} />
                            <DetailRow label="Location" value={device.location} />
                            {device.lastPowerOnDate && (
                                <DetailRow
                                    label="Last Used"
                                    value={new Date(device.lastPowerOnDate).toLocaleDateString('en-US', {
                                        timeZone: 'UTC',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                    })}
                                />
                            )}
                            {device.externalUrl && (
                                <DetailRow
                                    label="External Link"
                                    value={
                                        <a href={device.externalUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--apple-blue)] hover:underline">
                                            View
                                        </a>
                                    }
                                />
                            )}
                        </dl>
                    </div>

                    {/* Computer Specs - only show for COMPUTER category */}
                    {device.category.type === "COMPUTER" && (device.cpu || device.ram || device.graphics || device.storage || device.operatingSystem || device.isWifiEnabled !== null || device.isPramBatteryRemoved !== null || device.lastPowerOnDate) && (
                        <div className="bg-[var(--muted)] rounded-xl p-5 card-retro">
                            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                                Computer Specs
                            </h2>
                            <dl>
                                <DetailRow label="CPU" value={device.cpu} />
                                <DetailRow label="RAM" value={device.ram} />
                                <DetailRow label="Graphics" value={device.graphics} />
                                <DetailRow label="Storage" value={device.storage} />
                                <DetailRow label="Operating System" value={device.operatingSystem} />
                                {device.isWifiEnabled !== null && (
                                    <DetailRow label="WiFi Enabled" value={device.isWifiEnabled ? "Yes" : "No"} />
                                )}
                                {device.isPramBatteryRemoved !== null && (
                                    <DetailRow label="PRAM Battery Removed" value={device.isPramBatteryRemoved ? "Yes" : "No"} />
                                )}
                            </dl>
                        </div>
                    )}

                    {/* Acquisition Info */}
                    {(device.dateAcquired || device.whereAcquired || device.priceAcquired || device.estimatedValue) && (
                        <div className="bg-[var(--muted)] rounded-xl p-5 card-retro">
                            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                                Acquisition
                            </h2>
                            <dl>
                                {device.dateAcquired && (
                                    <DetailRow
                                        label="Date Acquired"
                                        value={new Date(device.dateAcquired).toLocaleDateString('en-US', {
                                            timeZone: 'UTC',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    />
                                )}
                                <DetailRow label="Where Acquired" value={device.whereAcquired} />
                                {device.priceAcquired !== null && device.priceAcquired !== undefined && (
                                    <DetailRow label="Price Acquired" value={`$${Number(device.priceAcquired).toFixed(2)}`} />
                                )}
                                {device.estimatedValue !== null && device.estimatedValue !== undefined && (
                                    <DetailRow label="Estimated Value" value={`$${Number(device.estimatedValue).toFixed(2)}`} />
                                )}
                            </dl>
                        </div>
                    )}

                    {/* Value History */}
                    {isAuthenticated && (
                        <div className="bg-[var(--muted)] rounded-xl p-5 card-retro">
                            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                                Value History
                            </h2>
                            <DeviceValueChart
                                data={(valueHistoryData?.valueHistory ?? []).map((s: any) => ({
                                    date: new Date(s.snapshotDate).toLocaleDateString("en-US", { timeZone: "UTC", month: "short", year: "2-digit" }),
                                    dateMs: new Date(s.snapshotDate).getTime(),
                                    value: s.estimatedValue ?? 0,
                                }))}
                            />
                        </div>
                    )}

                    {/* Sales Info - show for FOR_SALE, PENDING_SALE, SOLD, or DONATED status */}
                    {(device.status === "FOR_SALE" || device.status === "PENDING_SALE" || device.status === "SOLD" || device.status === "DONATED") && (device.listPrice || device.soldPrice || device.soldDate) && (
                        <div className="bg-[var(--muted)] rounded-xl p-5 card-retro">
                            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                                {device.status === "DONATED" ? "Donation Info" : "Sales Info"}
                            </h2>
                            <dl>
                                {device.listPrice !== null && device.listPrice !== undefined && (
                                    <DetailRow label="List Price" value={`$${Number(device.listPrice).toFixed(2)}`} />
                                )}
                                {device.status === "SOLD" && device.soldPrice !== null && device.soldPrice !== undefined && (
                                    <DetailRow label="Sold Price" value={`$${Number(device.soldPrice).toFixed(2)}`} />
                                )}
                                {(device.status === "SOLD" || device.status === "DONATED") && device.soldDate && (
                                    <DetailRow
                                        label={device.status === "DONATED" ? "Donated Date" : "Sold Date"}
                                        value={new Date(device.soldDate).toLocaleDateString('en-US', {
                                            timeZone: 'UTC',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    />
                                )}
                            </dl>
                        </div>
                    )}

                    {/* Custom Fields */}
                    {device.customFieldValues && device.customFieldValues.length > 0 && (
                        <div className="bg-[var(--muted)] rounded-xl p-5 card-retro">
                            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                                Custom Fields
                            </h2>
                            <dl>
                                {[...device.customFieldValues]
                                    .sort((a: any, b: any) => a.sortOrder - b.sortOrder || a.customFieldName.localeCompare(b.customFieldName))
                                    .map((cfv: any) => (
                                        <DetailRow key={cfv.id} label={cfv.customFieldName} value={cfv.value} />
                                    ))}
                            </dl>
                        </div>
                    )}

                    {/* Additional Info */}
                    {device.info && (
                        <div>
                            <h2 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">
                                Description
                            </h2>
                            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
                                {device.info}
                            </p>
                        </div>
                    )}

                </div>
            </div>

            {/* Image Uploader Modal */}
            {showUploader && (
                <ImageUploader
                    deviceId={device.id}
                    onClose={() => setShowUploader(false)}
                    onUploadComplete={refetch}
                />
            )}

            {/* Delete Device Confirmation Modal */}
            {deleteDeviceConfirm && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
                    <div className="bg-[var(--card)] rounded border border-[var(--border)] p-6 max-w-md w-full card-retro">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                <svg width="20" height="20" className="text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--foreground)]">Move to Trash</h3>
                                <p className="text-sm text-[var(--muted-foreground)]">The device will no longer be visible.</p>
                            </div>
                        </div>
                        <p className="text-sm text-[var(--foreground)] mb-6">
                            Are you sure you want to move <strong>{device.name}</strong> to the trash? The device will no longer be visible in your collection but can be restored later.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteDeviceConfirm(false)}
                                className="btn-retro px-4 py-2 text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteDevice}
                                disabled={deletingDevice}
                                className="px-4 py-2 text-sm font-medium text-white bg-[var(--apple-red)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed rounded border border-[#c02020] transition-colors"
                            >
                                {deletingDevice ? 'Moving...' : 'Move to Trash'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLightboxOpen && currentImage && !(currentImage as any).isThumbnail && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                    onMouseUp={() => setIsPanning(false)}
                    onMouseLeave={() => setIsPanning(false)}
                    onClick={closeLightbox}
                >
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                applyLightboxZoom((prev) => prev / 1.2);
                            }}
                            className="rounded-full bg-white/15 hover:bg-white/25 text-white p-2"
                            aria-label="Zoom out"
                        >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                applyLightboxZoom((prev) => prev * 1.2);
                            }}
                            className="rounded-full bg-white/15 hover:bg-white/25 text-white p-2"
                            aria-label="Zoom in"
                        >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                closeLightbox();
                            }}
                            className="rounded-full bg-white/15 hover:bg-white/25 text-white p-2"
                            aria-label="Close"
                        >
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 hover:bg-white/25 text-white p-3"
                        aria-label="Previous image"
                    >
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImage((prev) => (prev + 1) % carouselImages.length);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 hover:bg-white/25 text-white p-3"
                        aria-label="Next image"
                    >
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div
                        className="max-w-[95vw] max-h-[95vh] overflow-hidden"
                        ref={lightboxContainerRef}
                        onClick={(e) => e.stopPropagation()}
                        onWheel={(e) => {
                            e.preventDefault();
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const anchor = {
                                x: e.clientX - rect.left - rect.width / 2,
                                y: e.clientY - rect.top - rect.height / 2,
                            };

                            lastPointerOffsetRef.current = anchor;

                            const direction = e.deltaY > 0 ? -1 : 1;
                            applyLightboxZoom((prev) => (direction > 0 ? prev * 1.1 : prev / 1.1), anchor);
                        }}
                        onDoubleClick={(e) => {
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            const anchor = {
                                x: e.clientX - rect.left - rect.width / 2,
                                y: e.clientY - rect.top - rect.height / 2,
                            };

                            lastPointerOffsetRef.current = anchor;
                            applyLightboxZoom((prev) => (prev <= 1.01 ? 2 : 1), anchor);
                        }}
                        onMouseDown={(e) => {
                            if (lightboxZoom <= 1.01) return;
                            setIsPanning(true);
                            panStartRef.current = { x: e.clientX, y: e.clientY };
                            panOriginRef.current = { x: lightboxPan.x, y: lightboxPan.y };
                        }}
                        onMouseMove={(e) => {
                            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                            lastPointerOffsetRef.current = {
                                x: e.clientX - rect.left - rect.width / 2,
                                y: e.clientY - rect.top - rect.height / 2,
                            };
                            if (!isPanning) return;
                            if (!panStartRef.current || !panOriginRef.current) return;
                            const dx = e.clientX - panStartRef.current.x;
                            const dy = e.clientY - panStartRef.current.y;
                            setLightboxPan({
                                x: panOriginRef.current.x + dx,
                                y: panOriginRef.current.y + dy,
                            });
                        }}
                        onMouseUp={() => {
                            setIsPanning(false);
                            panStartRef.current = null;
                            panOriginRef.current = null;
                        }}
                        style={{ cursor: lightboxZoom > 1.01 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-out' }}
                    >
                        <img
                            src={`${API_BASE_URL}${currentImage.path}`}
                            alt={currentImage.caption || device.name}
                            draggable={false}
                            className="max-w-[95vw] max-h-[95vh] select-none"
                            style={{
                                transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                                transformOrigin: 'center',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Share Modal */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                deviceUrl={typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_BASE_URL || ''}/devices/${id}`}
                deviceName={device.name}
                additionalName={device.additionalName}
                deviceId={device.id}
            />
            </div>
        </>
    );
}
