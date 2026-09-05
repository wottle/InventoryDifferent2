"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@apollo/client";
import { useSearchParams } from "next/navigation";
import gql from "graphql-tag";
import { QRCodeSVG } from "qrcode.react";
import { useT } from "../../../i18n/context";
import { useRequireAuth } from "../../../lib/useRequireAuth";
import { LoadingPanel } from "../../../components/LoadingPanel";
import { API_BASE_URL } from "../../../lib/config";
import { pickThumbnail } from "../../../lib/pickThumbnail";
import { renderCustomTemplate } from "../../../lib/renderCustomTemplate";

const GET_EXHIBITION_TEMPLATES = gql`
  query GetExhibitionTemplates {
    exhibitionTemplates {
      id name orgName logoPath layout accentColor footerText
      showQR showManufacturer showModel showSerial showYear showCategory
      showStatus showCondition showLocation showDescription showSpecs showTags showCustomFields
      showHistoricalNotes showNotes showMaintenanceHistory showStoreQR
      customHtml
    }
  }
`;

const GET_DEVICES = gql`
  query GetDevicesForExhibition {
    devices(where: { deleted: { equals: false } }) {
      id name additionalName manufacturer modelNumber serialNumber releaseYear
      info historicalNotes status condition
      category { id name type sortOrder }
      location { id name }
      cpuType cpuSpeed ram graphicsChip storageEntries { id value sortOrder } osEntries { id value sortOrder }
      images { id path thumbnailPath isThumbnail thumbnailMode mediaType }
      tags { id name }
      customFieldValues { id customFieldId customFieldName isPublic value sortOrder }
      notes { id content date }
      maintenanceTasks { id label dateCompleted notes cost }
    }
    publicConfig { shopDomain }
  }
`;

type ExhibitionTemplate = {
  id: string; name: string; orgName?: string; logoPath?: string;
  layout: string; accentColor?: string; footerText?: string;
  showQR: boolean; showManufacturer: boolean; showModel: boolean; showSerial: boolean;
  showYear: boolean; showCategory: boolean; showStatus: boolean; showCondition: boolean;
  showLocation: boolean; showDescription: boolean; showSpecs: boolean; showTags: boolean;
  showCustomFields: boolean; showHistoricalNotes: boolean; showNotes: boolean;
  showMaintenanceHistory: boolean; showStoreQR: boolean; customHtml?: string;
};

type Device = {
  id: number; name: string; additionalName?: string; manufacturer?: string;
  modelNumber?: string; serialNumber?: string; releaseYear?: number; info?: string;
  historicalNotes?: string; status?: string; condition?: string;
  category?: { id: number; name: string; type?: string; sortOrder?: number };
  location?: { id: number; name: string };
  cpuType?: string; cpuSpeed?: string; ram?: string; graphicsChip?: string;
  storageEntries?: { id: number; value: string; sortOrder: number }[];
  osEntries?: { id: number; value: string; sortOrder: number }[];
  images?: { id: number; path: string; thumbnailPath?: string; isThumbnail: boolean; thumbnailMode?: string; mediaType?: string }[];
  tags?: { id: number; name: string }[];
  customFieldValues?: { id: number; customFieldId: number; customFieldName: string; isPublic: boolean; value: string; sortOrder: number }[];
  notes?: { id: number; content: string; date: string }[];
  maintenanceTasks?: { id: number; label: string; dateCompleted?: string; notes?: string; cost?: number }[];
};

function QRCodeWrapper({ url, size = 80 }: { url: string; size?: number }) {
  return <QRCodeSVG value={url} size={size} />;
}

type ImageMode = 'thumbnail' | 'oldest' | 'newest';

function resolveImage(images: Device['images'], mode: ImageMode) {
  const imgs = images || [];
  if (mode === 'thumbnail') return pickThumbnail(imgs, false);
  const photos = imgs.filter(i => !i.mediaType || i.mediaType === 'IMAGE');
  const sorted = [...photos].sort((a, b) => a.id - b.id);
  return mode === 'oldest' ? sorted[0] : sorted[sorted.length - 1];
}

function ExhibitionSheet({ device, template, shareBaseUrl, shopDomain, imageMode = 'thumbnail' }: {
  device: Device; template: ExhibitionTemplate; shareBaseUrl: string; shopDomain?: string | null; imageMode?: ImageMode;
}) {
  const t = useT();
  const ex = t.exhibition;
  const accent = template.accentColor || '#0058bc';
  const qrUrl = `${shareBaseUrl}/devices/${device.id}`;
  const storefrontUrl = shopDomain && ['FOR_SALE', 'PENDING_SALE'].includes(device.status || '')
    ? `https://${shopDomain}/item/${device.id}`
    : null;
  const img = resolveImage(device.images, imageMode);
  const thumbUrl = img ? `${API_BASE_URL}${img.thumbnailPath || img.path}` : null;

  const specs = [
    device.cpuType && `${device.cpuType}${device.cpuSpeed ? ' ' + device.cpuSpeed : ''}`,
    device.ram,
    device.graphicsChip,
    ...(device.storageEntries || []).sort((a, b) => a.sortOrder - b.sortOrder).map(e => e.value),
    ...(device.osEntries || []).sort((a, b) => a.sortOrder - b.sortOrder).map(e => e.value),
  ].filter(Boolean) as string[];

  if (template.layout === 'CUSTOM' && template.customHtml) {
    // customHtml is only settable by authenticated admins — XSS risk is admin-only
    const rendered = renderCustomTemplate(template.customHtml, {
      id: device.id,
      name: device.name,
      additionalName: device.additionalName,
      manufacturer: device.manufacturer,
      modelNumber: device.modelNumber,
      serialNumber: device.serialNumber,
      releaseYear: device.releaseYear,
      info: device.info,
      condition: device.condition,
      status: device.status,
      category: device.category,
      location: device.location,
    });
    return (
      <div className="exhibition-sheet custom-sheet" style={{ minHeight: '200px', padding: '16px', background: '#fff' }}>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
    );
  }

  if (template.layout === 'COMPACT_LABEL') {
    return (
      <div className="exhibition-sheet compact-label-sheet" style={{
        width: '5in', height: '3in', borderTop: `4px solid ${accent}`,
        padding: '12px 16px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', fontFamily: 'sans-serif', background: '#fff',
        boxSizing: 'border-box', overflow: 'hidden', color: '#000',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '8px' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', lineHeight: 1.2 }}>{device.name}</div>
            {device.additionalName && <div style={{ fontSize: '13px', color: '#555' }}>{device.additionalName}</div>}
            {template.showYear && device.releaseYear && <div style={{ fontSize: '13px', marginTop: '4px' }}>{device.releaseYear}</div>}
            {template.showCategory && device.category && <div style={{ fontSize: '12px', color: '#666' }}>{device.category.name}</div>}
            {template.showSerial && device.serialNumber && <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#444', marginTop: '4px' }}>S/N: {device.serialNumber}</div>}
            {template.showManufacturer && device.manufacturer && <div style={{ fontSize: '12px', color: '#555' }}>{device.manufacturer}</div>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
            {template.showQR && (
              <div style={{ textAlign: 'center' }}>
                <QRCodeWrapper url={qrUrl} size={64} />
                <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{ex.moreInfo}</div>
              </div>
            )}
            {template.showStoreQR && storefrontUrl && (
              <div style={{ textAlign: 'center' }}>
                <QRCodeWrapper url={storefrontUrl} size={48} />
                <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{ex.buyIt}</div>
              </div>
            )}
          </div>
        </div>
        {template.showHistoricalNotes && device.historicalNotes && (
          <div style={{ fontSize: '10px', color: '#444', marginTop: '6px', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {device.historicalNotes}
          </div>
        )}
        {template.footerText && (
          <div style={{ fontSize: '10px', color: '#888', borderTop: `1px solid ${accent}`, paddingTop: '4px', marginTop: '4px' }}>
            {template.footerText}
          </div>
        )}
      </div>
    );
  }

  if (template.layout === 'DISPLAY_CARD') {
    return (
      <div className="exhibition-sheet display-card-sheet" style={{
        width: '7in', height: '5in', borderTop: `4px solid ${accent}`,
        display: 'flex', fontFamily: 'sans-serif', background: '#fff',
        boxSizing: 'border-box', overflow: 'hidden', color: '#000',
      }}>
        {thumbUrl && (
          <div style={{ width: '40%', background: '#111', flexShrink: 0 }}>
            <img src={thumbUrl} alt={device.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
          <div>
            {template.orgName && (
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', color: accent, marginBottom: '6px' }}>
                {template.orgName}
              </div>
            )}
            <div style={{ fontSize: '22px', fontWeight: 'bold', lineHeight: 1.2 }}>{device.name}</div>
            {device.additionalName && <div style={{ fontSize: '13px', color: '#555' }}>{device.additionalName}</div>}
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#333' }}>
              {template.showManufacturer && device.manufacturer && <div>{device.manufacturer}</div>}
              {template.showModel && device.modelNumber && <div>{device.modelNumber}</div>}
              {template.showSerial && device.serialNumber && <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>S/N: {device.serialNumber}</div>}
              {template.showYear && device.releaseYear && <div>{device.releaseYear}</div>}
              {template.showCategory && device.category && <div>{device.category.name}</div>}
              {template.showCondition && device.condition && <div>{device.condition}</div>}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              {template.footerText && <div style={{ fontSize: '10px', color: '#888' }}>{template.footerText}</div>}
              <div style={{ fontSize: '10px', color: '#aaa' }}>#{device.id}</div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
              {template.showStoreQR && storefrontUrl && (
                <div style={{ textAlign: 'center' }}>
                  <QRCodeWrapper url={storefrontUrl} size={56} />
                  <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{ex.buyIt}</div>
                </div>
              )}
              {template.showQR && (
                <div style={{ textAlign: 'center' }}>
                  <QRCodeWrapper url={qrUrl} size={64} />
                  <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>{ex.moreInfo}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // A4_FULL (default)
  return (
    <div className="exhibition-sheet a4-sheet" style={{
      width: '8.27in', minHeight: '11.69in', background: '#fff', fontFamily: 'sans-serif',
      padding: '0.5in', boxSizing: 'border-box', border: `1px solid #ddd`, color: '#000',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header — 3 columns: logo/org | store QR (centered, for-sale only) | device QR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: `3px solid ${accent}`, paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {template.logoPath && (
            <img src={`${API_BASE_URL}${template.logoPath}`} alt="Logo" style={{ height: '88px', objectFit: 'contain' }} />
          )}
          {template.orgName && <div style={{ fontSize: '16px', fontWeight: 'bold', color: accent }}>{template.orgName}</div>}
        </div>
        {template.showStoreQR && storefrontUrl ? (
          <div style={{ textAlign: 'center', flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div>
              <QRCodeWrapper url={storefrontUrl} size={72} />
              <div style={{ fontSize: '11px', color: '#555', marginTop: '4px', fontWeight: 'bold' }}>{ex.buyIt}</div>
            </div>
          </div>
        ) : <div style={{ flex: 1 }} />}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          {template.showQR && (
            <div style={{ textAlign: 'center' }}>
              <QRCodeWrapper url={qrUrl} size={72} />
              <div style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>{ex.moreInfo}</div>
            </div>
          )}
        </div>
      </div>

      {/* Device name */}
      <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: 1.2, marginBottom: '4px' }}>{device.name}</div>
      {device.additionalName && <div style={{ fontSize: '16px', color: '#555', marginBottom: '8px' }}>{device.additionalName}</div>}
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
        {[
          template.showCategory && device.category?.name,
          template.showYear && device.releaseYear,
        ].filter(Boolean).join(' · ')}
      </div>

      {/* Photo + fields row */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
        {thumbUrl && (
          <div style={{ width: '45%', flexShrink: 0 }}>
            <img src={thumbUrl} alt={device.name} style={{ width: '100%', height: '280px', objectFit: 'contain', background: '#f5f5f5', borderRadius: '4px' }} />
          </div>
        )}
        <div style={{ flex: 1, fontSize: '14px' }}>
          {template.showManufacturer && device.manufacturer && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>{ex.fieldManufacturer}</span>{device.manufacturer}</div>
          )}
          {template.showModel && device.modelNumber && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>{ex.fieldModel}</span>{device.modelNumber}</div>
          )}
          {template.showSerial && device.serialNumber && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>{ex.fieldSerial}</span><span style={{ fontFamily: 'monospace' }}>{device.serialNumber}</span></div>
          )}
          {template.showCondition && device.condition && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>{ex.fieldCondition}</span>{(t.condition as Record<string, string>)[device.condition] ?? device.condition}</div>
          )}
          {template.showStatus && device.status && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>{ex.fieldStatus}</span>{(t.status as Record<string, string>)[device.status] ?? device.status}</div>
          )}
          {template.showLocation && device.location && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>{ex.fieldLocation}</span>{device.location.name}</div>
          )}
        </div>
      </div>

      {/* Specs */}
      {template.showSpecs && specs.length > 0 && (
        <div style={{ borderTop: `1px solid #eee`, paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{ex.fieldSpecs}</div>
          <div style={{ fontSize: '13px', color: '#333', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {specs.map((s, i) => (
              <span key={i} style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: '4px' }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {template.showDescription && device.info && (
        <div style={{ borderTop: `1px solid #eee`, paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{ex.fieldDescription}</div>
          <div style={{ fontSize: '13px', color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{device.info}</div>
        </div>
      )}

      {/* Historical Notes */}
      {template.showHistoricalNotes && device.historicalNotes && (
        <div style={{ borderTop: `1px solid #eee`, paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{ex.fieldHistory}</div>
          <div style={{ fontSize: '13px', color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{device.historicalNotes}</div>
        </div>
      )}

      {/* Notes */}
      {template.showNotes && (device.notes || []).length > 0 && (
        <div style={{ borderTop: `1px solid #eee`, paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{ex.fieldNotes}</div>
          {(device.notes || []).map(note => (
            <div key={note.id} style={{ fontSize: '13px', color: '#333', marginBottom: '6px' }}>
              <span style={{ color: '#aaa', fontSize: '11px', marginRight: '6px' }}>{new Date(note.date).toLocaleDateString()}</span>
              {note.content}
            </div>
          ))}
        </div>
      )}

      {/* Maintenance History */}
      {template.showMaintenanceHistory && (device.maintenanceTasks || []).filter(t => t.dateCompleted).length > 0 && (
        <div style={{ borderTop: `1px solid #eee`, paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{ex.fieldMaintenance}</div>
          {(device.maintenanceTasks || []).filter(t => t.dateCompleted).map(task => (
            <div key={task.id} style={{ fontSize: '12px', color: '#333', marginBottom: '4px', display: 'flex', gap: '8px' }}>
              <span style={{ color: '#aaa', flexShrink: 0 }}>{new Date(task.dateCompleted!).toLocaleDateString()}</span>
              <span>{task.label}{task.notes ? ` — ${task.notes}` : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tags */}
      {template.showTags && (device.tags || []).length > 0 && (
        <div style={{ borderTop: `1px solid #eee`, paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{ex.fieldTags}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(device.tags || []).map(tag => (
              <span key={tag.id} style={{ background: accent, color: '#fff', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>{tag.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* Custom fields */}
      {template.showCustomFields && (device.customFieldValues || []).length > 0 && (
        <div style={{ borderTop: `1px solid #eee`, paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{ex.fieldCustomFields}</div>
          {(device.customFieldValues || []).map(cfv => (
            <div key={cfv.id} style={{ fontSize: '13px', color: '#333', marginBottom: '4px' }}>
              <span style={{ color: '#888' }}>{cfv.customFieldName}: </span>{cfv.value}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', color: '#aaa', borderTop: `1px solid #eee`, paddingTop: '8px', marginTop: '24px' }}>
        <div>{template.footerText}</div>
        <div>ID: {String(device.id).padStart(5, '0')}</div>
      </div>
    </div>
  );
}

export default function ExhibitionPage() {
  const t = useT();
  const searchParams = useSearchParams();
  const redirecting = useRequireAuth();

  const { data: templatesData, loading: templatesLoading } = useQuery(GET_EXHIBITION_TEMPLATES);
  const { data: devicesData, loading: devicesLoading } = useQuery(GET_DEVICES);

  const templates: ExhibitionTemplate[] = templatesData?.exhibitionTemplates || [];
  const allDevices: Device[] = devicesData?.devices || [];
  const shopDomain: string | null = devicesData?.publicConfig?.shopDomain || null;

  const preselectedDeviceId = searchParams.get('deviceId');

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<number>>(new Set());
  const [deviceImageModes, setDeviceImageModes] = useState<Map<number, ImageMode>>(new Map());
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintView, setShowPrintView] = useState(false);

  useEffect(() => {
    if (preselectedDeviceId && allDevices.length > 0) {
      setSelectedDeviceIds(new Set([Number(preselectedDeviceId)]));
    }
  }, [preselectedDeviceId, allDevices.length]);

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  // Stamp a class on <body> so @media print can hide the nav/layout shell
  useEffect(() => {
    if (showPrintView) {
      document.body.classList.add('exhibition-printing');
    } else {
      document.body.classList.remove('exhibition-printing');
    }
    return () => { document.body.classList.remove('exhibition-printing'); };
  }, [showPrintView]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const filteredDevices = useMemo(() => {
    if (!searchTerm) return allDevices;
    const lower = searchTerm.toLowerCase();
    return allDevices.filter(d =>
      d.name.toLowerCase().includes(lower) ||
      d.additionalName?.toLowerCase().includes(lower) ||
      d.manufacturer?.toLowerCase().includes(lower) ||
      d.serialNumber?.toLowerCase().includes(lower)
    );
  }, [allDevices, searchTerm]);

  const selectedDevices = allDevices.filter(d => selectedDeviceIds.has(d.id));

  const shareBaseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  function toggleDevice(id: number) {
    setSelectedDeviceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setImageMode(id: number, mode: ImageMode) {
    setDeviceImageModes(prev => new Map(prev).set(id, mode));
  }

  function selectAll() {
    setSelectedDeviceIds(new Set(filteredDevices.map(d => d.id)));
  }

  function clearAll() {
    setSelectedDeviceIds(new Set());
  }

  if (redirecting || templatesLoading || devicesLoading) {
    return <LoadingPanel title={t.exhibition.pageTitle} subtitle="" />;
  }

  if (showPrintView && selectedTemplate) {
    return (
      <div className={`exhibition-print layout-${selectedTemplate.layout}`} style={{ background: 'var(--background)' }}>
        <style jsx global>{`
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            /* White body so any gap around the absolute container is white, not gray */
            body.exhibition-printing { background: white !important; }
            /* Collapse normal-flow wrappers so they don't generate blank pages */
            body.exhibition-printing > * { visibility: hidden !important; min-height: 0 !important; height: auto !important; overflow: hidden !important; }

            /* Reveal only the exhibition print container and everything inside it */
            body.exhibition-printing .exhibition-print { visibility: visible !important; position: absolute; top: 0; left: 0; width: 100%; background: white !important; min-height: 0 !important; }
            body.exhibition-printing .exhibition-print * { visibility: visible !important; }

            /* Keep the control bar hidden even though it's inside .exhibition-print */
            body.exhibition-printing .no-print { display: none !important; }

            .exhibition-print { padding: 0 !important; background: white !important; }

            /* ── A4 Full Page ────────────────────────────────────────────────────── */
            /* Let content flow naturally — break-after:page handles pagination.
               Don't fight the page height; it varies by paper size and browser. */
            .layout-A4_FULL .sheet-wrapper {
              margin: 0 !important;
              padding: 0 !important;
            }
            .a4-sheet {
              height: auto !important;
              min-height: 0 !important;
              width: 100% !important;
              box-sizing: border-box !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
            }

            /* ── Card layouts (DISPLAY_CARD, COMPACT_LABEL) ─────────────────────── */
            /* @page margin:0 → card's inline inch dimensions (7×5, 5×3) fill the page
               exactly. DO NOT use vw/vh here — in @media print those units resolve to
               the screen viewport, not the page dimensions, causing the card to inflate
               to screen width (~125% oversize). The inline styles are the right values.
               DO NOT use margin-top on the container to shift content — the card element
               is exactly the page height (e.g. 5in card on 5in page), so any positive
               margin-top pushes it past the page boundary and break-inside:avoid demotes
               the entire card to page 2, leaving a blank first page. Instead, use
               padding on the card element itself: content shifts down within the card
               while the element stays at top:0, fitting the page perfectly. */
            body.exhibition-printing .layout-DISPLAY_CARD,
            body.exhibition-printing .layout-COMPACT_LABEL {
              margin: 0 !important;
            }
            .layout-DISPLAY_CARD .sheet-wrapper,
            .layout-COMPACT_LABEL .sheet-wrapper {
              margin: 0 !important;
              padding: 0 !important;
            }
            .display-card-sheet,
            .compact-label-sheet {
              box-shadow: none !important;
              margin: 0 !important;
              page-break-after: always !important;
              break-after: page !important;
              break-inside: avoid !important;
            }
            /* Printer calibration: shift content down/right inside the card without
               moving the card element (which would cause break-inside:avoid blank page) */
            .display-card-sheet {
              padding-top: 0.75in !important;
              padding-left: 0.25in !important;
            }
            .compact-label-sheet {
              padding-top: 0.75in !important;
              padding-left: 0.25in !important;
            }

            @page {
              size: ${selectedTemplate.layout === 'DISPLAY_CARD' ? '7in 5in' : selectedTemplate.layout === 'COMPACT_LABEL' ? '5in 3in' : 'A4 portrait'};
              margin: ${selectedTemplate.layout === 'DISPLAY_CARD' || selectedTemplate.layout === 'COMPACT_LABEL' ? '0' : '0.5in'};
            }
          }
          @media screen {
            .exhibition-print { max-width: 1100px; margin: 0 auto; padding: 24px; }
            .exhibition-sheet { box-shadow: 0 2px 12px rgba(0,0,0,0.12); margin: 0 auto; }
          }
        `}</style>

        <div className="no-print" style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', padding: '12px 16px', background: 'var(--surface-container)', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
          <button onClick={() => setShowPrintView(false)} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, border: '1px solid var(--outline-variant)', background: 'var(--card)', color: 'var(--on-surface)' }}>
            ← {t.exhibition.back}
          </button>
          <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#0058bc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            🖨 {t.exhibition.print}
          </button>
          <span style={{ fontSize: '14px', color: 'var(--on-surface-variant)' }}>
            {selectedDevices.length} {t.exhibition.deviceCount}{selectedDevices.length !== 1 ? 's' : ''}
          </span>
        </div>

        {selectedDevices.map((device) => (
          <div key={device.id} className="sheet-wrapper" style={{ marginBottom: '48px' }}>
            <ExhibitionSheet device={device} template={selectedTemplate} shareBaseUrl={shareBaseUrl} shopDomain={shopDomain} imageMode={deviceImageModes.get(device.id) ?? 'thumbnail'} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--on-surface)' }}>{t.exhibition.pageTitle}</h1>

      {/* Template selector */}
      <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid var(--outline-variant)', borderRadius: '8px', background: 'var(--surface-container)' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--on-surface)' }}>
          {t.exhibition.selectTemplate}
        </label>
        {templates.length === 0 ? (
          <div style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
            {t.exhibition.noTemplateSelected}{' '}
            <a href="/exhibition/templates" style={{ color: '#0058bc' }}>{t.exhibition.newTemplate}</a>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={selectedTemplateId}
              onChange={e => setSelectedTemplateId(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', fontSize: '14px', width: '100%', maxWidth: '360px', background: 'var(--input)', color: 'var(--foreground)' }}
            >
              {templates.map(tmpl => (
                <option key={tmpl.id} value={tmpl.id}>{tmpl.name}{tmpl.orgName ? ` — ${tmpl.orgName}` : ''}</option>
              ))}
            </select>
            <a href="/exhibition/templates" style={{ fontSize: '13px', color: '#0058bc', whiteSpace: 'nowrap', textDecoration: 'none' }}>
              + {t.exhibition.newTemplate}
            </a>
          </div>
        )}
      </div>

      {/* Device selection */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', flex: 1, color: 'var(--on-surface)' }}>{t.exhibition.selectDevices}</h2>
          <button onClick={selectAll} style={{ fontSize: '12px', color: '#0058bc', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Select All</button>
          <button onClick={clearAll} style={{ fontSize: '12px', color: 'var(--on-surface-variant)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Clear</button>
        </div>
        <input
          type="text"
          placeholder="Search devices…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--outline-variant)', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box', background: 'var(--input)', color: 'var(--foreground)' }}
        />
        <div style={{ border: '1px solid var(--outline-variant)', borderRadius: '8px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
          {filteredDevices.map((device, idx) => (
            <label key={device.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer',
              background: selectedDeviceIds.has(device.id) ? 'color-mix(in srgb, #0058bc 15%, var(--card))' : idx % 2 === 0 ? 'var(--card)' : 'var(--surface-container)',
              borderBottom: '1px solid var(--outline-variant)',
            }}>
              <input
                type="checkbox"
                checked={selectedDeviceIds.has(device.id)}
                onChange={() => toggleDevice(device.id)}
                style={{ width: '16px', height: '16px', flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--on-surface)' }}>{device.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--on-surface-variant)' }}>
                  {[device.manufacturer, device.releaseYear, device.category?.name].filter(Boolean).join(' · ')}
                  {device.serialNumber ? ` · S/N: ${device.serialNumber}` : ''}
                </div>
              </div>
              {selectedDeviceIds.has(device.id) && (device.images || []).length > 0 && (
                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }} onClick={e => e.preventDefault()}>
                  {(['thumbnail', 'oldest', 'newest'] as ImageMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setImageMode(device.id, mode)}
                      style={{
                        padding: '2px 7px', fontSize: '11px', borderRadius: '4px', border: '1px solid var(--outline-variant)',
                        background: (deviceImageModes.get(device.id) ?? 'thumbnail') === mode ? '#0058bc' : 'var(--card)',
                        color: (deviceImageModes.get(device.id) ?? 'thumbnail') === mode ? '#fff' : 'var(--on-surface-variant)',
                        cursor: 'pointer',
                      }}
                    >
                      {mode === 'thumbnail' ? t.exhibition.imageThumb : mode === 'oldest' ? t.exhibition.imageOldest : t.exhibition.imageNewest}
                    </button>
                  ))}
                </div>
              )}
            </label>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--on-surface-variant)', marginTop: '8px' }}>
          {selectedDeviceIds.size} {t.exhibition.deviceCount}{selectedDeviceIds.size !== 1 ? 's' : ''} selected
        </div>
      </div>

      {/* Print button */}
      <button
        onClick={() => setShowPrintView(true)}
        disabled={!selectedTemplateId || selectedDeviceIds.size === 0}
        style={{
          padding: '10px 24px', background: (!selectedTemplateId || selectedDeviceIds.size === 0) ? 'var(--surface-container)' : '#0058bc',
          color: (!selectedTemplateId || selectedDeviceIds.size === 0) ? 'var(--on-surface-variant)' : '#fff',
          border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold',
          cursor: (!selectedTemplateId || selectedDeviceIds.size === 0) ? 'default' : 'pointer',
        }}
      >
        {t.exhibition.previewPrint}
      </button>
      {!selectedTemplateId && <div style={{ fontSize: '13px', color: '#c00', marginTop: '8px' }}>{t.exhibition.noTemplateSelected}</div>}
      {selectedTemplateId && selectedDeviceIds.size === 0 && <div style={{ fontSize: '13px', color: '#c00', marginTop: '8px' }}>{t.exhibition.noDevicesSelected}</div>}
    </div>
  );
}
