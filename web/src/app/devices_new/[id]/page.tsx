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
import dynamic from "next/dynamic";
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
  open_in_new: "M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
  device_hub: "M17 16l-4-4V8.82C14.16 8.4 15 7.3 15 6c0-1.66-1.34-3-3-3S9 4.34 9 6c0 1.3.84 2.4 2 2.82V12l-4 4H3v5h5v-3.05l4-4.2 4 4.2V21h5v-5h-4z",
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
  const [showValueHistory, setShowValueHistory] = useState(false);
  const valueHistoryRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!showValueHistory) return;
    const handleOutside = (e: MouseEvent) => {
      if (valueHistoryRef.current && !valueHistoryRef.current.contains(e.target as Node)) {
        setShowValueHistory(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showValueHistory]);

  useEffect(() => {
    if (!showValueHistory) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowValueHistory(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showValueHistory]);

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
  const photoGridImages = [...images].slice(0, 5);
  const sortedTasks = [...(device.maintenanceTasks ?? [])].sort(
    (a: any, b: any) => new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime()
  );
  const sortedNotes = [...(device.notes ?? [])].sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const chartData = (valueHistoryData?.valueHistory ?? []).map((v: any) => ({
    date: new Date(v.snapshotDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    dateMs: new Date(v.snapshotDate).getTime(),
    value: v.estimatedValue,
  }));

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
    <div className="font-inter text-on-surface">
      <DeepLinkBanner deviceId={id as string} />

      {/* Back nav row */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group">
          <Icon name="arrow_back" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Inventory
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowShareModal(true)} title="Share" aria-label="Share" className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-all">
            <Icon name="share" className="w-5 h-5" />
          </button>
          {isAuthenticated && (
            <button onClick={() => setDeleteDeviceConfirm(true)} title="Delete device" aria-label="Delete device" className="p-2 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
              <Icon name="delete" className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Hero section — negative margins to break out of parent container padding */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8">
        <section className="relative h-[500px] w-full rounded-xl overflow-hidden group">
          {heroImage ? (
            <img
              src={`${API_BASE_URL}${heroImage.path}`}
              alt={heroImage.caption || device.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <Icon name="image_icon" className="w-16 h-16 text-outline" />
            </div>
          )}
          <div className="absolute inset-0 hero-gradient flex flex-col justify-end p-12">
            <span className="text-white/70 text-[11px] font-bold tracking-[0.2em] uppercase mb-2">
              {device.category?.name}{device.releaseYear ? ` • ${device.releaseYear}` : ''}
            </span>
            <h1 className="text-white text-5xl lg:text-6xl font-extrabold tracking-tighter mb-1 drop-shadow-lg">
              {device.name}{device.additionalName ? ` ${device.additionalName}` : ''}
            </h1>
            {device.info && (
              <p className="text-white/80 text-xl font-light line-clamp-2 max-w-2xl">{device.info}</p>
            )}
          </div>
          {isAuthenticated && (
            <Link
              href={`/devices/${id}/edit`}
              className="absolute top-6 right-6 flex items-center gap-2 px-6 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white border border-white/30 rounded-full text-sm font-semibold transition-all"
            >
              <Icon name="edit" className="w-4 h-4" />
              Edit Device
            </Link>
          )}
        </section>
      </div>

      {/* ===== MAIN 12-COLUMN GRID ===== */}
      <div className="grid grid-cols-12 gap-8 mt-12">

        {/* ===== LEFT COLUMN (col-span-8) ===== */}
        <div className="col-span-12 lg:col-span-8 space-y-8">

          {/* Quick Overview */}
          <section className="bg-surface-container-low p-8 rounded-xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Quick Overview</h2>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase">
                {(t.status as Record<string, string>)[device.status] ?? device.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12">
              {device.manufacturer && <SpecField label="Manufacturer" value={device.manufacturer} />}
              {device.modelNumber && <SpecField label="Model Number" value={device.modelNumber} />}
              {device.serialNumber && <SpecField label="Serial Number" value={device.serialNumber} />}
              {device.location && <SpecField label="Location" value={device.location.name} />}
              {device.lastPowerOnDate && <SpecField label="Last Used" value={new Date(device.lastPowerOnDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })} />}
              {device.releaseYear && <SpecField label="Release Year" value={String(device.releaseYear)} />}
            </div>
            {device.info && (
              <div className="mt-10 pt-8 border-t border-outline-variant/20">
                <span className="text-outline text-[10px] uppercase tracking-tighter mb-2 block">Device Notes</span>
                <p className={`text-on-surface-variant text-sm leading-relaxed ${infoExpanded ? '' : 'line-clamp-3'}`}>
                  {device.info}
                </p>
                <button onClick={() => setInfoExpanded(v => !v)} className="text-primary text-xs font-bold mt-2 hover:underline">
                  {infoExpanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
            )}
          </section>

          {/* Indicator Cards */}
          <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <IndicatorCard color="emerald" iconName="check_circle" label="Condition"
              value={device.functionalStatus === 'YES' ? 'Fully Working' : device.functionalStatus === 'PARTIAL' ? 'Partially Working' : 'Not Working'} />
            {device.rarity && <IndicatorCard color="amber" iconName="star" label="Rarity" value={device.rarity} />}
            <IndicatorCard color="blue" iconName="sell" label="Status" value={(t.status as Record<string, string>)[device.status] ?? device.status} />
            <IndicatorCard color="purple" iconName="package" label="Packaging" value={device.hasOriginalBox ? 'Original Box' : 'No Box'} />
            <IndicatorCard color="red" iconName="battery_alert" label="PRAM Battery" value={device.isPramBatteryRemoved ? 'Removed' : 'Present'} />
            <IndicatorCard color="pink" iconName="favorite" label="Priority" value={device.isFavorite ? 'Archival Fave' : 'Standard'} />
          </section>

          {/* Financials (auth-gated) */}
          {isAuthenticated && (device.priceAcquired != null || device.estimatedValue != null) && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {device.priceAcquired != null && (
                <div className="bg-white p-8 rounded-xl shadow-sm flex justify-between items-end border-l-4 border-primary">
                  <div>
                    <span className="text-outline text-[10px] uppercase tracking-widest block mb-1">Acquisition Price</span>
                    <span className="text-3xl font-bold text-on-surface">{formatCurrency(device.priceAcquired)}</span>
                  </div>
                  {device.estimatedValue != null && (
                    <div className="text-right">
                      <span className="text-emerald-600 text-sm font-bold block">{calcGainPct(device.priceAcquired, device.estimatedValue)}</span>
                      <span className="text-outline text-[10px] uppercase">since purchase</span>
                    </div>
                  )}
                </div>
              )}
              {device.estimatedValue != null && (
                <div ref={valueHistoryRef} className="relative bg-white p-8 rounded-xl shadow-sm flex justify-between items-end border-l-4 border-tertiary">
                  <div>
                    <span className="text-outline text-[10px] uppercase tracking-widest block mb-1">Estimated Value</span>
                    <span className="text-3xl font-bold text-on-surface">{formatCurrency(device.estimatedValue)}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Icon name="trending_up" className="w-6 h-6 text-tertiary" />
                    <button
                      type="button"
                      onClick={() => setShowValueHistory(v => !v)}
                      className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider"
                    >
                      History ↗
                    </button>
                  </div>
                  {/* Value History Popover */}
                  {showValueHistory && (
                    <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 bg-white rounded-xl shadow-lg border border-outline-variant/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-outline">Value History</span>
                        <button
                          type="button"
                          onClick={() => setShowValueHistory(false)}
                          aria-label="Close value history"
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm"
                        >×</button>
                      </div>
                      {chartData.length >= 2 ? (
                        <DeviceValueChart data={chartData} />
                      ) : (
                        <p className="text-xs text-on-surface-variant py-4 text-center">No history yet — value snapshots build as you update this device.</p>
                      )}
                      {chartData.length > 0 && (
                        <p className="text-[10px] text-outline mt-2 text-center">
                          {chartData.length} snapshot{chartData.length !== 1 ? 's' : ''} · first recorded {new Date(Math.min(...chartData.map((c: any) => c.dateMs))).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Technical Specs */}
          {(device.cpu || device.ram || device.storage || device.graphics || device.operatingSystem) && (
            <section className="bg-surface-container-low rounded-xl p-8">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-6">Technical Specifications</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {device.cpu && <SpecField label="Processor" value={device.cpu} />}
                {device.ram && <SpecField label="Memory (RAM)" value={device.ram} />}
                {device.storage && <SpecField label="Storage" value={device.storage} />}
                {device.graphics && <SpecField label="Graphics" value={device.graphics} />}
                {device.operatingSystem && <SpecField label="Operating System" value={device.operatingSystem} />}
                {device.isWifiEnabled != null && <SpecField label="WiFi" value={device.isWifiEnabled ? 'Yes' : 'No'} />}
              </div>
              {(device.customFieldValues ?? []).length > 0 && (
                <div className="mt-6 pt-6 border-t border-outline-variant/20 grid grid-cols-2 gap-x-8 gap-y-4">
                  {device.customFieldValues.map((cf: any) => (
                    <SpecField key={cf.id} label={cf.customFieldName} value={cf.value} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Historical Notes */}
          {device.historicalNotes && (
            <section className="py-4">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-4">Historical Significance</h2>
              <div className="text-on-surface-variant text-sm leading-relaxed space-y-4">
                {device.historicalNotes.split('\n\n').map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>
          )}

        {/* Accessories */}
        {((device.accessories ?? []).length > 0 || isAuthenticated) && (
          <section>
            <h2 className="text-on-surface font-bold text-[10px] uppercase tracking-widest mb-3">{t.detail.accessories}</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {(device.accessories ?? []).map((acc: any) => (
                <span key={acc.id} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-surface-container text-on-surface rounded-full border border-outline-variant/20">
                  {acc.name}
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => handleRemoveAccessory(acc.id)}
                      aria-label={`Remove accessory ${acc.name}`}
                      className="ml-1 hover:text-red-500 transition-colors"
                    >×</button>
                  )}
                </span>
              ))}
            </div>
            {isAuthenticated && (
              <form
                onSubmit={e => { e.preventDefault(); handleAddAccessory(newAccessoryName); }}
                className="flex items-center gap-2 mt-2"
              >
                <input
                  type="text"
                  value={newAccessoryName}
                  onChange={e => setNewAccessoryName(e.target.value)}
                  placeholder={t.detail.customAccessoryPlaceholder}
                  className="flex-1 px-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant/30 rounded-full focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={addingAccessory || !newAccessoryName.trim()}
                  className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-container disabled:opacity-50 transition-all"
                >Add</button>
              </form>
            )}
          </section>
        )}

        {/* Related Devices */}
        {(() => {
          const relatedFrom = (device.relationsFrom ?? []).map((r: any) => ({
            relationId: r.id,
            type: r.type,
            device: r.toDevice,
          }));
          const relatedTo = (device.relationsTo ?? []).map((r: any) => ({
            relationId: r.id,
            type: r.type,
            device: r.fromDevice,
          }));
          const allRelated = [...relatedFrom, ...relatedTo].filter(
            (r, idx, arr) => arr.findIndex(x => x.device?.id === r.device?.id) === idx
          );
          if (allRelated.length === 0) return null;
          return (
            <section>
              <h2 className="text-on-surface font-bold text-[10px] uppercase tracking-widest mb-3">{t.detail.relatedDevices}</h2>
              <div className="space-y-2">
                {allRelated.map(({ relationId, type, device: rel }) => {
                  if (!rel) return null;
                  const thumb = rel.images?.find((i: any) => i.isThumbnail) ?? rel.images?.[0];
                  return (
                    <Link
                      key={relationId}
                      href={`/devices_new/${rel.id}`}
                      className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img src={`${API_BASE_URL}${thumb.thumbnailPath || thumb.path}`} alt={rel.name} className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="device_hub" className="w-5 h-5 text-outline" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-on-surface truncate">{rel.name}</p>
                        {rel.manufacturer && <p className="text-xs text-on-surface-variant truncate">{rel.manufacturer}</p>}
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-outline bg-surface-container px-2 py-0.5 rounded-full flex-shrink-0">
                        {type.replace(/_/g, ' ')}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* Links */}
        {((device.links ?? []).length > 0 || isAuthenticated) && (
          <section>
            <h2 className="text-on-surface font-bold text-[10px] uppercase tracking-widest mb-3">{t.detail.referenceLinks}</h2>
            <div className="space-y-2 mb-3">
              {(device.links ?? []).map((link: any) => (
                <div key={link.id} className="flex items-center gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center gap-2 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors group min-w-0"
                  >
                    <Icon name="open_in_new" className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate">{link.label}</p>
                      <p className="text-[10px] text-outline truncate">{link.url}</p>
                    </div>
                  </a>
                  {isAuthenticated && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(link.id)}
                      aria-label={`Remove link ${link.label}`}
                      className="p-2 text-on-surface-variant hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <Icon name="delete" className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {isAuthenticated && !showLinkForm && (
              <button
                type="button"
                onClick={() => setShowLinkForm(true)}
                className="text-primary text-xs font-semibold hover:underline"
              >+ {t.detail.addLink}</button>
            )}
            {isAuthenticated && showLinkForm && (
              <form onSubmit={handleAddLink} className="space-y-2 mt-2">
                <input
                  type="text"
                  value={newLinkLabel}
                  onChange={e => setNewLinkLabel(e.target.value)}
                  placeholder={t.form.linkLabelPlaceholder}
                  className="w-full px-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <input
                  type="url"
                  value={newLinkUrl}
                  onChange={e => setNewLinkUrl(e.target.value)}
                  placeholder={t.form.linkUrlPlaceholder}
                  className="w-full px-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex gap-2">
                  <button type="submit" disabled={addingLink || !newLinkLabel.trim() || !newLinkUrl.trim()} className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-container disabled:opacity-50 transition-all">Add</button>
                  <button type="button" onClick={() => { setShowLinkForm(false); setNewLinkLabel(''); setNewLinkUrl(''); }} className="px-4 py-1.5 text-sm font-medium text-on-surface-variant bg-surface-container rounded-full hover:bg-surface-container-high transition-all">Cancel</button>
                </div>
              </form>
            )}
          </section>
        )}

          {/* Tags */}
          {((device.tags ?? []).length > 0 || isAuthenticated) && (
            <section>
              <h2 className="text-on-surface font-bold text-[10px] uppercase tracking-widest mb-3">Tags</h2>
              <div className="flex flex-wrap gap-2 mb-3">
                {(device.tags ?? []).map((tag: any) => (
                  <span key={tag.id} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-surface-container text-on-surface rounded-full border border-outline-variant/20">
                    {tag.name}
                    {isAuthenticated && (
                      <button type="button" onClick={() => handleRemoveTag(tag.id)} aria-label={`Remove tag ${tag.name}`} className="ml-1 hover:text-red-500 transition-colors">×</button>
                    )}
                  </span>
                ))}
              </div>
              {isAuthenticated && (
                <form onSubmit={handleAddTag} className="flex items-center gap-2 mt-2">
                  <input type="text" value={tagName} onChange={e => setTagName(e.target.value)}
                    placeholder="Add tag..." className="flex-1 px-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant/30 rounded-full focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button type="submit" disabled={addingTag || !tagName.trim()} className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-container disabled:opacity-50 transition-all">Add</button>
                </form>
              )}
            </section>
          )}

        </div> {/* end left column */}

        {/* ===== RIGHT COLUMN (col-span-4) ===== */}
        <div className="col-span-12 lg:col-span-4 space-y-8">

          {/* Quick Actions */}
          {isAuthenticated && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-6">Quick Actions</h2>
              <div className="grid grid-cols-4 gap-3">
                <button onClick={handleUpdateLastPowerOnDate} disabled={updatingPowerDate}
                  title="Log Power On"
                  className="flex flex-col items-center justify-center p-3.5 bg-primary text-white rounded-xl hover:bg-primary-container disabled:opacity-50 transition-all active:scale-95">
                  <Icon name="power_settings_new" className="w-6 h-6" />
                </button>
                <button onClick={() => setShowUploader(true)} title="Add Image"
                  className="relative flex flex-col items-center justify-center p-3.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-all group active:scale-95">
                  <Icon name="image_icon" className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-primary">
                    <Icon name="add" className="w-3 h-3" />
                  </span>
                </button>
                <button onClick={() => setShowMaintenanceForm(true)} title="Add Maintenance Log"
                  className="relative flex flex-col items-center justify-center p-3.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-all group active:scale-95">
                  <Icon name="build" className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-primary">
                    <Icon name="add" className="w-3 h-3" />
                  </span>
                </button>
                <button onClick={() => setShowNoteForm(true)} title="Add Note"
                  className="relative flex flex-col items-center justify-center p-3.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-all group active:scale-95">
                  <Icon name="description" className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center text-primary">
                    <Icon name="add" className="w-3 h-3" />
                  </span>
                </button>
              </div>
            </section>
          )}

          {/* Lifecycle Actions (auth-gated) */}
          {isAuthenticated && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/10">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-6">Lifecycle Actions</h2>
              <div className="space-y-3">
                {device.status !== 'PENDING_SALE' && (
                  <button onClick={() => handleSetStatus('PENDING_SALE')} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-sm font-bold hover:bg-amber-100 disabled:opacity-50 transition-all active:scale-[0.98]">
                    <Icon name="pending_actions" className="w-5 h-5" />
                    PENDING SALE
                  </button>
                )}
                {device.status !== 'SOLD' && (
                  <button onClick={() => handleSetStatus('SOLD')} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50 transition-all active:scale-[0.98]">
                    <Icon name="shopping_cart_checkout" className="w-5 h-5" />
                    SOLD
                  </button>
                )}
                {device.status !== 'COLLECTION' && (
                  <button onClick={() => handleSetStatus('COLLECTION')} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-surface-container-low text-on-surface border border-outline-variant/20 rounded-xl text-sm font-bold hover:bg-surface-container disabled:opacity-50 transition-all active:scale-[0.98]">
                    Back to Collection
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Photos Grid */}
          {images.length > 0 && (
            <section className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Photos</h2>
                <Link href={`/devices_new/${id}/photos`} className="text-xs text-primary font-semibold hover:underline">
                  View all →
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {photoGridImages.slice(0, 5).map((img: any) => (
                  <div key={img.id} className="aspect-square bg-surface-container-low rounded-lg overflow-hidden group cursor-pointer">
                    <img src={`${API_BASE_URL}${img.thumbnailPath || img.path}`} alt={img.caption || ''} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                  </div>
                ))}
                {images.length > 5 && (
                  <div className="aspect-square bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors">
                    <span className="text-white font-bold text-sm">+{images.length - 5} more</span>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Maintenance Logs */}
          {(sortedTasks.length > 0 || isAuthenticated) && (
            <section className="bg-surface-container-highest p-8 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Maintenance Logs</h2>
                <div className="flex items-center gap-3">
                  <Link href={`/devices_new/${id}/logs`} className="text-xs text-primary font-semibold hover:underline">View all →</Link>
                  {isAuthenticated && (
                    <button onClick={() => setShowMaintenanceForm(true)} className="text-primary text-xs font-semibold hover:underline">+ Add</button>
                  )}
                </div>
              </div>
              {sortedTasks.length === 0 && <p className="text-on-surface-variant text-xs">No maintenance logs yet.</p>}
              <div className="space-y-4">
                {sortedTasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="bg-surface-container-lowest p-4 rounded-lg">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-sm text-on-surface">{task.label}</span>
                      <span className="text-[10px] text-outline">{formatDateForDisplay(task.dateCompleted).toUpperCase()}</span>
                    </div>
                    {task.notes && <p className="text-xs text-on-surface-variant">{task.notes}</p>}
                    {task.cost != null && <p className="text-xs text-on-surface-variant mt-1">Cost: {formatCurrency(task.cost)}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent Notes */}
          {(sortedNotes.length > 0 || isAuthenticated) && (
            <section className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">Recent Notes</h2>
                <div className="flex items-center gap-3">
                  <Link href={`/devices_new/${id}/notes`} className="text-xs text-primary font-semibold hover:underline">View all →</Link>
                  {isAuthenticated && (
                    <button onClick={() => setShowNoteForm(true)} className="text-primary text-xs font-semibold hover:underline">+ Add</button>
                  )}
                </div>
              </div>
              {sortedNotes.length === 0 && <p className="text-on-surface-variant text-xs">No notes yet.</p>}
              <div className="space-y-6">
                {sortedNotes.slice(0, 5).map((note: any) => (
                  <div key={note.id} className="relative pl-6 border-l-2 border-primary-fixed-dim">
                    <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-[10px] text-outline block uppercase tracking-tighter">{formatDateForDisplay(note.date)}</span>
                    <p className="text-sm italic text-on-surface-variant mt-1 leading-relaxed">{linkifyText(note.content)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div> {/* end right column */}
      </div> {/* end 12-col grid */}

      {/* ===== MODALS ===== */}

      {showUploader && (
        <ImageUploader
          deviceId={parseInt(id as string)}
          onClose={() => setShowUploader(false)}
          onUploadComplete={() => { setShowUploader(false); refetch(); }}
        />
      )}

      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          deviceUrl={typeof window !== 'undefined' ? window.location.href : `/devices_new/${id}`}
          deviceName={device.name}
          additionalName={device.additionalName}
          deviceId={parseInt(id as string)}
        />
      )}

      {showMaintenanceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowMaintenanceForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-on-surface mb-4">Add Maintenance Log</h4>
            <form onSubmit={handleCreateMaintenanceTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Label *</label>
                <input type="text" value={maintenanceFormData.label}
                  onChange={e => setMaintenanceFormData(p => ({ ...p, label: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary outline-none" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Date Completed *</label>
                <input type="date" value={maintenanceFormData.dateCompleted}
                  onChange={e => setMaintenanceFormData(p => ({ ...p, dateCompleted: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Notes</label>
                <textarea value={maintenanceFormData.notes}
                  onChange={e => setMaintenanceFormData(p => ({ ...p, notes: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 text-sm bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Cost</label>
                <input type="number" step="0.01" value={maintenanceFormData.cost}
                  onChange={e => setMaintenanceFormData(p => ({ ...p, cost: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowMaintenanceForm(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">Cancel</button>
                <button type="submit" disabled={creatingTask} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-container disabled:opacity-50 transition-all">
                  {creatingTask ? 'Saving...' : 'Save Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNoteForm(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-on-surface mb-4">Add Note</h4>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Note *</label>
                <textarea value={noteFormData.content}
                  onChange={e => setNoteFormData(p => ({ ...p, content: e.target.value }))}
                  rows={4} className="w-full px-3 py-2 text-sm bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">Date</label>
                <input type="datetime-local" value={noteFormData.date}
                  onChange={e => setNoteFormData(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNoteForm(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">Cancel</button>
                <button type="submit" disabled={creatingNote} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-container disabled:opacity-50 transition-all">
                  {creatingNote ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteDeviceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">Delete Device?</h4>
            <p className="text-sm text-on-surface-variant mb-6">This will move the device to the trash. You can restore it from there.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteDeviceConfirm(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">Cancel</button>
              <button onClick={handleDeleteDevice} disabled={deletingDevice} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                {deletingDevice ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
