"use client";

import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingPanel } from "../../../components/LoadingPanel";
import { useT } from "../../../i18n/context";

const GET_WISHLIST = gql`
  query GetWishlistItems {
    wishlistItems(where: { deleted: false }) {
      id
      name
      additionalName
      manufacturer
      modelNumber
      releaseYear
      targetPrice
      sourceUrl
      sourceNotes
      notes
      priority
      group
      deleted
      createdAt
      categoryId
      cpu
      ram
      graphics
      storage
      operatingSystem
      externalUrl
      isWifiEnabled
      isPramBatteryRemoved
      category {
        id
        name
        type
      }
    }
    categories {
      id
      name
      type
    }
    templates {
      id
      name
      additionalName
      manufacturer
      modelNumber
      releaseYear
      estimatedValue
      cpu
      ram
      graphics
      storage
      operatingSystem
      externalUrl
      isWifiEnabled
      isPramBatteryRemoved
      categoryId
    }
  }
`;

const CREATE_WISHLIST_ITEM = gql`
  mutation CreateWishlistItem($data: WishlistItemCreateInput!) {
    createWishlistItem(data: $data) {
      id
    }
  }
`;

const UPDATE_WISHLIST_ITEM = gql`
  mutation UpdateWishlistItem($id: Int!, $data: WishlistItemUpdateInput!) {
    updateWishlistItem(id: $id, data: $data) {
      id
    }
  }
`;

const DELETE_WISHLIST_ITEM = gql`
  mutation DeleteWishlistItem($id: Int!) {
    deleteWishlistItem(id: $id) {
      id
    }
  }
`;

interface Category {
  id: number;
  name: string;
  type: string;
}

interface Template {
  id: number;
  name: string;
  additionalName?: string;
  manufacturer?: string;
  modelNumber?: string;
  releaseYear?: number;
  estimatedValue?: number;
  cpu?: string;
  ram?: string;
  graphics?: string;
  storage?: string;
  operatingSystem?: string;
  externalUrl?: string;
  isWifiEnabled?: boolean;
  isPramBatteryRemoved?: boolean;
  categoryId: number;
}

interface WishlistItem {
  id: number;
  name: string;
  additionalName?: string;
  manufacturer?: string;
  modelNumber?: string;
  releaseYear?: number;
  targetPrice?: number;
  sourceUrl?: string;
  sourceNotes?: string;
  notes?: string;
  priority: number;
  group?: string;
  deleted: boolean;
  createdAt: string;
  categoryId?: number;
  category?: Category;
  cpu?: string;
  ram?: string;
  graphics?: string;
  storage?: string;
  operatingSystem?: string;
  externalUrl?: string;
  isWifiEnabled?: boolean;
  isPramBatteryRemoved?: boolean;
}

// PRIORITY_LABELS is now derived from t inside components that need it
const PRIORITY_CLASSES: Record<number, string> = {
  1: "bg-rose-100 text-rose-700 border border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700",
  2: "bg-amber-100 text-amber-700 border border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  3: "bg-gray-100 text-gray-600 border border-gray-300 dark:bg-gray-700/30 dark:text-gray-400 dark:border-gray-600",
};

const emptyForm = {
  name: "",
  additionalName: "",
  manufacturer: "",
  modelNumber: "",
  releaseYear: "",
  targetPrice: "",
  sourceUrl: "",
  sourceNotes: "",
  notes: "",
  priority: 2,
  group: "",
  categoryId: "",
  cpu: "",
  ram: "",
  graphics: "",
  storage: "",
  operatingSystem: "",
  externalUrl: "",
  isWifiEnabled: false,
  isPramBatteryRemoved: false,
};

interface WishlistFormProps {
  categories: Category[];
  templates: Template[];
  existingGroups: string[];
  initialValues?: Partial<typeof emptyForm & { id?: number }>;
  isNew?: boolean;
  onSave: (data: any) => void;
  onCancel: () => void;
  saving: boolean;
}

function WishlistForm({ categories, templates, existingGroups, initialValues, isNew, onSave, onCancel, saving }: WishlistFormProps) {
  const t = useT();
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  const [templateQuery, setTemplateQuery] = useState("");

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return `${t.common.currencySymbol}${Number(value).toFixed(2)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const filteredTemplates = templateQuery.trim()
    ? templates.filter(t =>
        t.name.toLowerCase().includes(templateQuery.toLowerCase()) ||
        t.manufacturer?.toLowerCase().includes(templateQuery.toLowerCase()) ||
        t.modelNumber?.toLowerCase().includes(templateQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const applyTemplate = (t: Template) => {
    setForm(prev => ({
      ...prev,
      name: t.name || prev.name,
      additionalName: t.additionalName ?? prev.additionalName,
      manufacturer: t.manufacturer ?? prev.manufacturer,
      modelNumber: t.modelNumber ?? prev.modelNumber,
      releaseYear: t.releaseYear ? String(t.releaseYear) : prev.releaseYear,
      cpu: t.cpu ?? prev.cpu,
      ram: t.ram ?? prev.ram,
      graphics: t.graphics ?? prev.graphics,
      storage: t.storage ?? prev.storage,
      operatingSystem: t.operatingSystem ?? prev.operatingSystem,
      externalUrl: t.externalUrl ?? prev.externalUrl,
      isWifiEnabled: t.isWifiEnabled ?? prev.isWifiEnabled,
      isPramBatteryRemoved: t.isPramBatteryRemoved ?? prev.isPramBatteryRemoved,
      categoryId: t.categoryId ? String(t.categoryId) : prev.categoryId,
    }));
    setTemplateQuery("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      name: form.name,
      priority: Number(form.priority),
    };
    if (form.additionalName) data.additionalName = form.additionalName;
    if (form.manufacturer) data.manufacturer = form.manufacturer;
    if (form.modelNumber) data.modelNumber = form.modelNumber;
    if (form.releaseYear) data.releaseYear = parseInt(form.releaseYear as string, 10);
    if (form.targetPrice) data.targetPrice = parseFloat(form.targetPrice as string);
    if (form.sourceUrl) data.sourceUrl = form.sourceUrl;
    if (form.sourceNotes) data.sourceNotes = form.sourceNotes;
    if (form.notes) data.notes = form.notes;
    if (form.group) data.group = form.group;
    if (form.categoryId) data.categoryId = parseInt(form.categoryId as string, 10);
    if (form.cpu) data.cpu = form.cpu;
    if (form.ram) data.ram = form.ram;
    if (form.graphics) data.graphics = form.graphics;
    if (form.storage) data.storage = form.storage;
    if (form.operatingSystem) data.operatingSystem = form.operatingSystem;
    if (form.externalUrl) data.externalUrl = form.externalUrl;
    if (form.isWifiEnabled) data.isWifiEnabled = form.isWifiEnabled;
    if (form.isPramBatteryRemoved) data.isPramBatteryRemoved = form.isPramBatteryRemoved;
    onSave(data);
  };

  const inputClass = "input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]";
  const selectClass = "select-flat w-full px-4 py-2 text-sm text-[var(--foreground)]";
  const labelClass = "block text-xs font-medium text-[var(--muted-foreground)] mb-1";
  const checkboxLabel = "flex items-center gap-2 text-sm text-[var(--foreground)]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template picker — new items only */}
      {isNew && <div>
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">{t.pages.wishlist.templateSection}</p>
        <input
          type="text"
          value={templateQuery}
          onChange={e => setTemplateQuery(e.target.value)}
          placeholder={t.pages.wishlist.templateSearch}
          className={inputClass}
        />
        {filteredTemplates.length > 0 && (
          <div className="mt-1 border border-[var(--border)] rounded divide-y divide-[var(--border)] bg-[var(--card)]">
            {filteredTemplates.map(tpl => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--accent)] transition-colors"
              >
                <span className="font-medium text-[var(--foreground)]">{tpl.name}</span>
                {tpl.manufacturer && <span className="text-[var(--muted-foreground)] ml-2">· {tpl.manufacturer}</span>}
              </button>
            ))}
          </div>
        )}
        {templateQuery && filteredTemplates.length === 0 && (
          <p className="text-xs text-[var(--muted-foreground)] mt-1">{t.pages.wishlist.noTemplatesFound}</p>
        )}
      </div>}

      {/* Basic info */}
      <div>
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">{t.pages.wishlist.basicInfo}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t.common.name} <span className="text-[var(--apple-red)]">*</span></label>
            <input name="name" value={form.name} onChange={handleChange} required className={inputClass} placeholder="e.g. Apple Macintosh Plus" />
          </div>
          <div>
            <label className={labelClass}>{t.form.additionalNameLabel}</label>
            <input name="additionalName" value={form.additionalName} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t.form.manufacturerLabel}</label>
            <input name="manufacturer" value={form.manufacturer} onChange={handleChange} className={inputClass} placeholder="e.g. Apple" />
          </div>
          <div>
            <label className={labelClass}>{t.form.modelNumberLabel}</label>
            <input name="modelNumber" value={form.modelNumber} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t.detail.releaseYear}</label>
            <input name="releaseYear" type="number" value={form.releaseYear} onChange={handleChange} className={inputClass} placeholder="e.g. 1986" min="1900" max="2099" />
          </div>
          <div>
            <label className={labelClass}>{t.pages.wishlist.targetPriceLabel}</label>
            <input name="targetPrice" type="number" step="0.01" value={form.targetPrice} onChange={handleChange} className={inputClass} placeholder="0.00" />
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select name="priority" value={form.priority} onChange={handleChange} className={selectClass}>
              <option value={1}>{t.pages.wishlist.high}</option>
              <option value={2}>{t.pages.wishlist.medium}</option>
              <option value={3}>{t.pages.wishlist.low}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t.filter.category}</label>
            <select name="categoryId" value={form.categoryId} onChange={handleChange} className={selectClass}>
              <option value="">{t.pages.wishlist.noneOption}</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t.pages.wishlist.groupLabel}</label>
            <input
              name="group"
              value={form.group}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Mac Classics, Portables"
              list="wishlist-groups"
              autoComplete="off"
            />
            {existingGroups.length > 0 && (
              <datalist id="wishlist-groups">
                {existingGroups.map(g => <option key={g} value={g} />)}
              </datalist>
            )}
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div>
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">{t.pages.wishlist.specifications}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t.detail.cpu}</label>
            <input name="cpu" value={form.cpu} onChange={handleChange} className={inputClass} placeholder="e.g. Motorola 68000" />
          </div>
          <div>
            <label className={labelClass}>{t.detail.ram}</label>
            <input name="ram" value={form.ram} onChange={handleChange} className={inputClass} placeholder="e.g. 4 MB" />
          </div>
          <div>
            <label className={labelClass}>{t.detail.graphics}</label>
            <input name="graphics" value={form.graphics} onChange={handleChange} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t.detail.storage}</label>
            <input name="storage" value={form.storage} onChange={handleChange} className={inputClass} placeholder="e.g. 40 MB HDD" />
          </div>
          <div>
            <label className={labelClass}>{t.detail.operatingSystem}</label>
            <input name="operatingSystem" value={form.operatingSystem} onChange={handleChange} className={inputClass} placeholder="e.g. System 7" />
          </div>
          <div>
            <label className={labelClass}>External URL</label>
            <input name="externalUrl" type="url" value={form.externalUrl} onChange={handleChange} className={inputClass} placeholder="https://..." />
          </div>
          <div className="flex gap-6">
            <label className={checkboxLabel}>
              <input type="checkbox" name="isWifiEnabled" checked={!!form.isWifiEnabled} onChange={handleChange} className="rounded" />
              {t.detail.wifiEnabled}
            </label>
            <label className={checkboxLabel}>
              <input type="checkbox" name="isPramBatteryRemoved" checked={!!form.isPramBatteryRemoved} onChange={handleChange} className="rounded" />
              {t.detail.pramBatteryRemoved}
            </label>
          </div>
        </div>
      </div>

      {/* Source & Notes */}
      <div>
        <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-3">{t.pages.wishlist.sourceAndNotes}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>{t.pages.wishlist.sourceUrlLabel}</label>
            <input name="sourceUrl" type="url" value={form.sourceUrl} onChange={handleChange} className={inputClass} placeholder="https://..." />
          </div>
          <div>
            <label className={labelClass}>{t.pages.wishlist.sourceNotesLabel}</label>
            <input name="sourceNotes" value={form.sourceNotes} onChange={handleChange} className={inputClass} placeholder="Where to find it, seller details, etc." />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>{t.common.notes}</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} className={inputClass} rows={3} placeholder="Condition requirements, variant notes, etc." />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="btn-retro text-sm px-4 py-1.5">
          {saving ? t.pages.wishlist.saving : t.common.save}
        </button>
        <button type="button" onClick={onCancel} className="btn-retro text-sm px-4 py-1.5">
          {t.common.cancel}
        </button>
      </div>
    </form>
  );
}

function WishlistItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (item: WishlistItem) => void;
}) {
  const t = useT();
  const router = useRouter();

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "";
    return `${t.common.currencySymbol}${Number(value).toFixed(2)}`;
  };

  const PRIORITY_LABELS: Record<number, string> = {
    1: t.pages.wishlist.high,
    2: t.pages.wishlist.medium,
    3: t.pages.wishlist.low,
  };

  const handleMarkAcquired = () => {
    const params = new URLSearchParams();
    if (item.name) params.set("name", item.name);
    if (item.additionalName) params.set("additionalName", item.additionalName);
    if (item.manufacturer) params.set("manufacturer", item.manufacturer);
    if (item.modelNumber) params.set("modelNumber", item.modelNumber);
    if (item.releaseYear) params.set("releaseYear", String(item.releaseYear));
    if (item.categoryId) params.set("categoryId", String(item.categoryId));
    if (item.cpu) params.set("cpu", item.cpu);
    if (item.ram) params.set("ram", item.ram);
    if (item.graphics) params.set("graphics", item.graphics);
    if (item.storage) params.set("storage", item.storage);
    if (item.operatingSystem) params.set("operatingSystem", item.operatingSystem);
    if (item.externalUrl) params.set("externalUrl", item.externalUrl);
    if (item.isWifiEnabled) params.set("isWifiEnabled", "1");
    if (item.isPramBatteryRemoved) params.set("isPramBatteryRemoved", "1");
    router.push(`/devices/new?${params.toString()}`);
  };

  const hasSpecs = item.cpu || item.ram || item.graphics || item.storage || item.operatingSystem;

  return (
    <div className="rounded border border-[var(--border)] bg-[var(--background)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-medium text-[var(--foreground)] text-sm">{item.name}</span>
            {item.additionalName && (
              <span className="text-xs text-[var(--muted-foreground)]">{item.additionalName}</span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_CLASSES[item.priority] ?? PRIORITY_CLASSES[3]}`}>
              {PRIORITY_LABELS[item.priority] ?? "Low"}
            </span>
            {item.category && (
              <span className="text-xs text-[var(--muted-foreground)] border border-[var(--border)] rounded px-1.5 py-0.5">
                {item.category.name}
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--muted-foreground)] space-y-0.5">
            {(item.manufacturer || item.modelNumber) && (
              <div>
                {[item.manufacturer, item.modelNumber].filter(Boolean).join(" · ")}
                {item.releaseYear ? ` (${item.releaseYear})` : ""}
              </div>
            )}
            {item.targetPrice != null && (
              <div>{t.pages.wishlist.targetPrefix} <span className="text-[var(--foreground)]">{formatCurrency(item.targetPrice)}</span></div>
            )}
            {hasSpecs && (
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {item.cpu && <span>CPU: {item.cpu}</span>}
                {item.ram && <span>RAM: {item.ram}</span>}
                {item.storage && <span>Storage: {item.storage}</span>}
                {item.operatingSystem && <span>OS: {item.operatingSystem}</span>}
              </div>
            )}
            {item.sourceNotes && (
              <div className="truncate">{t.pages.wishlist.sourcePrefix} {item.sourceNotes}</div>
            )}
            {item.notes && (
              <div className="text-[var(--muted-foreground)] line-clamp-2">{item.notes}</div>
            )}
            {item.sourceUrl && (
              <div>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--apple-blue)] hover:underline">
                  {t.pages.wishlist.viewSource}
                </a>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={handleMarkAcquired} className="btn-retro text-xs px-2 py-1" title="Mark as Acquired — create a new device from this wishlist item">
            {t.pages.wishlist.acquiredBtn}
          </button>
          <button onClick={() => onEdit(item)} className="btn-retro text-xs px-2 py-1">
            {t.common.edit}
          </button>
          <button onClick={() => onDelete(item)} className="btn-retro text-xs px-2 py-1 text-[var(--apple-red)]">
            {t.common.delete}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WishlistPage() {
  const t = useT();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);

  const { data, loading, error, refetch } = useQuery(GET_WISHLIST, {
    fetchPolicy: "cache-and-network",
  });

  const [createItem, { loading: creating }] = useMutation(CREATE_WISHLIST_ITEM);
  const [updateItem, { loading: updating }] = useMutation(UPDATE_WISHLIST_ITEM);
  const [deleteItem] = useMutation(DELETE_WISHLIST_ITEM);

  const items: WishlistItem[] = data?.wishlistItems ?? [];
  const categories: Category[] = data?.categories ?? [];
  const templates: Template[] = data?.templates ?? [];
  const existingGroups = [...new Set(items.map(i => i.group?.trim()).filter((g): g is string => !!g))].sort();

  const grouped = items.reduce<Record<string, WishlistItem[]>>((acc, item) => {
    const key = item.group?.trim() || "__other__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const groupKeys = [
    ...Object.keys(grouped).filter(k => k !== "__other__").sort(),
    ...(grouped["__other__"] ? ["__other__"] : []),
  ];

  const handleCreate = async (formData: any) => {
    await createItem({ variables: { data: formData } });
    setShowForm(false);
    refetch();
  };

  const handleUpdate = async (formData: any) => {
    if (!editingItem) return;
    await updateItem({ variables: { id: editingItem.id, data: formData } });
    setEditingItem(null);
    refetch();
  };

  const handleDelete = async (item: WishlistItem) => {
    if (!confirm(`${t.pages.wishlist.deleteConfirmPre}${item.name}${t.pages.wishlist.deleteConfirmPost}`)) return;
    await deleteItem({ variables: { id: item.id } });
    refetch();
  };

  const editInitialValues = editingItem ? {
    name: editingItem.name,
    additionalName: editingItem.additionalName ?? "",
    manufacturer: editingItem.manufacturer ?? "",
    modelNumber: editingItem.modelNumber ?? "",
    releaseYear: editingItem.releaseYear ? String(editingItem.releaseYear) : "",
    targetPrice: editingItem.targetPrice != null ? String(editingItem.targetPrice) : "",
    sourceUrl: editingItem.sourceUrl ?? "",
    sourceNotes: editingItem.sourceNotes ?? "",
    notes: editingItem.notes ?? "",
    priority: editingItem.priority,
    group: editingItem.group ?? "",
    categoryId: editingItem.categoryId ? String(editingItem.categoryId) : "",
    cpu: editingItem.cpu ?? "",
    ram: editingItem.ram ?? "",
    graphics: editingItem.graphics ?? "",
    storage: editingItem.storage ?? "",
    operatingSystem: editingItem.operatingSystem ?? "",
    externalUrl: editingItem.externalUrl ?? "",
    isWifiEnabled: editingItem.isWifiEnabled ?? false,
    isPramBatteryRemoved: editingItem.isPramBatteryRemoved ?? false,
  } : undefined;

  return (
    <div className="min-h-screen font-sans">
      <div className="rainbow-stripe mb-6" />

      <header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{t.pages.wishlist.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t.pages.wishlist.subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowForm(true); setEditingItem(null); }}
            className="btn-retro text-sm px-3 py-1.5"
          >
            {t.pages.wishlist.addItem}
          </button>
        </div>
      </header>

      {loading && (
        <div className="p-4">
          <LoadingPanel title={t.pages.wishlist.loading} subtitle={t.pages.wishlist.loadingSubtitle} />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {/* Add form */}
      {showForm && (
        <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro mb-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{t.pages.wishlist.newItem}</h2>
          <WishlistForm
            categories={categories}
            templates={templates}
            existingGroups={existingGroups}
            isNew
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            saving={creating}
          />
        </section>
      )}

      {/* Edit form */}
      {editingItem && (
        <section className="rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro mb-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">{t.pages.wishlist.editPrefix} {editingItem.name}</h2>
          <WishlistForm
            categories={categories}
            templates={templates}
            existingGroups={existingGroups}
            initialValues={editInitialValues}
            onSave={handleUpdate}
            onCancel={() => setEditingItem(null)}
            saving={updating}
          />
        </section>
      )}

      {!loading && !error && items.length === 0 && !showForm && (
        <div className="text-center py-16 text-[var(--muted-foreground)]">
          <div className="text-4xl mb-4">✦</div>
          <p className="text-sm">{t.pages.wishlist.emptyTitle}</p>
          <p className="text-xs mt-1">{t.pages.wishlist.emptySubtitle}</p>
        </div>
      )}

      {/* Grouped items */}
      {!loading && !error && items.length > 0 && (
        <div className="space-y-6">
          {groupKeys.map(groupKey => {
            const groupItems = grouped[groupKey];
            const groupLabel = groupKey === "__other__" ? t.pages.wishlist.other : groupKey;
            return (
              <section key={groupKey} className="rounded border border-[var(--border)] bg-[var(--card)] overflow-hidden card-retro">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                  <h2 className="text-sm font-semibold text-[var(--foreground)]">{groupLabel}</h2>
                  <span className="text-xs text-[var(--muted-foreground)]">{groupItems.length} {groupItems.length !== 1 ? t.pages.wishlist.itemPlural : t.pages.wishlist.itemSingular}</span>
                </div>
                <div className="p-4 space-y-3">
                  {groupItems.map(item => (
                    <WishlistItemCard
                      key={item.id}
                      item={item}
                      onEdit={item => { setEditingItem(item); setShowForm(false); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
