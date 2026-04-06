"use client";

import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { useT } from "../i18n/context";

const GET_CUSTOM_FIELDS = gql`
  query GetCustomFields {
    customFields {
      id
      name
      isPublic
      sortOrder
    }
  }
`;

const SET_CUSTOM_FIELD_VALUE = gql`
  mutation SetCustomFieldValue($input: SetCustomFieldValueInput!) {
    setCustomFieldValue(input: $input) {
      id
      customFieldId
      customFieldName
      value
      isPublic
    }
  }
`;

const REMOVE_CUSTOM_FIELD_VALUE = gql`
  mutation RemoveCustomFieldValue($deviceId: Int!, $customFieldId: Int!) {
    removeCustomFieldValue(deviceId: $deviceId, customFieldId: $customFieldId)
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

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      type
    }
  }
`;

const GET_LOCATIONS = gql`
  query GetLocationsForForm {
    locations {
      id
      name
    }
  }
`;

const CREATE_LOCATION_INLINE = gql`
  mutation CreateLocationInline($name: String!) {
    createLocation(name: $name) {
      id
      name
    }
  }
`;

const GET_TEMPLATES = gql`
  query GetTemplates {
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
      externalLinkLabel
      isWifiEnabled
      isPramBatteryRemoved
      rarity
      categoryId
    }
  }
`;

const CREATE_DEVICE = gql`
  mutation CreateDevice($input: DeviceCreateInput!) {
    createDevice(input: $input) {
      id
    }
  }
`;

const UPDATE_DEVICE = gql`
  mutation UpdateDevice($input: DeviceUpdateInput!) {
    updateDevice(input: $input) {
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
    }
  }
`;

interface DeviceAccessory {
    id: number;
    name: string;
}

interface DeviceLink {
    id: number;
    label: string;
    url: string;
}

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
    externalLinkLabel?: string;
    isWifiEnabled?: boolean;
    isPramBatteryRemoved?: boolean;
    rarity?: string;
    categoryId: number;
}

interface DeviceData {
    id: number;
    name: string;
    additionalName?: string;
    manufacturer: string;
    modelNumber: string;
    serialNumber: string;
    releaseYear: number;
    location: { id: number; name: string } | null;
    info?: string;
    isFavorite: boolean;
    externalUrl?: string;
    status: string;
    functionalStatus: string;
    condition?: string;
    rarity?: string;
    hasOriginalBox: boolean;
    isAssetTagged: boolean;
    dateAcquired?: string;
    whereAcquired?: string;
    priceAcquired?: number;
    estimatedValue?: number;
    listPrice?: number;
    soldPrice?: number;
    soldDate?: string;
    cpu?: string;
    ram?: string;
    graphics?: string;
    storage?: string;
    operatingSystem?: string;
    isWifiEnabled?: boolean;
    isPramBatteryRemoved?: boolean;
    lastPowerOnDate?: string;
    accessories?: DeviceAccessory[];
    links?: DeviceLink[];
    category: {
        id: number;
        type: string;
    };
    customFieldValues?: {
        id: number;
        customFieldId: number;
        customFieldName: string;
        value: string;
        isPublic: boolean;
    }[];
}

interface DevicePrefill {
    name?: string;
    additionalName?: string;
    manufacturer?: string;
    modelNumber?: string;
    releaseYear?: number;
    categoryId?: number;
    cpu?: string;
    ram?: string;
    graphics?: string;
    storage?: string;
    operatingSystem?: string;
    externalUrl?: string;
    isWifiEnabled?: boolean;
    isPramBatteryRemoved?: boolean;
}

interface DeviceFormProps {
    device?: DeviceData;
    mode: "create" | "edit";
    prefill?: DevicePrefill;
}

function SectionHeader({ children }: { children: React.ReactNode }) {
    return (
        <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-4 mt-8 first:mt-0">
            {children}
        </h3>
    );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <div>
            <label className="block text-sm font-medium text-[var(--muted-foreground)] mb-1">
                {label}
                {required && <span className="text-[var(--apple-red)] ml-1">*</span>}
            </label>
            {children}
        </div>
    );
}

const inputClass = "input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]";
const selectClass = "select-flat w-full px-4 py-2 text-sm text-[var(--foreground)]";

const getLocalDateInputValue = () => {
    const d = new Date();
    const tzOffsetMs = d.getTimezoneOffset() * 60 * 1000;
    return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
};

export function DeviceForm({ device, mode, prefill }: DeviceFormProps) {
    const t = useT();
    const router = useRouter();
    const { data: categoriesData } = useQuery(GET_CATEGORIES);
    const { data: locationsData, refetch: refetchLocations } = useQuery(GET_LOCATIONS);
    const { data: templatesData } = useQuery(GET_TEMPLATES);
    const { data: customFieldsData } = useQuery(GET_CUSTOM_FIELDS);
    const [createLocationInline] = useMutation(CREATE_LOCATION_INLINE);
    const [createDevice, { loading: creating }] = useMutation(CREATE_DEVICE);
    const [updateDevice, { loading: updating }] = useMutation(UPDATE_DEVICE);
    const [setCustomFieldValue] = useMutation(SET_CUSTOM_FIELD_VALUE);
    const [removeCustomFieldValue] = useMutation(REMOVE_CUSTOM_FIELD_VALUE);
    const [addDeviceAccessory] = useMutation(ADD_DEVICE_ACCESSORY);
    const [removeDeviceAccessory] = useMutation(REMOVE_DEVICE_ACCESSORY);
    const [addDeviceLink] = useMutation(ADD_DEVICE_LINK);
    const [removeDeviceLink] = useMutation(REMOVE_DEVICE_LINK);

    const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
    const [barcodeSupported, setBarcodeSupported] = useState(false);

    const [formData, setFormData] = useState({
        name: prefill?.name ?? "",
        additionalName: prefill?.additionalName ?? "",
        manufacturer: prefill?.manufacturer ?? "",
        modelNumber: prefill?.modelNumber ?? "",
        serialNumber: "",
        releaseYear: prefill?.releaseYear ?? new Date().getFullYear(),
        locationId: 0 as number,
        categoryId: prefill?.categoryId ?? 0,
        info: "",
        isFavorite: false,
        externalUrl: prefill?.externalUrl ?? "",
        status: "COLLECTION",
        functionalStatus: "YES",
        condition: "" as string,
        rarity: "" as string,
        hasOriginalBox: false,
        isAssetTagged: false,
        dateAcquired: getLocalDateInputValue(),
        whereAcquired: "",
        priceAcquired: "",
        estimatedValue: "",
        listPrice: "",
        soldPrice: "",
        soldDate: "",
        cpu: prefill?.cpu ?? "",
        ram: prefill?.ram ?? "",
        graphics: prefill?.graphics ?? "",
        storage: prefill?.storage ?? "",
        operatingSystem: prefill?.operatingSystem ?? "",
        isWifiEnabled: prefill?.isWifiEnabled ?? false,
        isPramBatteryRemoved: prefill?.isPramBatteryRemoved ?? false,
        lastPowerOnDate: "",
    });

    const [customFieldFormValues, setCustomFieldFormValues] = useState<Record<number, string>>({});

    const [selectedTemplateId, setSelectedTemplateId] = useState<number>(0);
    const [templateQuery, setTemplateQuery] = useState<string>("");

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Accessories state
    const [accessories, setAccessories] = useState<Array<{id?: number, name: string}>>(
        device?.accessories?.map(a => ({ id: a.id, name: a.name })) ?? []
    );
    const [newAccessoryName, setNewAccessoryName] = useState("");

    // Links state
    const [links, setLinks] = useState<Array<{id?: number, label: string, url: string}>>(
        device?.links?.map(l => ({ id: l.id, label: l.label, url: l.url })) ?? []
    );
    const [newLinkLabel, setNewLinkLabel] = useState("");
    const [newLinkUrl, setNewLinkUrl] = useState("");

    useEffect(() => {
        const BarcodeDetectorCtor = typeof window !== "undefined" ? (window as any).BarcodeDetector : undefined;
        setBarcodeSupported(typeof BarcodeDetectorCtor === "function" && !!navigator?.mediaDevices?.getUserMedia);
    }, []);

    useEffect(() => {
        if (device && mode === "edit") {
            setFormData({
                name: device.name || "",
                additionalName: device.additionalName || "",
                manufacturer: device.manufacturer || "",
                modelNumber: device.modelNumber || "",
                serialNumber: device.serialNumber || "",
                releaseYear: device.releaseYear || new Date().getFullYear(),
                locationId: device.location?.id ?? 0,
                categoryId: device.category?.id || 0,
                info: device.info || "",
                isFavorite: device.isFavorite || false,
                externalUrl: device.externalUrl || "",
                status: device.status || "COLLECTION",
                functionalStatus: device.functionalStatus || "YES",
                condition: device.condition || "",
                rarity: device.rarity || "",
                hasOriginalBox: device.hasOriginalBox || false,
                isAssetTagged: device.isAssetTagged || false,
                dateAcquired: device.dateAcquired ? device.dateAcquired.split("T")[0] : "",
                whereAcquired: device.whereAcquired || "",
                priceAcquired: device.priceAcquired?.toString() || "",
                estimatedValue: device.estimatedValue?.toString() || "",
                listPrice: device.listPrice?.toString() || "",
                soldPrice: device.soldPrice?.toString() || "",
                soldDate: device.soldDate ? device.soldDate.split("T")[0] : "",
                cpu: device.cpu || "",
                ram: device.ram || "",
                graphics: device.graphics || "",
                storage: device.storage || "",
                operatingSystem: device.operatingSystem || "",
                isWifiEnabled: device.isWifiEnabled || false,
                isPramBatteryRemoved: device.isPramBatteryRemoved || false,
                lastPowerOnDate: device.lastPowerOnDate ? device.lastPowerOnDate.split("T")[0] : "",
            });

            setAccessories(device.accessories?.map(a => ({ id: a.id, name: a.name })) ?? []);
            setLinks(device.links?.map(l => ({ id: l.id, label: l.label, url: l.url })) ?? []);

            // Populate custom field values
            if (device.customFieldValues) {
                const cfValues: Record<number, string> = {};
                for (const cfv of device.customFieldValues) {
                    cfValues[cfv.customFieldId] = cfv.value;
                }
                setCustomFieldFormValues(cfValues);
            }
        }
    }, [device, mode]);

    const templates: Template[] = templatesData?.templates || [];

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    const normalizedTemplateQuery = templateQuery.trim().toLowerCase();
    const filteredTemplates = templates
        .filter((t) => {
            if (!normalizedTemplateQuery) return true;
            const haystack = [t.name, t.additionalName, t.manufacturer, t.modelNumber]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(normalizedTemplateQuery);
        })
        .slice(0, 50);

    const showTemplateResults = normalizedTemplateQuery.length > 0;

    const categories: Category[] = categoriesData?.categories || [];
    const selectedCategory = categories.find(c => c.id === formData.categoryId);
    const isComputerCategory = selectedCategory?.type === "COMPUTER";
    const showSalesFields = ["FOR_SALE", "PENDING_SALE", "SOLD", "DONATED"].includes(formData.status);
    const showSoldFields = formData.status === "SOLD";
    const showDonatedFields = formData.status === "DONATED";
    const showDateField = showSoldFields || showDonatedFields;
    const showRepairFeeField = formData.status === "RETURNED";

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        const nextValue = (() => {
            if (type === "checkbox") return checked;
            if (name === "categoryId" || name === "releaseYear") {
                const n = parseInt(value, 10);
                return Number.isNaN(n) ? 0 : n;
            }
            return value;
        })();

        setFormData(prev => {
            const updates: any = { [name]: nextValue };

            // Auto-populate sold date when status changes to SOLD, DONATED, or RETURNED
            if (name === "status" && (value === "SOLD" || value === "DONATED" || value === "RETURNED") && !prev.soldDate) {
                updates.soldDate = getLocalDateInputValue();
            }

            return { ...prev, ...updates };
        });

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

    const applyTemplate = (templateId: number) => {
        setSelectedTemplateId(templateId);
        const tpl = templates.find(t => t.id === templateId);
        if (!tpl) return;

        setFormData(prev => {
            const next = { ...prev };

            // Template.name corresponds to the device name template
            if (typeof tpl.name === 'string') next.name = tpl.name;
            if (typeof tpl.additionalName === 'string') next.additionalName = tpl.additionalName;
            if (typeof tpl.manufacturer === 'string') next.manufacturer = tpl.manufacturer;
            if (typeof tpl.modelNumber === 'string') next.modelNumber = tpl.modelNumber;
            // externalUrl is handled as a DeviceLink after create (not stored in formData)
            if (typeof tpl.cpu === 'string') next.cpu = tpl.cpu;
            if (typeof tpl.ram === 'string') next.ram = tpl.ram;
            if (typeof tpl.graphics === 'string') next.graphics = tpl.graphics;
            if (typeof tpl.storage === 'string') next.storage = tpl.storage;
            if (typeof tpl.operatingSystem === 'string') next.operatingSystem = tpl.operatingSystem;

            if (typeof tpl.categoryId === 'number') next.categoryId = tpl.categoryId;
            if (typeof tpl.releaseYear === 'number') next.releaseYear = tpl.releaseYear;

            if (typeof tpl.estimatedValue === 'number') next.estimatedValue = tpl.estimatedValue.toString();

            if (typeof tpl.isWifiEnabled === 'boolean') next.isWifiEnabled = tpl.isWifiEnabled;
            if (typeof tpl.isPramBatteryRemoved === 'boolean') next.isPramBatteryRemoved = tpl.isPramBatteryRemoved;
            if (typeof tpl.rarity === 'string') next.rarity = tpl.rarity;

            return next;
        });
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.categoryId) newErrors.categoryId = "Category is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const input: any = {
            name: formData.name,
            categoryId: parseInt(formData.categoryId.toString()),
            status: formData.status,
            functionalStatus: formData.functionalStatus,
            isFavorite: formData.isFavorite,
            hasOriginalBox: formData.hasOriginalBox,
            isAssetTagged: formData.isAssetTagged,
        };

        // Add optional string fields if not empty
        if (formData.additionalName) input.additionalName = formData.additionalName;
        if (formData.manufacturer) input.manufacturer = formData.manufacturer;
        if (formData.modelNumber) input.modelNumber = formData.modelNumber;
        if (formData.serialNumber) input.serialNumber = formData.serialNumber;
        if (formData.locationId) input.locationId = formData.locationId;
        if (formData.info) input.info = formData.info;
        if (formData.externalUrl) input.externalUrl = formData.externalUrl;
        if (formData.whereAcquired) input.whereAcquired = formData.whereAcquired;
        if (formData.condition) input.condition = formData.condition;
        if (formData.rarity) input.rarity = formData.rarity;

        // Add optional numeric fields
        if (formData.releaseYear) input.releaseYear = parseInt(formData.releaseYear.toString());
        if (formData.priceAcquired) input.priceAcquired = parseFloat(formData.priceAcquired);
        if (formData.estimatedValue) input.estimatedValue = parseFloat(formData.estimatedValue);
        if (formData.listPrice) input.listPrice = parseFloat(formData.listPrice);
        if (formData.soldPrice) input.soldPrice = parseFloat(formData.soldPrice);

        // Add optional date fields - parse as local date to avoid timezone shift
        const parseLocalDate = (dateStr: string) => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day, 12, 0, 0).toISOString();
        };
        if (formData.dateAcquired) input.dateAcquired = parseLocalDate(formData.dateAcquired);
        if (formData.soldDate) input.soldDate = parseLocalDate(formData.soldDate);
        if (formData.lastPowerOnDate) input.lastPowerOnDate = parseLocalDate(formData.lastPowerOnDate);

        // Add computer specs if applicable
        if (isComputerCategory) {
            if (formData.cpu) input.cpu = formData.cpu;
            if (formData.ram) input.ram = formData.ram;
            if (formData.graphics) input.graphics = formData.graphics;
            if (formData.storage) input.storage = formData.storage;
            if (formData.operatingSystem) input.operatingSystem = formData.operatingSystem;
            input.isWifiEnabled = formData.isWifiEnabled;
            input.isPramBatteryRemoved = formData.isPramBatteryRemoved;
        }

        try {
            let deviceId: number;
            if (mode === "create") {
                const result = await createDevice({ variables: { input } });
                deviceId = result.data.createDevice.id;
            } else {
                await updateDevice({ variables: { input: { ...input, id: device!.id } } });
                deviceId = device!.id;
            }

            // Save custom field values
            const customFields = customFieldsData?.customFields || [];
            const originalValues: Record<number, string> = {};
            if (device?.customFieldValues) {
                for (const cfv of device.customFieldValues) {
                    originalValues[cfv.customFieldId] = cfv.value;
                }
            }

            for (const field of customFields) {
                const newValue = (customFieldFormValues[field.id] || "").trim();
                const oldValue = (originalValues[field.id] || "").trim();

                if (newValue && newValue !== oldValue) {
                    await setCustomFieldValue({
                        variables: {
                            input: { deviceId, customFieldId: field.id, value: newValue },
                        },
                    });
                } else if (!newValue && oldValue) {
                    await removeCustomFieldValue({
                        variables: { deviceId, customFieldId: field.id },
                    });
                }
            }

            // Save accessories (create mode only — edit mode is handled inline)
            if (mode === "create") {
                for (const acc of accessories) {
                    await addDeviceAccessory({ variables: { deviceId, name: acc.name } });
                }
                for (const link of links) {
                    await addDeviceLink({ variables: { deviceId, label: link.label, url: link.url } });
                }
                // If a template with a reference link was applied, create it as a DeviceLink
                if (selectedTemplate?.externalUrl) {
                    const label = selectedTemplate.externalLinkLabel || selectedTemplate.externalUrl;
                    await addDeviceLink({ variables: { deviceId, label, url: selectedTemplate.externalUrl } });
                }
            }

            router.push(`/devices/${deviceId}`);
        } catch (err) {
            console.error("Error saving device:", err);
        }
    };

    const loading = creating || updating;

    const categoryType = categoriesData?.categories?.find((c: any) => c.id === formData.categoryId)?.type ?? "";
    const accessorySuggestions = categoryType === 'COMPUTER'
        ? t.detail.accessorySuggestionsComputer
        : t.detail.accessorySuggestionsOther;

    const handleAddAccessory = async (name: string) => {
        if (!name.trim() || accessories.some(a => a.name === name.trim())) return;
        if (mode === 'edit' && device?.id) {
            const res = await addDeviceAccessory({ variables: { deviceId: device.id, name: name.trim() } });
            setAccessories(prev => [...prev, { id: res.data.addDeviceAccessory.id, name: name.trim() }]);
        } else {
            setAccessories(prev => [...prev, { name: name.trim() }]);
        }
        setNewAccessoryName("");
    };

    const handleRemoveAccessory = async (index: number) => {
        const acc = accessories[index];
        if (mode === 'edit' && acc.id) {
            await removeDeviceAccessory({ variables: { id: acc.id } });
        }
        setAccessories(prev => prev.filter((_, i) => i !== index));
    };

    const linkLabelSuggestions = ["EveryMac", "MacTracker", "Macintosh Garden", "Macintosh Repository", "68kMLA Thread", "Repair Guide", "Service Manual", "eBay Listing", "Wikipedia"];

    const handleAddLink = async () => {
        if (!newLinkLabel.trim() || !newLinkUrl.trim()) return;
        if (mode === 'edit' && device?.id) {
            const res = await addDeviceLink({ variables: { deviceId: device.id, label: newLinkLabel.trim(), url: newLinkUrl.trim() } });
            setLinks(prev => [...prev, { id: res.data.addDeviceLink.id, label: newLinkLabel.trim(), url: newLinkUrl.trim() }]);
        } else {
            setLinks(prev => [...prev, { label: newLinkLabel.trim(), url: newLinkUrl.trim() }]);
        }
        setNewLinkLabel("");
        setNewLinkUrl("");
    };

    const handleRemoveLink = async (index: number) => {
        const link = links[index];
        if (mode === 'edit' && link.id) {
            await removeDeviceLink({ variables: { id: link.id } });
        }
        setLinks(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl">
            <BarcodeScannerModal
                open={barcodeScannerOpen}
                title={t.form.scanSerialTitle}
                onClose={() => setBarcodeScannerOpen(false)}
                onDetected={(value) => {
                    setFormData(prev => ({
                        ...prev,
                        serialNumber: value,
                    }));

                    if (errors.serialNumber) {
                        setErrors(prev => ({ ...prev, serialNumber: "" }));
                    }
                }}
            />

            {mode === "create" && (
                <>
                    <SectionHeader>{t.form.templateSection}</SectionHeader>
                    <div className="mb-8">
                        <div className="max-w-2xl">
                            <FormField label={t.form.searchLabel}>
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={templateQuery}
                                        onChange={(e) => setTemplateQuery(e.target.value)}
                                        className={inputClass}
                                        placeholder={t.form.templateSearchPlaceholder}
                                    />

                                    {selectedTemplateId !== 0 && selectedTemplate && (
                                        <div className="flex items-center justify-between text-sm text-[var(--foreground)]">
                                            <span>
                                                {t.form.selectedPrefix}{' '}
                                                {selectedTemplate.additionalName
                                                    ? `${selectedTemplate.name} (${selectedTemplate.additionalName})`
                                                    : selectedTemplate.name}
                                            </span>
                                            <button
                                                type="button"
                                                className="text-[var(--apple-blue)] hover:underline"
                                                onClick={() => {
                                                    setSelectedTemplateId(0);
                                                    setTemplateQuery("");
                                                }}
                                            >
                                                {t.form.clearTemplate}
                                            </button>
                                        </div>
                                    )}

                                    {showTemplateResults && (
                                        <div className="border border-[var(--border)] rounded max-h-60 overflow-auto bg-[var(--card)]">
                                            {filteredTemplates.length === 0 ? (
                                                <div className="px-3 py-2 text-sm text-[var(--muted-foreground)]">{t.form.noMatchingTemplates}</div>
                                            ) : (
                                                filteredTemplates.map((tpl) => {
                                                    const title = tpl.additionalName ? `${tpl.name} (${tpl.additionalName})` : tpl.name;
                                                    const meta = [tpl.manufacturer, tpl.modelNumber, tpl.releaseYear ? String(tpl.releaseYear) : null]
                                                        .filter(Boolean)
                                                        .join(' · ');

                                                    return (
                                                        <button
                                                            key={tpl.id}
                                                            type="button"
                                                            className={`w-full text-left px-3 py-2 border-b border-[var(--border)] last:border-b-0 text-[var(--foreground)] bg-[var(--card)] hover:bg-[var(--muted)] ${
                                                                tpl.id === selectedTemplateId ? 'bg-[var(--muted)]' : ''
                                                            }`}
                                                            onClick={() => {
                                                                applyTemplate(tpl.id);
                                                                setTemplateQuery("");
                                                            }}
                                                        >
                                                            <div className="font-medium">{title}</div>
                                                            {meta && <div className="text-xs text-[var(--muted-foreground)]">{meta}</div>}
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}

                                    {!showTemplateResults && selectedTemplateId === 0 && (
                                        <div className="text-sm text-[var(--muted-foreground)]">{t.form.startTypingSearch}</div>
                                    )}
                                </div>
                            </FormField>
                        </div>
                    </div>
                </>
            )}

            <SectionHeader>{t.form.basicInformation}</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <FormField label={t.filter.category} required>
                    <select
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleChange}
                        className={`${selectClass} ${errors.categoryId ? "border-red-500" : ""}`}
                    >
                        <option value={0}>{t.form.selectCategory}</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
                </FormField>

                <FormField label={t.common.name} required>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className={`${inputClass} ${errors.name ? "border-red-500" : ""}`}
                        placeholder={t.form.namePlaceholder}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </FormField>

                <FormField label={t.form.additionalNameLabel}>
                    <input
                        type="text"
                        name="additionalName"
                        value={formData.additionalName}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder={t.form.additionalNamePlaceholder}
                    />
                </FormField>

                <FormField label={t.form.manufacturerLabel}>
                    <input
                        type="text"
                        name="manufacturer"
                        value={formData.manufacturer}
                        onChange={handleChange}
                        className={`${inputClass} ${errors.manufacturer ? "border-red-500" : ""}`}
                        placeholder={t.form.manufacturerPlaceholder}
                    />
                    {errors.manufacturer && <p className="text-red-500 text-xs mt-1">{errors.manufacturer}</p>}
                </FormField>

                <FormField label={t.form.modelNumberLabel}>
                    <input
                        type="text"
                        name="modelNumber"
                        value={formData.modelNumber}
                        onChange={handleChange}
                        className={`${inputClass} ${errors.modelNumber ? "border-red-500" : ""}`}
                        placeholder={t.form.modelNumberPlaceholder}
                    />
                    {errors.modelNumber && <p className="text-red-500 text-xs mt-1">{errors.modelNumber}</p>}
                </FormField>

                <FormField label={t.detail.serialNumber}>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="serialNumber"
                            value={formData.serialNumber}
                            onChange={handleChange}
                            className={`${inputClass} ${errors.serialNumber ? "border-red-500" : ""}`}
                        />
                        <button
                            type="button"
                            disabled={!barcodeSupported}
                            onClick={() => setBarcodeScannerOpen(true)}
                            className={`btn-retro px-3 py-2 text-sm ${
                                barcodeSupported ? "" : "opacity-50 cursor-not-allowed"
                            }`}
                        >
                            {t.form.scanBtn}
                        </button>
                    </div>
                    {errors.serialNumber && <p className="text-red-500 text-xs mt-1">{errors.serialNumber}</p>}
                </FormField>

                <FormField label={t.detail.releaseYear}>
                    <input
                        type="number"
                        name="releaseYear"
                        value={formData.releaseYear}
                        onChange={handleChange}
                        className={`${inputClass} ${errors.releaseYear ? "border-red-500" : ""}`}
                        min="1970"
                        max={new Date().getFullYear()}
                    />
                    {errors.releaseYear && <p className="text-red-500 text-xs mt-1">{errors.releaseYear}</p>}
                </FormField>

                <FormField label={t.form.locationSelect}>
                    <select
                        value={formData.locationId ?? 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, locationId: parseInt(e.target.value) || 0 }))}
                        className={selectClass}
                    >
                        <option value={0}>{t.form.locationNone}</option>
                        {(locationsData?.locations ?? []).map((loc: { id: number; name: string }) => (
                            <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        className="mt-1 text-xs text-[var(--apple-blue)] hover:underline"
                        onClick={async () => {
                            const name = prompt(t.form.locationSelect + ":");
                            if (!name?.trim()) return;
                            const result = await createLocationInline({ variables: { name: name.trim() } });
                            await refetchLocations();
                            const newId = result.data?.createLocation?.id;
                            if (newId) setFormData(prev => ({ ...prev, locationId: newId }));
                        }}
                    >
                        {t.form.locationCreateNew}
                    </button>
                </FormField>

                <FormField label={t.form.lastPowerOnLabel}>
                    <input
                        type="date"
                        name="lastPowerOnDate"
                        value={formData.lastPowerOnDate}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </FormField>
                
            </div>

            <SectionHeader>{t.form.statusCondition}</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={t.filter.status}>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={selectClass}
                    >
                        <option value="COLLECTION">{t.status.COLLECTION}</option>
                        <option value="FOR_SALE">{t.status.FOR_SALE}</option>
                        <option value="PENDING_SALE">{t.status.PENDING_SALE}</option>
                        <option value="IN_REPAIR">{t.status.IN_REPAIR}</option>
                        <option value="SOLD">{t.status.SOLD}</option>
                        <option value="DONATED">{t.status.DONATED}</option>
                        <option value="RETURNED">{t.status.RETURNED}</option>
                    </select>
                </FormField>

                <FormField label={t.filter.functionalStatus}>
                    <select
                        name="functionalStatus"
                        value={formData.functionalStatus}
                        onChange={handleChange}
                        className={selectClass}
                    >
                        <option value="YES">{t.functionalStatus.YES}</option>
                        <option value="PARTIAL">{t.functionalStatus.PARTIAL}</option>
                        <option value="NO">{t.functionalStatus.NO}</option>
                    </select>
                </FormField>

                <FormField label={t.filter.condition}>
                    <select
                        name="condition"
                        value={formData.condition}
                        onChange={handleChange}
                        className={selectClass}
                    >
                        <option value="">{t.form.notSet}</option>
                        <option value="NEW">{t.condition.NEW}</option>
                        <option value="LIKE_NEW">{t.condition.LIKE_NEW}</option>
                        <option value="VERY_GOOD">{t.condition.VERY_GOOD}</option>
                        <option value="GOOD">{t.condition.GOOD}</option>
                        <option value="ACCEPTABLE">{t.condition.ACCEPTABLE}</option>
                        <option value="FOR_PARTS">{t.condition.FOR_PARTS}</option>
                    </select>
                </FormField>

                <FormField label={t.filter.rarity}>
                    <select
                        name="rarity"
                        value={formData.rarity}
                        onChange={handleChange}
                        className={selectClass}
                    >
                        <option value="">{t.form.notSet}</option>
                        <option value="COMMON">{t.rarity.COMMON}</option>
                        <option value="UNCOMMON">{t.rarity.UNCOMMON}</option>
                        <option value="RARE">{t.rarity.RARE}</option>
                        <option value="VERY_RARE">{t.rarity.VERY_RARE}</option>
                        <option value="EXTREMELY_RARE">{t.rarity.EXTREMELY_RARE}</option>
                    </select>
                </FormField>

                <div className="md:col-span-2 flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isFavorite"
                            checked={formData.isFavorite}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--apple-blue)] focus:ring-[var(--apple-blue)]"
                        />
                        <span className="text-sm text-[var(--foreground)]">{t.form.favoriteLabel}</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isAssetTagged"
                            checked={formData.isAssetTagged}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-[var(--border)] text-[var(--apple-blue)] focus:ring-[var(--apple-blue)]"
                        />
                        <span className="text-sm text-[var(--foreground)]">{t.form.assetTaggedLabel}</span>
                    </label>
                </div>
            </div>

            <SectionHeader>{t.detail.acquisition}</SectionHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label={t.detail.dateAcquired}>
                    <input
                        type="date"
                        name="dateAcquired"
                        value={formData.dateAcquired}
                        onChange={handleChange}
                        className={inputClass}
                    />
                </FormField>

                <FormField label={t.detail.whereAcquired}>
                    <input
                        type="text"
                        name="whereAcquired"
                        value={formData.whereAcquired}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder={t.form.whereAcquiredPlaceholder}
                    />
                </FormField>

                <FormField label={t.detail.priceAcquired}>
                    <input
                        type="number"
                        name="priceAcquired"
                        value={formData.priceAcquired}
                        onChange={handleChange}
                        className={inputClass}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                    />
                </FormField>

                <FormField label={t.detail.estimatedValue}>
                    <input
                        type="number"
                        name="estimatedValue"
                        value={formData.estimatedValue}
                        onChange={handleChange}
                        className={inputClass}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                    />
                </FormField>
            </div>

            {showRepairFeeField && (
                <>
                    <SectionHeader>{t.form.repairInformation}</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label={t.form.repairFeeLabel}>
                            <input
                                type="number"
                                name="soldPrice"
                                value={formData.soldPrice}
                                onChange={handleChange}
                                className={inputClass}
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                            />
                        </FormField>
                        <FormField label={t.form.returnedDateLabel}>
                            <input
                                type="date"
                                name="soldDate"
                                value={formData.soldDate}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </FormField>
                    </div>
                </>
            )}

            {showSalesFields && (
                <>
                    <SectionHeader>{showDonatedFields ? t.form.donationInformation : t.form.salesInformation}</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {!showDonatedFields && (
                            <FormField label={t.detail.listPrice}>
                                <input
                                    type="number"
                                    name="listPrice"
                                    value={formData.listPrice}
                                    onChange={handleChange}
                                    className={inputClass}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                />
                            </FormField>
                        )}

                        {showSoldFields && (
                            <FormField label={t.detail.soldPrice}>
                                <input
                                    type="number"
                                    name="soldPrice"
                                    value={formData.soldPrice}
                                    onChange={handleChange}
                                    className={inputClass}
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                />
                            </FormField>
                        )}

                        {showDateField && (
                            <FormField label={showDonatedFields ? t.detail.donatedDate : t.detail.soldDate}>
                                <input
                                    type="date"
                                    name="soldDate"
                                    value={formData.soldDate}
                                    onChange={handleChange}
                                    className={inputClass}
                                />
                            </FormField>
                        )}
                    </div>
                </>
            )}

            {isComputerCategory && (
                <>
                    <SectionHeader>{t.detail.computerSpecs}</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="CPU">
                            <input
                                type="text"
                                name="cpu"
                                value={formData.cpu}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder={t.form.cpuPlaceholder}
                            />
                        </FormField>

                        <FormField label="RAM">
                            <input
                                type="text"
                                name="ram"
                                value={formData.ram}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder={t.form.ramPlaceholder}
                            />
                        </FormField>

                        <FormField label="Graphics">
                            <input
                                type="text"
                                name="graphics"
                                value={formData.graphics}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder={t.form.graphicsPlaceholder}
                            />
                        </FormField>

                        <FormField label="Storage">
                            <input
                                type="text"
                                name="storage"
                                value={formData.storage}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder={t.form.storagePlaceholder}
                            />
                        </FormField>

                        <FormField label="Operating System">
                            <input
                                type="text"
                                name="operatingSystem"
                                value={formData.operatingSystem}
                                onChange={handleChange}
                                className={inputClass}
                                placeholder={t.form.osPlaceholder}
                            />
                        </FormField>

                        <div className="flex flex-col gap-3 justify-center">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isWifiEnabled"
                                    checked={formData.isWifiEnabled}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--apple-blue)] focus:ring-[var(--apple-blue)]"
                                />
                                <span className="text-sm text-[var(--foreground)]">{t.detail.wifiEnabled}</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isPramBatteryRemoved"
                                    checked={formData.isPramBatteryRemoved}
                                    onChange={handleChange}
                                    className="w-4 h-4 rounded border-[var(--border)] text-[var(--apple-blue)] focus:ring-[var(--apple-blue)]"
                                />
                                <span className="text-sm text-[var(--foreground)]">{t.detail.pramBatteryRemoved}</span>
                            </label>
                        </div>
                    </div>
                </>
            )}

            {customFieldsData?.customFields?.length > 0 && (
                <>
                    <SectionHeader>{t.detail.customFields}</SectionHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {customFieldsData.customFields.map((field: any) => (
                            <FormField key={field.id} label={field.name}>
                                <input
                                    type="text"
                                    value={customFieldFormValues[field.id] || ""}
                                    onChange={(e) =>
                                        setCustomFieldFormValues(prev => ({
                                            ...prev,
                                            [field.id]: e.target.value,
                                        }))
                                    }
                                    className={inputClass}
                                />
                            </FormField>
                        ))}
                    </div>
                </>
            )}

            <SectionHeader>{t.detail.accessories}</SectionHeader>
            <div>
                <div className="flex flex-wrap gap-2 mb-3">
                    {accessories.map((acc, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)]">
                            {acc.name}
                            <button type="button" onClick={() => handleRemoveAccessory(i)} className="text-[var(--muted-foreground)] hover:text-[var(--apple-red)] ml-1">×</button>
                        </span>
                    ))}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                    {accessorySuggestions.filter(s => !accessories.some(a => a.name === s)).map(s => (
                        <button key={s} type="button" onClick={() => handleAddAccessory(s)}
                            className="px-2 py-1 text-xs rounded border border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--apple-blue)] hover:text-[var(--apple-blue)] transition-colors">
                            + {s}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newAccessoryName}
                        onChange={e => setNewAccessoryName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddAccessory(newAccessoryName); }}}
                        className={`${inputClass} flex-1`}
                        placeholder={t.form.accessoryCustomPlaceholder}
                    />
                    <button type="button" onClick={() => handleAddAccessory(newAccessoryName)}
                        className="px-3 py-2 text-sm bg-[var(--apple-blue)] text-white rounded border border-[#007acc] hover:brightness-110 whitespace-nowrap">
                        {t.common.add}
                    </button>
                </div>
            </div>

            <SectionHeader>{t.detail.referenceLinks}</SectionHeader>
            <div>
                {links.length > 0 && (
                    <div className="space-y-2 mb-3">
                        {links.map((link, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded border border-[var(--border)] bg-[var(--card)]">
                                <span className="text-xs font-medium text-[var(--foreground)] min-w-0 flex-shrink-0">{link.label}</span>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--apple-blue)] hover:underline truncate flex-1 min-w-0">{link.url}</a>
                                <button type="button" onClick={() => handleRemoveLink(i)} className="text-[var(--muted-foreground)] hover:text-[var(--apple-red)] flex-shrink-0">×</button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex flex-wrap gap-2">
                    <input
                        type="text"
                        value={newLinkLabel}
                        onChange={e => setNewLinkLabel(e.target.value)}
                        list="link-label-suggestions"
                        className={`${inputClass} flex-1`}
                        style={{ minWidth: '120px' }}
                        placeholder={t.form.linkLabelPlaceholder}
                    />
                    <datalist id="link-label-suggestions">
                        {linkLabelSuggestions.map(s => <option key={s} value={s} />)}
                    </datalist>
                    <input
                        type="url"
                        value={newLinkUrl}
                        onChange={e => setNewLinkUrl(e.target.value)}
                        className={`${inputClass} flex-1`}
                        style={{ minWidth: '120px' }}
                        placeholder={t.form.linkUrlPlaceholder}
                    />
                    <button type="button" onClick={handleAddLink}
                        className="px-3 py-2 text-sm bg-[var(--apple-blue)] text-white rounded border border-[#007acc] hover:brightness-110 whitespace-nowrap">
                        {t.common.add}
                    </button>
                </div>
            </div>

            <SectionHeader>{t.form.additionalInformation}</SectionHeader>
            <div className="grid grid-cols-1 gap-4">
                <FormField label={t.form.descriptionLabel}>
                    <textarea
                        name="info"
                        value={formData.info}
                        onChange={handleChange}
                        className={`${inputClass} min-h-[100px]`}
                        placeholder={t.form.descriptionPlaceholder}
                    />
                </FormField>
            </div>

            <div className="sticky bottom-0 z-10 flex gap-3 mt-8 pt-4 pb-4 border-t border-[var(--border)] bg-[var(--background)]">
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[var(--apple-blue)] text-white rounded border border-[#007acc] text-sm font-medium hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? t.form.saving : mode === "create" ? t.form.createDevice : t.form.saveChanges}
                </button>

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="btn-retro px-6 py-2 text-sm font-medium"
                >
                    {t.common.cancel}
                </button>
            </div>
        </form>
    );
}
