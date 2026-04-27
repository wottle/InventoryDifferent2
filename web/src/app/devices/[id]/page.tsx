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
          additionalName
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
          additionalName
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

const UPDATE_MAINTENANCE_TASK = gql`
  mutation UpdateMaintenanceTask($input: MaintenanceTaskUpdateInput!) {
    updateMaintenanceTask(input: $input) {
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
      additionalName
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
        toDevice { id name additionalName manufacturer images { id thumbnailPath isThumbnail } }
      }
      relationsTo {
        id
        type
        fromDeviceId
        fromDevice { id name additionalName manufacturer images { id thumbnailPath isThumbnail } }
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
  package: "M20 2H4c-1.1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.72V20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8.72c.57-.38 1-.99 1-1.71V4c0-1.1-.9-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4l16-.01V7z",
  battery_alert: "M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18h-2v-2h2v2zm0-4h-2V9h2v5z",
  favorite: "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
  power_settings_new: "M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42A6.92 6.92 0 0119 12c0 3.87-3.13 7-7 7A7 7 0 015 12c0-2.28 1.09-4.3 2.58-5.42L6.17 5.17A8.932 8.932 0 003 12a9 9 0 009 9 9 9 0 009-9c0-2.73-1.22-5.16-3.17-6.83z",
  image_icon: "M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z",
  build: "M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z",
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
  swap_vert: "M16 17.01V10h-2v7.01h-3L15 21l4-3.99h-3zM9 3L5 6.99h3V14h2V6.99h3L9 3z",
  thumb_up: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z",
  thumb_down: "M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z",
  warning_triangle: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",
  crown: "M12 3L8 9L3 7L5 15H19L21 7L16 9Z M5 17H19V19H5Z",
  star_outline: "M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z",
  undo: "M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z",
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

function InfoNotes({ info }: { info: string }) {
  const [expanded, setExpanded] = useState(false);
  const t = useT();
  const isLong = info.split('\n').length > 5 || info.length > 450;
  return (
    <div className="mt-10 pt-8 border-t border-outline-variant/20">
      <span className="text-outline text-[10px] uppercase tracking-tighter mb-2 block">{t.detail.deviceNotes}</span>
      <p className={`text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap ${expanded ? '' : 'line-clamp-5'}`}>
        {info}
      </p>
      {(isLong || expanded) && (
        <button onClick={() => setExpanded(v => !v)} className="text-primary text-xs font-bold mt-2 hover:underline">
          {expanded ? t.detail.collapse : t.detail.expand}
        </button>
      )}
    </div>
  );
}

function IndicatorCard({ color, iconName, label, value, active = true }: { color: string; iconName: string; label: string; value: string; active?: boolean }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
    red: { bg: 'bg-red-50', text: 'text-red-600' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-500' },
    gray: { bg: 'bg-surface-container', text: 'text-outline' },
  };
  const c = active ? (colorMap[color] ?? colorMap.gray) : colorMap.gray;
  return (
    <div className={`bg-[var(--card)] p-6 rounded-xl shadow-sm flex flex-col items-center text-center transition-opacity ${active ? 'opacity-100' : 'opacity-50'}`}>
      <Icon name={iconName} className={`w-7 h-7 ${c.text} mb-3`} />
      <span className="text-outline text-[10px] uppercase tracking-tighter">{value}</span>
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

function formatNoteDateForDisplay(dateString: string): string {
  const d = new Date(dateString);
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  if (!hasTime) return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
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
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editTaskFormData, setEditTaskFormData] = useState({ label: '', dateCompleted: '', notes: '', cost: '' });
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
  const [showSoldModal, setShowSoldModal] = useState(false);
  const [soldAmountInput, setSoldAmountInput] = useState('');
  const [showReturnedModal, setShowReturnedModal] = useState(false);
  const [repairFeeInput, setRepairFeeInput] = useState('');
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
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
  const [updateMaintenanceTask, { loading: updatingTask }] = useMutation(UPDATE_MAINTENANCE_TASK);
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
      if (!isLightboxOpen) return;
      if (imageCountForNav <= 1) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      setSelectedImage((prev) => {
        const next = e.key === 'ArrowRight'
          ? (prev + 1) % imageCountForNav
          : (prev - 1 + imageCountForNav) % imageCountForNav;
        return next;
      });
      setLightboxZoom(1);
      setLightboxPan({ x: 0, y: 0 });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [imageCountForNav, isLightboxOpen]);

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
  const images = [...(device.images || [])].sort((a: any, b: any) => {
    if (a.isThumbnail !== b.isThumbnail) return a.isThumbnail ? -1 : 1;
    const aDate = a.dateTaken ? new Date(a.dateTaken).getTime() : 0;
    const bDate = b.dateTaken ? new Date(b.dateTaken).getTime() : 0;
    if (bDate !== aDate) return bDate - aDate;
    return b.id - a.id;
  });
  const heroImage = pickThumbnail(images, isDark) as any;
  const photoGridImages = [...images].slice(0, 5);
  const navImages = images;

  const openLightbox = (index: number) => {
    setSelectedImage(index);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
    setIsLightboxOpen(true);
  };

  const lightboxNav = (delta: number) => {
    setSelectedImage(prev => (prev + delta + navImages.length) % navImages.length);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };
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
      setTagToRemoveId(null);
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
        `${d.name}${d.additionalName ? ` · ${d.additionalName}` : ''}${d.manufacturer ? ` (${d.manufacturer})` : ''}` === relationDeviceName ||
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

  const handleEditTask = (task: any) => {
    setEditingTaskId(task.id);
    const utcDate = new Date(task.dateCompleted);
    const local = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
    setEditTaskFormData({
      label: task.label,
      dateCompleted: local.toISOString().slice(0, 10),
      notes: task.notes ?? '',
      cost: task.cost != null ? String(task.cost) : '',
    });
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId) return;
    try {
      await updateMaintenanceTask({
        variables: {
          input: {
            id: editingTaskId,
            label: editTaskFormData.label,
            dateCompleted: new Date(editTaskFormData.dateCompleted).toISOString(),
            notes: editTaskFormData.notes || null,
            cost: editTaskFormData.cost !== '' ? parseFloat(editTaskFormData.cost) : null,
          },
        },
      });
      setEditingTaskId(null);
      refetch();
    } catch (err) {
      console.error('Error updating maintenance task:', err);
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

  const handleSetStatus = async (newStatus: string, extras?: { soldPrice?: number; soldDate?: string }) => {
    try {
      await updateDeviceStatus({
        variables: { input: { id: device.id, status: newStatus, ...extras } },
      });
      refetch();
    } catch (err) {
      console.error('Error updating device status:', err);
    }
  };

  const handleMarkSold = async () => {
    const price = parseFloat(soldAmountInput);
    await handleSetStatus('SOLD', {
      soldPrice: isNaN(price) ? undefined : price,
      soldDate: new Date().toISOString(),
    });
    setShowSoldModal(false);
    setSoldAmountInput('');
  };

  const handleMarkReturned = async () => {
    const fee = parseFloat(repairFeeInput);
    await handleSetStatus('RETURNED', {
      soldPrice: isNaN(fee) || repairFeeInput.trim() === '' ? undefined : fee,
      soldDate: new Date().toISOString(),
    });
    setShowReturnedModal(false);
    setRepairFeeInput('');
  };

  const STATUS_PILL: Record<string, string> = {
    COLLECTION:   'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    FOR_SALE:     'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    PENDING_SALE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    SOLD:         'bg-gray-200 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300',
    DONATED:      'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    IN_REPAIR:    'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
    REPAIRED:     'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300',
    RETURNED:     'bg-gray-200 text-gray-700 dark:bg-gray-700/60 dark:text-gray-300',
  };

  return (
    <div className="font-inter text-on-surface bg-[var(--background)]">
      <DeepLinkBanner deviceId={id as string} />

      {/* Back nav row */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors group">
          <Icon name="arrow_back" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          {t.detail.backToInventory}
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
          {isAuthenticated && (
            <Link href={`/devices/${id}/edit`} title="Edit device" aria-label="Edit device" className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-lg transition-all">
              <Icon name="edit" className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

      {/* Hero + Quick Overview — side by side on xl, aligned with main grid */}
      <div className="xl:grid xl:grid-cols-12 xl:gap-8 xl:items-stretch">
        <div className="-mx-4 sm:-mx-6 lg:-mx-8 xl:mx-0 xl:col-span-8">
        <section className="relative h-[500px] w-full rounded-xl overflow-hidden group cursor-pointer" onClick={() => navImages.length > 0 && openLightbox(0)}>
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
          <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/40 backdrop-blur-sm rounded-full text-white/70 text-lg font-medium tracking-tighter">
            #{String(device.id).padStart(4, '0')}
          </div>
          <div className="absolute inset-0 hero-gradient flex flex-col justify-end p-12">
            <span className="text-white/70 text-[11px] font-bold tracking-[0.2em] uppercase mb-2">
              {device.category?.name}{device.releaseYear ? ` • ${device.releaseYear}` : ''}
            </span>
            <h1 className="text-white text-5xl lg:text-6xl font-extrabold tracking-tighter mb-1 drop-shadow-lg">
              {device.name}
            </h1>
            {device.additionalName && (
              <p className="text-white/80 text-xl font-light line-clamp-2 max-w-2xl">{device.additionalName}</p>
            )}
          </div>
        </section>
        </div>

        {/* Quick Overview — alongside hero on xl, stacked below on smaller */}
        <section className="bg-[var(--card)] p-8 rounded-xl shadow-sm mt-8 xl:mt-0 xl:col-span-4 xl:overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">{t.detail.quickOverview}</h2>
            <span className={`${STATUS_PILL[device.status] ?? 'bg-surface-container-highest text-on-surface-variant'} px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase`}>
              {(t.status as Record<string, string>)[device.status] ?? device.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-y-8 gap-x-8">
            {device.manufacturer && <SpecField label={t.detail.manufacturerModel} value={`${device.manufacturer} ${device.modelNumber}`} />}
            {device.serialNumber && <SpecField label={t.detail.serialNumber} value={device.serialNumber} />}
            {device.location && <SpecField label={t.detail.locationLabel} value={device.location.name} />}
            {device.lastPowerOnDate && <SpecField label={t.detail.lastUsed} value={new Date(device.lastPowerOnDate).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' })} />}
          </div>
          {device.info && <InfoNotes info={device.info} />}
        </section>
      </div>

      {/* ===== MAIN 12-COLUMN GRID ===== */}
      <div className="grid grid-cols-12 gap-8 mt-8">

        {/* ===== LEFT COLUMN (col-span-8) ===== */}
        <div className="col-span-12 lg:col-span-8 space-y-8">

          {/* Indicator Cards */}
          <section className="grid grid-cols-3 md:grid-cols-6 gap-4">
            <IndicatorCard
              iconName={device.functionalStatus === 'YES' ? 'thumb_up' : device.functionalStatus === 'PARTIAL' ? 'warning_triangle' : 'thumb_down'}
              color={device.functionalStatus === 'YES' ? 'emerald' : device.functionalStatus === 'PARTIAL' ? 'amber' : 'red'}
              label={t.detail.conditionLabel}
              value={device.functionalStatus === 'YES' ? t.detail.fullyWorking : device.functionalStatus === 'PARTIAL' ? t.detail.partiallyWorking : t.detail.notWorking}
              active={true}
            />
            <IndicatorCard
              iconName="crown"
              color={device.rarity === 'UNCOMMON' ? 'yellow' : device.rarity === 'RARE' ? 'emerald' : device.rarity === 'VERY_RARE' ? 'blue' : device.rarity === 'EXTREMELY_RARE' ? 'purple' : 'gray'}
              label={t.detail.rarityLabel}
              value={device.rarity ? (t.rarity as Record<string, string>)[device.rarity] ?? device.rarity : t.rarity.COMMON}
              active={!!device.rarity && device.rarity !== 'COMMON'}
            />
            <IndicatorCard
              iconName="sell"
              color={device.isAssetTagged ? 'emerald' : 'gray'}
              label={t.detail.assetTaggedLabel}
              value={device.isAssetTagged ? t.detail.tagged : t.detail.notTagged}
              active={!!device.isAssetTagged}
            />
            <IndicatorCard
              iconName="package"
              color={device.hasOriginalBox ? 'emerald' : 'gray'}
              label={t.detail.originalBoxLabel}
              value={device.hasOriginalBox ? t.detail.origBox : t.detail.noBox}
              active={!!device.hasOriginalBox}
            />
            {device.category?.type === 'COMPUTER' && (
              <IndicatorCard
                iconName="battery_alert"
                color={device.isPramBatteryRemoved ? 'emerald' : 'red'}
                label={t.detail.pramLabel}
                value={device.isPramBatteryRemoved ? t.detail.pramRemoved : t.detail.pramInstalled}
                active={true}
              />
            )}
            <IndicatorCard
              iconName={device.isFavorite ? 'star' : 'star_outline'}
              color={device.isFavorite ? 'yellow' : 'gray'}
              label={t.detail.favoriteLabel}
              value={device.isFavorite ? t.detail.favoriteLabel : t.detail.notFavorite}
              active={!!device.isFavorite}
            />
          </section>

          {/* Financials (auth-gated) */}
          {isAuthenticated && (device.priceAcquired != null || device.estimatedValue != null || device.soldPrice != null || device.listPrice != null || device.dateAcquired || device.whereAcquired) && (() => {
            const gainPct = device.priceAcquired && device.priceAcquired > 0 && device.estimatedValue != null
              ? ((device.estimatedValue - device.priceAcquired) / device.priceAcquired) * 100
              : null;
            const isDonated = device.status === 'DONATED';
            const isCollection = !['SOLD','RETURNED','DONATED'].includes(device.status);
            const valueBorderClass = isDonated
              ? 'border-purple-500'
              : isCollection && gainPct != null
                ? (gainPct >= 0 ? 'border-emerald-500' : 'border-red-500')
                : 'border-tertiary';
            const gainTextClass = gainPct != null && gainPct >= 0
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-red-600 dark:text-red-400';
            const ebayQuery = encodeURIComponent(`${device.name}${device.additionalName ? ' ' + device.additionalName : ''}`);
            const isForSale = ['FOR_SALE','PENDING_SALE'].includes(device.status);
            const showRightCard = isDonated || device.status === 'RETURNED' || device.estimatedValue != null || device.soldPrice != null || (isForSale && device.listPrice != null);
            return (
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Acquisition card */}
                {(device.priceAcquired != null || device.dateAcquired || device.whereAcquired) && (
                  <div className="bg-[var(--card)] p-8 rounded-xl shadow-sm flex flex-col border-l-4 border-primary">
                    {device.priceAcquired != null ? (
                      <>
                        <span className="text-outline text-[10px] uppercase tracking-widest block mb-1">{t.detail.acquisitionPrice}</span>
                        <span className="text-3xl font-bold text-on-surface mb-3">{formatCurrency(device.priceAcquired)}</span>
                      </>
                    ) : (
                      <span className="text-outline text-[10px] uppercase tracking-widest block mb-3">{t.detail.acquisition}</span>
                    )}
                    <div className="flex flex-col gap-1 mt-auto">
                      {device.dateAcquired && (
                        <span className="text-on-surface-variant text-xs">{formatDateForDisplay(device.dateAcquired)}</span>
                      )}
                      {device.whereAcquired && (
                        <span className="text-on-surface-variant text-xs">{device.whereAcquired}</span>
                      )}
                    </div>
                  </div>
                )}
                {/* Value / Sale / Donated card */}
                {showRightCard && (
                  <div ref={valueHistoryRef} className={`relative bg-[var(--card)] p-8 rounded-xl shadow-sm border-l-4 ${valueBorderClass}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        {isDonated ? (
                          <>
                            <span className="text-outline text-[10px] uppercase tracking-widest block mb-1">{t.detail.donatedLabel}</span>
                            {device.soldDate ? (
                              <span className="text-2xl font-bold text-on-surface">{formatDateForDisplay(device.soldDate)}</span>
                            ) : (
                              <span className="text-on-surface-variant text-sm">{t.detail.noDateRecorded}</span>
                            )}
                          </>
                        ) : device.status === 'RETURNED' ? (
                          <>
                            <span className="text-outline text-[10px] uppercase tracking-widest block mb-1">{t.detail.repairFee}</span>
                            {device.soldPrice != null ? (
                              <span className="text-3xl font-bold text-on-surface">{formatCurrency(device.soldPrice)}</span>
                            ) : (
                              <span className="text-on-surface-variant text-sm">{t.detail.noFeeCharged}</span>
                            )}
                            {device.soldDate && (
                              <span className="text-on-surface-variant text-xs block mt-2">{t.detail.returnedPrefix} {formatDateForDisplay(device.soldDate)}</span>
                            )}
                          </>
                        ) : device.soldPrice != null && !isCollection ? (
                          <>
                            <span className="text-outline text-[10px] uppercase tracking-widest block mb-1">{t.detail.salePrice}</span>
                            <span className="text-3xl font-bold text-on-surface">{formatCurrency(device.soldPrice)}</span>
                            {device.soldDate && (
                              <span className="text-on-surface-variant text-xs block mt-2">{formatDateForDisplay(device.soldDate)}</span>
                            )}
                          </>
                        ) : isForSale ? (
                          <>
                            {device.listPrice != null && (
                              <>
                                <span className="text-outline text-[10px] uppercase tracking-widest block mb-1">{t.detail.listPriceLabel}</span>
                                <span className="text-3xl font-bold text-on-surface mb-3">{formatCurrency(device.listPrice)}</span>
                              </>
                            )}
                            {device.estimatedValue != null && (
                              <>
                                <span className="text-outline text-[10px] uppercase tracking-widest block mb-1 mt-2">{t.detail.estValue}</span>
                                <span className="text-xl font-semibold text-on-surface">{formatCurrency(device.estimatedValue)}</span>
                              </>
                            )}
                            {gainPct != null && (
                              <span className={`${gainTextClass} text-sm font-bold block mt-1`}>
                                {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}% {t.detail.sincePurchase}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-outline text-[10px] uppercase tracking-widest block mb-1">{t.detail.estimatedValue}</span>
                            <span className="text-3xl font-bold text-on-surface">{formatCurrency(device.estimatedValue)}</span>
                            {gainPct != null && (
                              <span className={`${gainTextClass} text-sm font-bold block mt-1`}>
                                {gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}% {t.detail.sincePurchase}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      {!isDonated && (
                      <div className="flex flex-col items-end gap-2">
                        {['COLLECTION','FOR_SALE','PENDING_SALE'].includes(device.status) && (
                          <Icon name="trending_up" className={`w-6 h-6 ${gainPct != null && gainPct < 0 ? 'text-red-400' : 'text-tertiary'}`} />
                        )}
                        {device.estimatedValue != null && ['COLLECTION','FOR_SALE','PENDING_SALE'].includes(device.status) && chartData.length > 0 && (
                          <button type="button" onClick={() => setShowValueHistory(v => !v)}
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">
                            {t.detail.history} ↗
                          </button>
                        )}
                        {isCollection && (
                          <a href={`https://www.ebay.com/sch/i.html?_nkw=${ebayQuery}&LH_Sold=1&LH_Complete=1`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">
                            {t.detail.ebaySold} ↗
                          </a>
                        )}
                      </div>
                      )}
                    </div>
                    {/* Value History Popover */}
                    {showValueHistory && (
                      <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 bg-[var(--card)] rounded-xl shadow-lg border border-outline-variant/20 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-outline">{t.detail.valueHistory}</span>
                          <button type="button" onClick={() => setShowValueHistory(false)} aria-label="Close value history"
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors text-sm">×</button>
                        </div>
                        {chartData.length >= 2 ? (
                          <DeviceValueChart data={chartData} />
                        ) : (
                          <p className="text-xs text-on-surface-variant py-4 text-center">{t.detail.noValueHistoryYet}</p>
                        )}
                        {chartData.length > 0 && (
                          <p className="text-[10px] text-outline mt-2 text-center">
                            {chartData.length} {chartData.length !== 1 ? t.detail.snapshots : t.detail.snapshot} · {t.detail.firstRecorded} {new Date(Math.min(...chartData.map((c: any) => c.dateMs))).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            );
          })()}

          {/* Technical Specs */}
          {(device.cpu || device.ram || device.storage || device.graphics || device.operatingSystem) && (
            <section className="bg-[var(--card)] rounded-xl p-8 shadow-sm">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-6">{t.detail.technicalSpecs}</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {device.cpu && <SpecField label={t.detail.processor} value={device.cpu} />}
                {device.ram && <SpecField label={t.detail.memoryRam} value={device.ram} />}
                {device.storage && <SpecField label={t.detail.storage} value={device.storage} />}
                {device.graphics && <SpecField label={t.detail.graphics} value={device.graphics} />}
                {device.operatingSystem && <SpecField label={t.detail.operatingSystem} value={device.operatingSystem} />}
                {device.isWifiEnabled != null && <SpecField label={t.detail.wifi} value={device.isWifiEnabled ? t.common.yes : t.common.no} />}
              </div>
            </section>
          )}

          {/* Custom Fields */}
          {(device.customFieldValues ?? []).length > 0 && (
            <section className="bg-[var(--card)] rounded-xl p-8 shadow-sm">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-6">{t.detail.customFields}</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[...device.customFieldValues]
                  .sort((a: any, b: any) =>
                    a.sortOrder !== b.sortOrder
                      ? a.sortOrder - b.sortOrder
                      : a.customFieldName.localeCompare(b.customFieldName)
                  )
                  .map((cf: any) => (
                    <SpecField key={cf.id} label={cf.customFieldName} value={cf.value} />
                  ))}
              </div>
            </section>
          )}

          {/* Historical Notes */}
          {device.historicalNotes && (
            <section className="bg-[var(--card)] p-8 rounded-xl shadow-sm">
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
            {isAuthenticated && (() => {
              const suggestions = device.category?.type === 'COMPUTER'
                ? t.detail.accessorySuggestionsComputer
                : t.detail.accessorySuggestionsOther;
              const existing = new Set((device.accessories ?? []).map((a: any) => a.name));
              const remaining = suggestions.filter((s: string) => !existing.has(s));
              return remaining.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {remaining.map((s: string) => (
                    <button key={s} type="button" onClick={() => handleAddAccessory(s)} disabled={addingAccessory}
                      className="px-2 py-1 text-xs rounded-full border border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                      + {s}
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
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
        {((device.relationsFrom ?? []).length > 0 || (device.relationsTo ?? []).length > 0 || isAuthenticated) && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-on-surface font-bold text-[10px] uppercase tracking-widest">{t.detail.relatedDevices}</h2>
              {isAuthenticated && !showRelationForm && (
                <button
                  onClick={() => setShowRelationForm(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  <Icon name="add" className="w-3.5 h-3.5" />
                  Add
                </button>
              )}
            </div>

            {/* Outgoing (relationsFrom) */}
            {(device.relationsFrom ?? []).length > 0 && (
              <div className="space-y-2 mb-2">
                {(device.relationsFrom as any[]).map((rel: any) => {
                  const thumb = (rel.toDevice.images ?? []).find((i: any) => i.isThumbnail) ?? (rel.toDevice.images ?? [])[0];
                  return (
                    <div key={rel.id} className="relative flex items-center gap-3 p-3 bg-surface-container-low rounded-xl group">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img src={`${API_BASE_URL}${thumb.thumbnailPath || thumb.path}`} alt={rel.toDevice.name} className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="device_hub" className="w-4 h-4 text-outline" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-outline capitalize mb-0.5">{rel.type.replace(/_/g, ' ')}</p>
                        <Link href={`/devices/${rel.toDevice.id}`} className="text-sm font-semibold text-on-surface hover:text-primary transition-colors truncate block">
                          {rel.toDevice.name}{rel.toDevice.additionalName && <span className="font-normal text-on-surface-variant"> · {rel.toDevice.additionalName}</span>}
                        </Link>
                      </div>
                      {isAuthenticated && (
                        <button type="button" onClick={() => setRelationToRemoveId(rel.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-on-surface-variant hover:text-red-500 rounded-lg transition-all flex-shrink-0">
                          <Icon name="delete" className="w-4 h-4" />
                        </button>
                      )}
                      {relationToRemoveId === rel.id && (
                        <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center gap-2">
                          <span className="text-white text-xs">{t.detail.removeRelationshipConfirm}</span>
                          <button onClick={() => handleRemoveRelationship(rel.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">{t.common.remove}</button>
                          <button onClick={() => setRelationToRemoveId(null)} className="px-2 py-1 bg-white text-gray-700 text-xs rounded-lg hover:bg-gray-100">{t.common.cancel}</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Incoming (relationsTo) */}
            {(device.relationsTo ?? []).length > 0 && (
              <div className="space-y-2 mb-2">
                {(device.relationsTo as any[]).map((rel: any) => {
                  const thumb = (rel.fromDevice.images ?? []).find((i: any) => i.isThumbnail) ?? (rel.fromDevice.images ?? [])[0];
                  const inverseLabel = (t.detail.inverseRelationLabels as Record<string, string>)[rel.type] ?? rel.type;
                  return (
                    <div key={rel.id} className="relative flex items-center gap-3 p-3 bg-surface-container-low rounded-xl group">
                      <div className="w-9 h-9 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {thumb ? (
                          <img src={`${API_BASE_URL}${thumb.thumbnailPath || thumb.path}`} alt={rel.fromDevice.name} className="w-full h-full object-cover" />
                        ) : (
                          <Icon name="device_hub" className="w-4 h-4 text-outline" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-outline capitalize mb-0.5">{inverseLabel.replace(/_/g, ' ')}</p>
                        <Link href={`/devices/${rel.fromDevice.id}`} className="text-sm font-semibold text-on-surface hover:text-primary transition-colors truncate block">
                          {rel.fromDevice.name}{rel.fromDevice.additionalName && <span className="font-normal text-on-surface-variant"> · {rel.fromDevice.additionalName}</span>}
                        </Link>
                      </div>
                      {isAuthenticated && (
                        <button type="button" onClick={() => setRelationToRemoveId(rel.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-on-surface-variant hover:text-red-500 rounded-lg transition-all flex-shrink-0">
                          <Icon name="delete" className="w-4 h-4" />
                        </button>
                      )}
                      {relationToRemoveId === rel.id && (
                        <div className="absolute inset-0 bg-black/70 rounded-xl flex items-center justify-center gap-2">
                          <span className="text-white text-xs">{t.detail.removeRelationshipConfirm}</span>
                          <button onClick={() => handleRemoveRelationship(rel.id)} className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700">{t.common.remove}</button>
                          <button onClick={() => setRelationToRemoveId(null)} className="px-2 py-1 bg-white text-gray-700 text-xs rounded-lg hover:bg-gray-100">{t.common.cancel}</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty state */}
            {(device.relationsFrom ?? []).length === 0 && (device.relationsTo ?? []).length === 0 && !showRelationForm && (
              <p className="text-sm text-on-surface-variant">{t.detail.noRelatedDevices}</p>
            )}

            {/* Add relationship form */}
            {isAuthenticated && showRelationForm && (() => {
              const allDevices: any[] = allDevicesData?.devices ?? [];
              const existingIds = new Set([
                ...(device.relationsFrom ?? []).map((r: any) => r.toDeviceId),
                device.id,
              ]);
              const deviceOptions = allDevices
                .filter((d: any) => !existingIds.has(d.id))
                .sort((a: any, b: any) => {
                  const nameA = a.name.toLowerCase();
                  const nameB = b.name.toLowerCase();
                  if (nameA !== nameB) return nameA < nameB ? -1 : 1;
                  return (a.additionalName ?? '').toLowerCase() < (b.additionalName ?? '').toLowerCase() ? -1 : 1;
                });
              const forwardLabels: Record<string, string> = {
                'accessory': 'accessory of', 'software': 'software for',
                'manual / documentation': 'manual for', 'installed inside': 'installed inside',
                'purchased with': 'purchased with', 'came bundled with': 'came bundled with',
              };
              const inverseLabels = t.detail.inverseRelationLabels as Record<string, string>;
              const trimmedType = relationType.trim();
              const fwdLabel = forwardLabels[trimmedType.toLowerCase()] ?? trimmedType;
              const invLabel = inverseLabels[trimmedType.toLowerCase()] ?? trimmedType;
              const otherName = relationDeviceName.trim();
              return (
                <form onSubmit={handleAddRelationship} className="mt-3 p-4 bg-surface-container rounded-xl space-y-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-outline block mb-1.5">{t.detail.relationshipDevice}</label>
                    <input type="text" value={relationDeviceName} onChange={e => setRelationDeviceName(e.target.value)}
                      list="relation-device-suggestions" placeholder="Search devices…" required
                      className="w-full px-3 py-2 text-sm bg-[var(--card)] border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <datalist id="relation-device-suggestions">
                      {deviceOptions.map((d: any) => (
                        <option key={d.id} value={`${d.name}${d.additionalName ? ` · ${d.additionalName}` : ''}${d.manufacturer ? ` (${d.manufacturer})` : ''}`} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-outline block mb-1.5">{t.detail.relationshipType}</label>
                    <input type="text" value={relationType} onChange={e => setRelationType(e.target.value)}
                      list="relation-type-suggestions" placeholder="e.g. accessory" required
                      className="w-full px-3 py-2 text-sm bg-[var(--card)] border border-outline-variant/30 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <datalist id="relation-type-suggestions">
                      {(t.detail.relationshipTypeSuggestions as string[]).map(s => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                  </div>
                  {trimmedType && (
                    <div className="p-3 bg-[var(--card)] rounded-xl border border-outline-variant/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase tracking-wider text-outline">Direction</p>
                        <button type="button" onClick={() => setIsRelationReversed(r => !r)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <Icon name="swap_vert" className="w-3.5 h-3.5" /> Swap
                        </button>
                      </div>
                      <p className="text-xs text-on-surface">
                        {isRelationReversed ? (
                          <><strong>{otherName || '…'}</strong>{' '}<span className="text-primary">{fwdLabel || '…'}</span>{' '}<strong>{device.name}</strong></>
                        ) : (
                          <><strong>{device.name}</strong>{' '}<span className="text-primary">{fwdLabel || '…'}</span>{' '}<strong>{otherName || '…'}</strong></>
                        )}
                      </p>
                      {trimmedType && otherName && (
                        <p className="text-[10px] text-on-surface-variant">
                          On &ldquo;{isRelationReversed ? device.name : otherName}&rdquo;, shown as: {invLabel} of &ldquo;{isRelationReversed ? otherName : device.name}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end pt-1">
                    <button type="button" onClick={() => { setShowRelationForm(false); setRelationDeviceName(''); setRelationType(''); setIsRelationReversed(false); }}
                      className="px-3 py-1.5 text-sm font-medium text-on-surface-variant bg-surface-container-high hover:bg-surface-container-highest rounded-xl transition-colors">
                      {t.common.cancel}
                    </button>
                    <button type="submit" disabled={addingRelationship}
                      className="px-3 py-1.5 text-sm font-semibold text-white bg-primary hover:opacity-90 rounded-xl disabled:opacity-50 transition-all">
                      {addingRelationship ? t.common.addingEllipsis : t.detail.addRelationship}
                    </button>
                  </div>
                </form>
              );
            })()}
          </section>
        )}

          {/* Recent Notes */}
          {(sortedNotes.length > 0 || isAuthenticated) && (
            <section className="bg-[var(--card)] p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">{t.detail.notes}</h2>
                {isAuthenticated && (
                  <button onClick={() => setShowNoteForm(true)} className="text-primary text-xs font-semibold hover:underline">{t.detail.addShort}</button>
                )}
              </div>
              {sortedNotes.length === 0 && <p className="text-on-surface-variant text-xs">{t.detail.noNotesYet}</p>}
              <div className="space-y-6">
                {(notesExpanded ? sortedNotes : sortedNotes.slice(0, 3)).map((note: any) => (
                  <div key={note.id} className="relative pl-6 border-l-2 border-primary-fixed-dim group/note">
                    <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                    {editingNoteId === note.id ? (
                      <form onSubmit={handleUpdateNote} className="space-y-2 mt-1">
                        <input type="datetime-local" value={editNoteFormData.date}
                          onChange={e => setEditNoteFormData(p => ({ ...p, date: e.target.value }))}
                          className="w-full px-2 py-1 text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none" required />
                        <textarea value={editNoteFormData.content}
                          onChange={e => setEditNoteFormData(p => ({ ...p, content: e.target.value }))}
                          rows={3} className="w-full px-2 py-1.5 text-sm bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none" required autoFocus />
                        <div className="flex gap-2">
                          <button type="submit" disabled={updatingNote} className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
                          <button type="button" onClick={() => setEditingNoteId(null)} className="px-3 py-1 text-xs font-medium bg-surface-container text-on-surface-variant rounded-lg">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-outline uppercase tracking-tighter">{formatNoteDateForDisplay(note.date)}</span>
                          {isAuthenticated && (
                            <div className="flex gap-1 opacity-0 group-hover/note:opacity-100 transition-opacity">
                              <button type="button" onClick={() => handleEditNote(note)} className="p-1 text-on-surface-variant hover:text-primary rounded transition-colors" title="Edit note">
                                <Icon name="edit" className="w-3 h-3" />
                              </button>
                              <button type="button" onClick={() => setDeleteNoteId(note.id)} className="p-1 text-on-surface-variant hover:text-red-500 rounded transition-colors" title="Delete note">
                                <Icon name="delete" className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm italic text-on-surface-variant mt-1 leading-relaxed">{linkifyText(note.content)}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {sortedNotes.length > 3 && (
                <button onClick={() => setNotesExpanded(v => !v)} className="text-primary text-xs font-semibold hover:underline mt-6">
                  {notesExpanded ? `${t.detail.collapse} ↑` : `${t.detail.showMoreCount} ${sortedNotes.length - 3} ↓`}
                </button>
              )}
            </section>
          )}

        </div> {/* end left column */}

        {/* ===== RIGHT COLUMN (col-span-4) ===== */}
        <div className="col-span-12 lg:col-span-4 space-y-8">

          {/* Quick Actions */}
          {isAuthenticated && (
            <section className="bg-[var(--card)] p-6 rounded-xl shadow-sm">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-6">{t.detail.quickActions}</h2>
              <div className="grid grid-cols-4 gap-3">
                <button onClick={handleUpdateLastPowerOnDate} disabled={updatingPowerDate}
                  title={t.detail.logPowerOn}
                  className="relative flex flex-col items-center justify-center p-3.5 bg-surface-container hover:bg-surface-container-high rounded-xl transition-all group active:scale-95 disabled:opacity-50">
                  <Icon name="power_settings_new" className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                </button>
                <button onClick={() => setShowUploader(true)} title={t.detail.addPhotos}
                  className="relative flex flex-col items-center justify-center p-3.5 bg-surface-container hover:bg-surface-container-high rounded-xl transition-all group active:scale-95">
                  <div className="relative">
                    <Icon name="image_icon" className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-[var(--card)] rounded-full flex items-center justify-center text-primary">
                      <Icon name="add" className="w-3 h-3" />
                    </span>
                  </div>
                </button>
                <button onClick={() => setShowMaintenanceForm(true)} title={t.detail.addMaintenance}
                  className="relative flex flex-col items-center justify-center p-3.5 bg-surface-container hover:bg-surface-container-high rounded-xl transition-all group active:scale-95">
                  <div className="relative">
                    <Icon name="build" className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-[var(--card)] rounded-full flex items-center justify-center text-primary">
                      <Icon name="add" className="w-3 h-3" />
                    </span>
                  </div>
                </button>
                <button onClick={() => setShowNoteForm(true)} title={t.detail.addNote}
                  className="relative flex flex-col items-center justify-center p-3.5 bg-surface-container hover:bg-surface-container-high rounded-xl transition-all group active:scale-95">
                  <div className="relative">
                    <Icon name="description" className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-[var(--card)] rounded-full flex items-center justify-center text-primary">
                      <Icon name="add" className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              </div>
            </section>
          )}

          {/* Lifecycle Actions (auth-gated) */}
          {isAuthenticated && (
            <section className="bg-[var(--card)] p-6 rounded-xl shadow-sm">
              <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest mb-6">{t.detail.lifecycleActions}</h2>
              <div className="space-y-3">
                {/* COLLECTION → For Sale */}
                {device.status === 'COLLECTION' && (
                  <button onClick={() => handleSetStatus('FOR_SALE')} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-orange-50 text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 disabled:opacity-50 transition-all active:scale-[0.98]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M22 9L20 4H4L2 9h2v11h7v-5h2v5h7V9h2zm-4 9h-3v-5H9v5H6V9h12v9zM4.27 9L5.6 5h12.8L19.73 9H4.27z"/></svg>
                    {t.detail.markForSale.toUpperCase()}
                  </button>
                )}
                {/* FOR_SALE → Pending Sale, Sold */}
                {device.status === 'FOR_SALE' && (<>
                  <button onClick={() => handleSetStatus('PENDING_SALE')} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 disabled:opacity-50 transition-all active:scale-[0.98]">
                    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
                      <line x1="11" y1="11" x2="4" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <line x1="11" y1="11" x2="11" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="11" cy="11" r="1" fill="currentColor"/>
                      <circle cx="18" cy="18" r="5" fill="currentColor"/>
                      <path d="M15.5 18l1.75 1.75L21 15.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t.detail.markPendingSale.toUpperCase()}
                  </button>
                  <button onClick={() => setShowSoldModal(true)} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-[0.98]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.88 14.76V18h-1.75v-1.28c-1.44-.28-2.63-1.17-2.63-2.83h1.75c0 .85.73 1.41 1.88 1.41 1.22 0 1.88-.6 1.88-1.41 0-.85-.74-1.27-2.13-1.63-1.87-.46-3.37-1.22-3.37-2.98 0-1.4 1.1-2.37 2.63-2.7V5.25h1.75v1.35c1.41.35 2.37 1.41 2.37 2.9H13.5c0-.85-.63-1.41-1.63-1.41-1.12 0-1.75.52-1.75 1.41 0 .79.83 1.2 2.13 1.58 2.12.58 3.37 1.5 3.37 3.08 0 1.42-1.1 2.37-2.74 2.6z"/></svg>
                    {t.detail.markSoldButton.toUpperCase()}
                  </button>
                </>)}
                {/* PENDING_SALE → For Sale, Sold */}
                {device.status === 'PENDING_SALE' && (<>
                  <button onClick={() => handleSetStatus('FOR_SALE')} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-orange-50 text-orange-700 rounded-xl text-sm font-bold hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 disabled:opacity-50 transition-all active:scale-[0.98]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M22 9L20 4H4L2 9h2v11h7v-5h2v5h7V9h2zm-4 9h-3v-5H9v5H6V9h12v9zM4.27 9L5.6 5h12.8L19.73 9H4.27z"/></svg>
                    {t.detail.markForSale.toUpperCase()}
                  </button>
                  <button onClick={() => setShowSoldModal(true)} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all active:scale-[0.98]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.88 14.76V18h-1.75v-1.28c-1.44-.28-2.63-1.17-2.63-2.83h1.75c0 .85.73 1.41 1.88 1.41 1.22 0 1.88-.6 1.88-1.41 0-.85-.74-1.27-2.13-1.63-1.87-.46-3.37-1.22-3.37-2.98 0-1.4 1.1-2.37 2.63-2.7V5.25h1.75v1.35c1.41.35 2.37 1.41 2.37 2.9H13.5c0-.85-.63-1.41-1.63-1.41-1.12 0-1.75.52-1.75 1.41 0 .79.83 1.2 2.13 1.58 2.12.58 3.37 1.5 3.37 3.08 0 1.42-1.1 2.37-2.74 2.6z"/></svg>
                    {t.detail.markSoldButton.toUpperCase()}
                  </button>
                </>)}
                {/* IN_REPAIR → Repaired, Returned */}
                {device.status === 'IN_REPAIR' && (<>
                  <button onClick={() => handleSetStatus('REPAIRED')} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-emerald-50 text-emerald-800 rounded-xl text-sm font-bold hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 disabled:opacity-50 transition-all active:scale-[0.98]">
                    <Icon name="check_circle" className="w-5 h-5" />
                    {t.detail.markRepaired.toUpperCase()}
                  </button>
                  <button onClick={() => setShowReturnedModal(true)} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-surface-container-low text-on-surface rounded-xl text-sm font-bold hover:bg-surface-container disabled:opacity-50 transition-all active:scale-[0.98]">
                    <Icon name="undo" className="w-5 h-5" />
                    {t.detail.markReturnedButton.toUpperCase()}
                  </button>
                </>)}
                {/* REPAIRED → In Repair, Returned */}
                {device.status === 'REPAIRED' && (<>
                  <button onClick={() => handleSetStatus('IN_REPAIR')} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-teal-50 text-teal-800 rounded-xl text-sm font-bold hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300 disabled:opacity-50 transition-all active:scale-[0.98]">
                    <Icon name="build" className="w-5 h-5" />
                    {t.detail.markInRepair.toUpperCase()}
                  </button>
                  <button onClick={() => setShowReturnedModal(true)} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-surface-container-low text-on-surface rounded-xl text-sm font-bold hover:bg-surface-container disabled:opacity-50 transition-all active:scale-[0.98]">
                    <Icon name="undo" className="w-5 h-5" />
                    {t.detail.markReturnedButton.toUpperCase()}
                  </button>
                </>)}
                {/* All other statuses → Back to Collection */}
                {!['COLLECTION','FOR_SALE','PENDING_SALE','IN_REPAIR','REPAIRED'].includes(device.status) && (
                  <button onClick={() => handleSetStatus('COLLECTION')} disabled={updatingStatus}
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-surface-container-low text-on-surface rounded-xl text-sm font-bold hover:bg-surface-container disabled:opacity-50 transition-all active:scale-[0.98]">
                    <Icon name="arrow_back" className="w-5 h-5" />
                    {t.detail.backToCollection.toUpperCase()}
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Photos Grid */}
          {(navImages.length > 0 || isAuthenticated) && (
            <section className="bg-[var(--card)] p-8 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">{t.detail.photos}</h2>
                {navImages.length > 0 && (
                  <Link href={`/devices/${id}/photos`} className="text-xs text-primary font-semibold hover:underline">
                    {t.detail.viewAll} →
                  </Link>
                )}
              </div>
              {(() => {
                const needsOverflow = navImages.length > 7;
                const displayPhotos = needsOverflow ? navImages.slice(0, 6) : navImages.slice(0, 7);
                const overflowCount = needsOverflow ? navImages.length - 6 : 0;
                const tiles: { type: string; img?: any; count?: number }[] = [];
                displayPhotos.forEach((img: any) => tiles.push({ type: 'photo', img }));
                if (needsOverflow) tiles.push({ type: 'overflow', count: overflowCount });
                while (tiles.length < 7) tiles.push({ type: 'empty' });
                tiles.push({ type: 'add' });
                return (
                  <div className="grid grid-cols-4 gap-2">
                    {tiles.map((tile, i) => {
                      if (tile.type === 'photo') return (
                        <div key={tile.img.id} onClick={() => { const idx = navImages.findIndex((ni: any) => ni.id === tile.img.id); openLightbox(idx >= 0 ? idx : 0); }} className="aspect-square bg-surface-container-low rounded-lg overflow-hidden group cursor-pointer">
                          <img src={`${API_BASE_URL}${tile.img.thumbnailPath || tile.img.path}`} alt={tile.img.caption || ''} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-300" />
                        </div>
                      );
                      if (tile.type === 'overflow') return (
                        <Link key="overflow" href={`/devices/${id}/photos`} className="aspect-square bg-surface-container rounded-lg flex flex-col items-center justify-center hover:bg-surface-container-high transition-all group active:scale-95 cursor-pointer">
                          <span className="text-on-surface font-bold text-2xl transition-transform duration-300 group-hover:scale-110">+{tile.count}</span>
                          <span className="text-outline text-[10px] uppercase tracking-tighter mt-0.5 transition-colors group-hover:text-primary">{t.nav.more}</span>
                        </Link>
                      );
                      if (tile.type === 'add') return (
                        <button key="add"
                          onClick={isAuthenticated ? () => setShowUploader(true) : undefined}
                          className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${isAuthenticated ? 'border-outline-variant hover:border-primary hover:bg-primary/5 cursor-pointer group' : 'border-outline-variant/30 opacity-40 cursor-default'}`}
                        >
                          <Icon name="add" className={`w-8 h-8 text-outline ${isAuthenticated ? 'group-hover:text-primary transition-colors' : ''}`} />
                        </button>
                      );
                      return <div key={`empty-${i}`} className="aspect-square bg-surface-container-low rounded-lg" />;
                    })}
                  </div>
                );
              })()}
            </section>
          )}

          {/* Maintenance Logs */}
          {(sortedTasks.length > 0 || isAuthenticated) && (
            <section className="bg-[var(--card)] p-8 rounded-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-on-surface font-bold text-sm uppercase tracking-widest">{t.detail.maintenanceTasks}</h2>
                {isAuthenticated && (
                  <button onClick={() => setShowMaintenanceForm(true)} className="text-primary text-xs font-semibold hover:underline">{t.detail.addShort}</button>
                )}
              </div>
              {sortedTasks.length === 0 && <p className="text-on-surface-variant text-xs">{t.detail.noMaintenanceYet}</p>}
              <div className="space-y-4">
                {(logsExpanded ? sortedTasks : sortedTasks.slice(0, 5)).map((task: any) => (
                  <div key={task.id} className="bg-surface-container-lowest p-4 rounded-lg group/task">
                    {editingTaskId === task.id ? (
                      <form onSubmit={handleUpdateTask} className="space-y-2">
                        <datalist id="edit-task-label-suggestions">
                          {[...new Set(sortedTasks.map((t: any) => t.label))].map((label: any) => (
                            <option key={label} value={label} />
                          ))}
                        </datalist>
                        <input type="text" list="edit-task-label-suggestions" value={editTaskFormData.label}
                          onChange={e => setEditTaskFormData(p => ({ ...p, label: e.target.value }))}
                          className="w-full px-2 py-1 text-sm bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none" required autoFocus />
                        <input type="date" value={editTaskFormData.dateCompleted}
                          onChange={e => setEditTaskFormData(p => ({ ...p, dateCompleted: e.target.value }))}
                          className="w-full px-2 py-1 text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none" required />
                        <textarea value={editTaskFormData.notes}
                          onChange={e => setEditTaskFormData(p => ({ ...p, notes: e.target.value }))}
                          rows={2} placeholder="Notes (optional)" className="w-full px-2 py-1.5 text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none" />
                        <input type="number" step="0.01" value={editTaskFormData.cost}
                          onChange={e => setEditTaskFormData(p => ({ ...p, cost: e.target.value }))}
                          placeholder="Cost (optional)" className="w-full px-2 py-1 text-xs bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={updatingTask} className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-lg disabled:opacity-50">Save</button>
                          <button type="button" onClick={() => setEditingTaskId(null)} className="px-3 py-1 text-xs font-medium bg-surface-container text-on-surface-variant rounded-lg">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-sm text-on-surface">{task.label}</span>
                            <span className="text-[10px] text-outline shrink-0 ml-2">{formatDateForDisplay(task.dateCompleted).toUpperCase()}</span>
                          </div>
                          {task.notes && <p className="text-xs text-on-surface-variant">{task.notes}</p>}
                          {task.cost != null && <p className="text-xs text-on-surface-variant mt-1">Cost: {formatCurrency(task.cost)}</p>}
                        </div>
                        {isAuthenticated && (
                          <div className="flex flex-col gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity shrink-0">
                            <button type="button" onClick={() => handleEditTask(task)} className="p-1 text-on-surface-variant hover:text-primary rounded transition-colors" title="Edit">
                              <Icon name="edit" className="w-3.5 h-3.5" />
                            </button>
                            <button type="button" onClick={() => setDeleteTaskId(task.id)} className="p-1 text-on-surface-variant hover:text-red-500 rounded transition-colors" title="Delete">
                              <Icon name="delete" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {sortedTasks.length > 5 && (
                <button onClick={() => setLogsExpanded(v => !v)} className="text-primary text-xs font-semibold hover:underline mt-4">
                  {logsExpanded ? `${t.detail.collapse} ↑` : `${t.detail.showMoreCount} ${sortedTasks.length - 5} ↓`}
                </button>
              )}
            </section>
          )}

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
                      <button type="button" onClick={() => setTagToRemoveId(tag.id)} aria-label={`Remove tag ${tag.name}`} className="ml-1 hover:text-red-500 transition-colors">×</button>
                    )}
                  </span>
                ))}
              </div>
              {isAuthenticated && (
                <form onSubmit={handleAddTag} className="flex items-center gap-2 mt-2">
                  <datalist id="tag-suggestions">
                    {(tagsData?.tags ?? []).filter((t: any) => !(device.tags ?? []).some((dt: any) => dt.id === t.id)).map((t: any) => (
                      <option key={t.id} value={t.name} />
                    ))}
                  </datalist>
                  <input type="text" list="tag-suggestions" value={tagName} onChange={e => setTagName(e.target.value)}
                    placeholder={t.detail.addTagPlaceholder} className="flex-1 px-3 py-1.5 text-sm bg-surface-container-low border border-outline-variant/30 rounded-full focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button type="submit" disabled={addingTag || !tagName.trim()} className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-full hover:bg-primary-container disabled:opacity-50 transition-all">Add</button>
                </form>
              )}
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
          deviceUrl={typeof window !== 'undefined' ? window.location.href : `/devices/${id}`}
          deviceName={device.name}
          additionalName={device.additionalName}
          deviceId={parseInt(id as string)}
        />
      )}

      {showMaintenanceForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowMaintenanceForm(false)}>
          <div className="bg-[var(--card)] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-on-surface mb-4">{t.detail.addMaintenanceLog}</h4>
            <form onSubmit={handleCreateMaintenanceTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">{t.detail.taskLabel} *</label>
                <datalist id="maintenance-label-suggestions">
                  {[...new Set(sortedTasks.map((t: any) => t.label))].map((label: any) => (
                    <option key={label} value={label} />
                  ))}
                </datalist>
                <input type="text" list="maintenance-label-suggestions" value={maintenanceFormData.label}
                  onChange={e => setMaintenanceFormData(p => ({ ...p, label: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">{t.detail.dateCompleted} *</label>
                <input type="date" value={maintenanceFormData.dateCompleted}
                  onChange={e => setMaintenanceFormData(p => ({ ...p, dateCompleted: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">{t.common.notes}</label>
                <textarea value={maintenanceFormData.notes}
                  onChange={e => setMaintenanceFormData(p => ({ ...p, notes: e.target.value }))}
                  rows={3} className="w-full px-3 py-2 text-sm bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">{t.detail.costLabel}</label>
                <input type="number" step="0.01" value={maintenanceFormData.cost}
                  onChange={e => setMaintenanceFormData(p => ({ ...p, cost: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border border-outline-variant/40 rounded-lg focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowMaintenanceForm(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">{t.common.cancel}</button>
                <button type="submit" disabled={creatingTask} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-container disabled:opacity-50 transition-all">
                  {creatingTask ? t.detail.saving : t.detail.saveLog}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNoteForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNoteForm(false)}>
          <div className="bg-[var(--card)] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h4 className="text-lg font-bold text-on-surface mb-4">{t.detail.addNoteTitle}</h4>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">{t.detail.noteContent} *</label>
                <textarea value={noteFormData.content}
                  onChange={e => setNoteFormData(p => ({ ...p, content: e.target.value }))}
                  rows={4} className="w-full px-3 py-2 text-sm bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary outline-none resize-none" required autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider mb-1">{t.detail.dateLabel}</label>
                <input type="datetime-local" value={noteFormData.date}
                  onChange={e => setNoteFormData(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 text-sm bg-surface-container-low border-none rounded-lg focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowNoteForm(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">{t.common.cancel}</button>
                <button type="submit" disabled={creatingNote} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-container disabled:opacity-50 transition-all">
                  {creatingNote ? t.detail.saving : t.detail.saveNote}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSoldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--card)] rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">{t.detail.markAsSold}</h4>
            <p className="text-sm text-on-surface-variant mb-4">{t.detail.markAsSoldDesc}</p>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">{t.common.currencySymbol}</span>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={soldAmountInput}
                onChange={e => setSoldAmountInput(e.target.value)}
                className="w-full pl-7 pr-4 py-2 text-sm bg-surface-container-low border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowSoldModal(false); setSoldAmountInput(''); }} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">{t.common.cancel}</button>
              <button onClick={handleMarkSold} disabled={updatingStatus} className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-black disabled:opacity-50 transition-all">
                {updatingStatus ? t.detail.saving : t.detail.confirmMarkSold}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--card)] rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">{t.detail.markAsReturned}</h4>
            <p className="text-sm text-on-surface-variant mb-4">{t.detail.markAsReturnedDesc}</p>
            <div className="relative mb-4">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">{t.common.currencySymbol}</span>
              <input type="number" min="0" step="0.01" placeholder="0.00 (optional)" value={repairFeeInput}
                onChange={e => setRepairFeeInput(e.target.value)}
                className="w-full pl-7 pr-4 py-2 text-sm bg-surface-container-low border border-outline-variant/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowReturnedModal(false); setRepairFeeInput(''); }} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">{t.common.cancel}</button>
              <button onClick={handleMarkReturned} disabled={updatingStatus} className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-container disabled:opacity-50 transition-all">
                {updatingStatus ? t.detail.saving : t.detail.confirmMarkReturned}
              </button>
            </div>
          </div>
        </div>
      )}

      {tagToRemoveId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--card)] rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">{t.detail.removeTagTitle}</h4>
            <p className="text-sm text-on-surface-variant mb-6">
              &ldquo;{(device.tags ?? []).find((tag: any) => tag.id === tagToRemoveId)?.name}&rdquo; {t.detail.removeTagMessage}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setTagToRemoveId(null)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">{t.common.cancel}</button>
              <button onClick={() => handleRemoveTag(tagToRemoveId)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all">{t.common.remove}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTaskId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--card)] rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">{t.detail.deleteMaintenanceLogTitle}</h4>
            <p className="text-sm text-on-surface-variant mb-6">{t.detail.deleteMaintenanceLogDesc}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTaskId(null)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">{t.common.cancel}</button>
              <button onClick={handleDeleteMaintenanceTask} disabled={deletingTask} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                {deletingTask ? t.detail.deleting : t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteNoteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--card)] rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">{t.detail.deleteNoteTitle}</h4>
            <p className="text-sm text-on-surface-variant mb-6">{t.detail.deleteNoteDesc}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteNoteId(null)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">{t.common.cancel}</button>
              <button onClick={handleDeleteNote} disabled={deletingNote} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                {deletingNote ? t.detail.deleting : t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {isLightboxOpen && navImages.length > 0 && (
        <div
          ref={lightboxContainerRef}
          className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center select-none"
          style={{ cursor: lightboxZoom > 1.01 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
          onClick={(e) => { if (e.target === e.currentTarget) { setIsLightboxOpen(false); setLightboxZoom(1); setLightboxPan({ x: 0, y: 0 }); } }}
          onPointerDown={(e) => {
            if (lightboxZoom <= 1.01) return;
            setIsPanning(true);
            panStartRef.current = { x: e.clientX, y: e.clientY };
            panOriginRef.current = { ...lightboxPan };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const rect = lightboxContainerRef.current?.getBoundingClientRect();
            if (rect) lastPointerOffsetRef.current = { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 };
            if (!isPanning || !panStartRef.current || !panOriginRef.current) return;
            setLightboxPan({ x: panOriginRef.current.x + e.clientX - panStartRef.current.x, y: panOriginRef.current.y + e.clientY - panStartRef.current.y });
          }}
          onPointerUp={() => { setIsPanning(false); panStartRef.current = null; panOriginRef.current = null; }}
          onWheel={(e) => {
            e.preventDefault();
            const rect = lightboxContainerRef.current?.getBoundingClientRect();
            if (rect) lastPointerOffsetRef.current = { x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 };
            applyLightboxZoom((prev) => prev * (e.deltaY < 0 ? 1.1 : 1 / 1.1), lastPointerOffsetRef.current ?? undefined);
          }}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
            onClick={() => { setIsLightboxOpen(false); setLightboxZoom(1); setLightboxPan({ x: 0, y: 0 }); }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
          </button>

          {/* Prev */}
          {navImages.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); lightboxNav(-1); }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>
          )}

          {/* Image */}
          <div className="w-full h-full flex items-center justify-center overflow-hidden pointer-events-none px-16">
            <img
              src={`${API_BASE_URL}${navImages[selectedImage]?.path}`}
              alt={navImages[selectedImage]?.caption || device.name}
              draggable={false}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                transform: `scale(${lightboxZoom}) translate(${lightboxPan.x / lightboxZoom}px, ${lightboxPan.y / lightboxZoom}px)`,
                transition: isPanning ? 'none' : 'transform 0.15s ease',
                userSelect: 'none',
              }}
            />
          </div>

          {/* Next */}
          {navImages.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); lightboxNav(1); }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          )}

          {/* Caption + counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
            {navImages[selectedImage]?.caption && (
              <p className="text-white/80 text-sm text-center max-w-md px-4">{navImages[selectedImage].caption}</p>
            )}
            {navImages.length > 1 && (
              <span className="text-white/50 text-xs font-medium bg-black/40 px-3 py-1 rounded-full">
                {selectedImage + 1} / {navImages.length}
              </span>
            )}
          </div>
        </div>
      )}

      {deleteDeviceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--card)] rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
            <h4 className="text-lg font-bold text-on-surface mb-2">{t.detail.deleteDeviceTitle}</h4>
            <p className="text-sm text-on-surface-variant mb-6">{t.detail.deleteDeviceDesc}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteDeviceConfirm(false)} className="px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-all">{t.common.cancel}</button>
              <button onClick={handleDeleteDevice} disabled={deletingDevice} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all">
                {deletingDevice ? t.detail.deleting : t.common.delete}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
