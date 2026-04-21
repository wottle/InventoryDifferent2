"use client";

import { useQuery, useMutation } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImageUploader } from "../../../components/ImageUploader";
import { ShareModal } from "../../../components/ShareModal";
import { LoadingPanel } from "../../../components/LoadingPanel";
import { DeepLinkBanner } from "../../../components/DeepLinkBanner";
import { useAuth } from "../../../lib/auth-context";
import { useIsDarkMode } from "../../../lib/useIsDarkMode";
import { pickThumbnail } from "../../../lib/pickThumbnail";
import { API_BASE_URL } from "../../../lib/config";
import { useT } from "../../../i18n/context";

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
      location {
        id
        name
      }
      info
      historicalNotes
      isFavorite
      externalUrl
      status
      functionalStatus
      condition
      rarity
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
        thumbnailMode
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
      accessories {
        id
        name
      }
      links {
        id
        label
        url
      }
      relationsFrom {
        id
        type
        toDeviceId
        toDevice {
          id
          name
          manufacturer
          images { id thumbnailPath isThumbnail }
        }
      }
      relationsTo {
        id
        type
        fromDeviceId
        fromDevice {
          id
          name
          manufacturer
          images { id thumbnailPath isThumbnail }
        }
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

const ADD_DEVICE_ACCESSORY = gql`
  mutation AddDeviceAccessory($deviceId: Int!, $name: String!) {
    addDeviceAccessory(deviceId: $deviceId, name: $name) {
      id
      name
    }
  }
`;

const REMOVE_DEVICE_ACCESSORY = gql`
  mutation RemoveDeviceAccessory($id: Int!) {
    removeDeviceAccessory(id: $id)
  }
`;

const ADD_DEVICE_LINK = gql`
  mutation AddDeviceLink($deviceId: Int!, $label: String!, $url: String!) {
    addDeviceLink(deviceId: $deviceId, label: $label, url: $url) {
      id
      label
      url
    }
  }
`;

const REMOVE_DEVICE_LINK = gql`
  mutation RemoveDeviceLink($id: Int!) {
    removeDeviceLink(id: $id)
  }
`;

const GET_ALL_DEVICES_SIMPLE = gql`
  query GetAllDevicesSimple {
    devices(where: { deleted: { equals: false } }) {
      id
      name
      manufacturer
    }
  }
`;

const ADD_DEVICE_RELATIONSHIP = gql`
  mutation AddDeviceRelationship($fromDeviceId: Int!, $toDeviceId: Int!, $type: String!) {
    addDeviceRelationship(fromDeviceId: $fromDeviceId, toDeviceId: $toDeviceId, type: $type) {
      id
      relationsFrom {
        id
        type
        toDeviceId
        toDevice { id name manufacturer images { id thumbnailPath isThumbnail } }
      }
      relationsTo {
        id
        type
        fromDeviceId
        fromDevice { id name manufacturer images { id thumbnailPath isThumbnail } }
      }
    }
  }
`;

const REMOVE_DEVICE_RELATIONSHIP = gql`
  mutation RemoveDeviceRelationship($id: Int!) {
    removeDeviceRelationship(id: $id)
  }
`;

const UPDATE_DEVICE_STATUS = gql`
  mutation UpdateDeviceStatus($input: DeviceUpdateInput!) {
    updateDevice(input: $input) {
      id
      status
    }
  }
`;

const ICON_PATHS: Record<string, string> = {
  check_circle: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.09L5.5 11l1.41-1.41 3.09 3.08 7.09-7.07 1.41 1.41-8.5 8.5z",
  star: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z",
  sell: "M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4a2 2 0 00-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58s1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z",
  package: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  battery_alert: "M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18h-2v-2h2v2zm0-4h-2V9h2v5z",
  favorite: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  power_settings_new: "M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0119 12c0 3.87-3.13 7-7 7A7 7 0 015 12c0-2.28 1.09-4.3 2.58-5.42L6.17 5.17A8.932 8.932 0 003 12a9 9 0 009 9 9 9 0 009-9c0-2.73-1.22-5.16-3.17-6.83z",
  image_icon: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  build: "M13.78 15.3L19.78 21.3l2.11-2.16-5.97-6 2.11-2.14zM17.5 10c.28 0 .55-.03.8-.07l-3.58-3.58-.07.8c-.06.74.13 1.47.56 2.04.5.65 1.26 1.01 2.09 1.03.07 0 .14-.01.2-.02zM5.17 5.17L3.76 6.59 6.34 9.17 4.91 10.6l-2.58-2.58L.92 9.43l3.59 3.59L1.79 14.76.38 13.35 2 14.97l5.67 5.67 1.41-1.41-1.41-1.41 1.59-1.59 3.37 3.37 1.41-1.41-9.27-13z",
  description: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  pending_actions: "M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z",
  shopping_cart_checkout: "M15.55 13c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0019.99 4H5.21l-.94-2H1v2h2l3.6 7.59L5.25 14c-.16.28-.25.61-.25.96C5 16.1 5.9 17 7 17s2-.9 2-2-.9-2-2-2H5.82zM7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm8 0c-1.1 0-1.99.9-1.99 2S13.9 22 15 22s2-.9 2-2-.9-2-2-2zm2-7H8.53L6.87 6H19l-2 5z",
  edit: "M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  trending_up: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",
  add: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  share: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z",
  delete: "M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  arrow_back: "M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z",
};

function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const path = ICON_PATHS[name];
  if (!path) return null;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={path} />
    </svg>
  );
}

function SpecField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-outline text-[10px] uppercase tracking-tighter mb-1">{label}</span>
      <span className="text-on-surface font-semibold text-lg">{value}</span>
    </div>
  );
}

function IndicatorCard({ color, iconName, label, value }: { color: string; iconName: string; label: string; value: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    pink: { bg: 'bg-pink-50', text: 'text-pink-600' },
  };
  const c = colorMap[color] ?? colorMap.blue;
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col items-center text-center">
      <div className={`w-12 h-12 rounded-full ${c.bg} flex items-center justify-center mb-3`}>
        <Icon name={iconName} className={`w-6 h-6 ${c.text}`} />
      </div>
      <span className="text-outline text-[10px] uppercase tracking-tighter mb-1">{label}</span>
      <span className="text-on-surface font-bold">{value}</span>
    </div>
  );
}

function formatCurrency(value: number): string {
  return `$${Number(value).toFixed(2)}`;
}

function calcGainPct(acquired: number, estimated: number): string {
  if (!acquired || acquired === 0) return '';
  const pct = ((estimated - acquired) / acquired) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

function linkifyText(text: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urlTest = /^https?:\/\/[^\s]+$/;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlTest.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">
        {part}
      </a>
    ) : part
  );
}

function formatDateForDisplay(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function DeviceDetailNew() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const isDark = useIsDarkMode();
  const t = useT();

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceFormData, setMaintenanceFormData] = useState({
    label: '',
    dateCompleted: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
    notes: '',
    cost: '',
  });
  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);
  const [showLabelSuggestions, setShowLabelSuggestions] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteFormData, setNoteFormData] = useState({
    content: '',
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  });
  const [deleteNoteId, setDeleteNoteId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editNoteFormData, setEditNoteFormData] = useState({
    content: '',
    date: '',
  });
  const [tagName, setTagName] = useState('');
  const [tagToRemoveId, setTagToRemoveId] = useState<number | null>(null);
  const [newAccessoryName, setNewAccessoryName] = useState('');
  const [accessoryToRemoveId, setAccessoryToRemoveId] = useState<number | null>(null);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkToRemoveId, setLinkToRemoveId] = useState<number | null>(null);
  const [showRelationForm, setShowRelationForm] = useState(false);
  const [relationDeviceName, setRelationDeviceName] = useState('');
  const [relationType, setRelationType] = useState('');
  const [isRelationReversed, setIsRelationReversed] = useState(false);
  const [relationToRemoveId, setRelationToRemoveId] = useState<number | null>(null);
  const [deleteDeviceConfirm, setDeleteDeviceConfirm] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(false);

  const { loading, error, data, refetch } = useQuery(GET_DEVICE, {
    variables: { where: { id: parseInt(id as string), deleted: { equals: false } } },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });
  const { data: tagsData } = useQuery(GET_TAGS);
  const { data: taskLabelsData } = useQuery(GET_MAINTENANCE_TASK_LABELS);
  const { data: allDevicesData } = useQuery(GET_ALL_DEVICES_SIMPLE);
  const { data: valueHistoryData } = useQuery(GET_VALUE_HISTORY, {
    variables: { deviceId: parseInt(id as string) },
    skip: !id || !isAuthenticated,
  });

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
  const [addDeviceAccessory, { loading: addingAccessory }] = useMutation(ADD_DEVICE_ACCESSORY);
  const [removeDeviceAccessory] = useMutation(REMOVE_DEVICE_ACCESSORY);
  const [addDeviceLink, { loading: addingLink }] = useMutation(ADD_DEVICE_LINK);
  const [removeDeviceLink] = useMutation(REMOVE_DEVICE_LINK);
  const [addDeviceRelationship, { loading: addingRelationship }] = useMutation(ADD_DEVICE_RELATIONSHIP);
  const [removeDeviceRelationship] = useMutation(REMOVE_DEVICE_RELATIONSHIP);
  const [updateDeviceStatus, { loading: updatingStatus }] = useMutation(UPDATE_DEVICE_STATUS);

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
        return;
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingPanel title={t.detail.loading} subtitle={t.detail.loadingSubtitle} />
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
  const heroImages = [...images]
    .filter((i: any) => !i.isThumbnail)
    .sort((a: any, b: any) => new Date(b.dateTaken).getTime() - new Date(a.dateTaken).getTime());
  const heroImage = heroImages[0] || images[0];
  const photoGridImages = [...images].slice(0, 6);
  const sortedTasks = [...(device.maintenanceTasks ?? [])].sort(
    (a: any, b: any) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime()
  );
  const sortedNotes = [...(device.notes ?? [])].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

  const handleAddAccessory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const alreadyHas = (device.accessories ?? []).some((a: any) => a.name.toLowerCase() === trimmed.toLowerCase());
    if (alreadyHas) return;
    try {
      await addDeviceAccessory({ variables: { deviceId: device.id, name: trimmed } });
      setNewAccessoryName('');
      refetch();
    } catch (err) {
      console.error('Error adding accessory:', err);
    }
  };

  const handleRemoveAccessory = async (id: number) => {
    try {
      await removeDeviceAccessory({ variables: { id } });
      refetch();
    } catch (err) {
      console.error('Error removing accessory:', err);
    }
  };

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newLinkLabel.trim();
    const url = newLinkUrl.trim();
    if (!label || !url) return;
    try {
      await addDeviceLink({ variables: { deviceId: device.id, label, url } });
      setNewLinkLabel('');
      setNewLinkUrl('');
      setShowLinkForm(false);
      refetch();
    } catch (err) {
      console.error('Error adding link:', err);
    }
  };

  const handleRemoveLink = async (id: number) => {
    try {
      await removeDeviceLink({ variables: { id } });
      refetch();
    } catch (err) {
      console.error('Error removing link:', err);
    }
  };

  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    const type = relationType.trim();
    if (!type) return;
    const allDevices: any[] = allDevicesData?.devices ?? [];
    const matched = allDevices.find(
      (d: any) =>
        `${d.name}${d.manufacturer ? ` (${d.manufacturer})` : ''}` === relationDeviceName ||
        String(d.id) === relationDeviceName
    );
    if (!matched) return;
    try {
      const fromDeviceId = isRelationReversed ? matched.id : device.id;
      const toDeviceId = isRelationReversed ? device.id : matched.id;
      await addDeviceRelationship({
        variables: { fromDeviceId, toDeviceId, type },
      });
      setRelationDeviceName('');
      setRelationType('');
      setIsRelationReversed(false);
      setShowRelationForm(false);
      refetch();
    } catch (err) {
      console.error('Error adding relationship:', err);
    }
  };

  const handleRemoveRelationship = async (id: number) => {
    try {
      await removeDeviceRelationship({ variables: { id } });
      setRelationToRemoveId(null);
      refetch();
    } catch (err) {
      console.error('Error removing relationship:', err);
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
      setMaintenanceFormData({
        label: '',
        dateCompleted: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10),
        notes: '',
        cost: '',
      });
      setShowMaintenanceForm(false);
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
      refetch();
    } catch (err) {
      console.error('Error deleting maintenance task:', err);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dateTimeParts = noteFormData.date.split('T');
      const dateParts = dateTimeParts[0].split('-');
      const timeParts = dateTimeParts[1].split(':');
      const localDate = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1])
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
      setNoteFormData({
        content: '',
        date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      });
      setShowNoteForm(false);
      refetch();
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const handleEditNote = (note: any) => {
    setEditingNoteId(note.id);
    const utcDate = new Date(note.date);
    const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
    const localDateTimeString = localDate.toISOString().slice(0, 16);
    setEditNoteFormData({
      content: note.content,
      date: localDateTimeString,
    });
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteId) return;
    try {
      const dateTimeParts = editNoteFormData.date.split('T');
      const dateParts = dateTimeParts[0].split('-');
      const timeParts = dateTimeParts[1].split(':');
      const localDate = new Date(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        parseInt(timeParts[0]),
        parseInt(timeParts[1])
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
      setEditingNoteId(null);
      setEditNoteFormData({ content: '', date: '' });
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
      window.location.href = '/';
    } catch (err) {
      console.error('Error deleting device:', err);
      setDeleteDeviceConfirm(false);
    }
  };

  const handleSetStatus = async (newStatus: string) => {
    try {
      await updateDeviceStatus({
        variables: { input: { id: device.id, status: newStatus } },
      });
      refetch();
    } catch (err) {
      console.error('Error updating device status:', err);
    }
  };

  return (
    <div className="font-inter text-on-surface p-8">
      <p>Device detail redesign scaffold — {device.name}</p>
    </div>
  );
}
