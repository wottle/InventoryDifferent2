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
      customHtml
    }
  }
`;

const GET_DEVICES = gql`
  query GetDevicesForExhibition {
    devices(where: { deleted: { equals: false } }) {
      id name additionalName manufacturer modelNumber serialNumber releaseYear
      info status condition
      category { id name type sortOrder }
      location { id name }
      cpuType cpuSpeed ram graphicsChip storageEntries { id value sortOrder } osEntries { id value sortOrder }
      images { id path thumbnailPath isThumbnail thumbnailMode }
      tags { id name }
      customFieldValues { id customFieldId customFieldName isPublic value sortOrder }
    }
  }
`;

type ExhibitionTemplate = {
  id: string; name: string; orgName?: string; logoPath?: string;
  layout: string; accentColor?: string; footerText?: string;
  showQR: boolean; showManufacturer: boolean; showModel: boolean; showSerial: boolean;
  showYear: boolean; showCategory: boolean; showStatus: boolean; showCondition: boolean;
  showLocation: boolean; showDescription: boolean; showSpecs: boolean; showTags: boolean;
  showCustomFields: boolean; customHtml?: string;
};

type Device = {
  id: number; name: string; additionalName?: string; manufacturer?: string;
  modelNumber?: string; serialNumber?: string; releaseYear?: number; info?: string;
  status?: string; condition?: string;
  category?: { id: number; name: string; type?: string; sortOrder?: number };
  location?: { id: number; name: string };
  cpuType?: string; cpuSpeed?: string; ram?: string; graphicsChip?: string;
  storageEntries?: { id: number; value: string; sortOrder: number }[];
  osEntries?: { id: number; value: string; sortOrder: number }[];
  images?: { id: number; path: string; thumbnailPath?: string; isThumbnail: boolean; thumbnailMode?: string }[];
  tags?: { id: number; name: string }[];
  customFieldValues?: { id: number; customFieldId: number; customFieldName: string; isPublic: boolean; value: string; sortOrder: number }[];
};

function QRCodeWrapper({ url, size = 80 }: { url: string; size?: number }) {
  return <QRCodeSVG value={url} size={size} />;
}

function ExhibitionSheet({ device, template, shareBaseUrl }: { device: Device; template: ExhibitionTemplate; shareBaseUrl: string }) {
  const accent = template.accentColor || '#0058bc';
  const qrUrl = `${shareBaseUrl}/devices/${device.id}`;
  const thumb = pickThumbnail(device.images || [], false);
  const thumbUrl = thumb ? `${API_BASE_URL}${thumb.thumbnailPath || thumb.path}` : null;

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
      <div className="exhibition-sheet custom-sheet" style={{ minHeight: '200px', padding: '16px' }}>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: rendered }} />
      </div>
    );
  }

  if (template.layout === 'COMPACT_LABEL') {
    return (
      <div className="exhibition-sheet" style={{
        width: '5in', height: '3in', border: `2px solid ${accent}`,
        padding: '12px 16px', display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', fontFamily: 'sans-serif', background: '#fff',
        boxSizing: 'border-box', overflow: 'hidden',
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
          {template.showQR && <QRCodeWrapper url={qrUrl} size={72} />}
        </div>
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
      <div className="exhibition-sheet" style={{
        width: '7in', height: '5in', border: `3px solid ${accent}`,
        display: 'flex', fontFamily: 'sans-serif', background: '#fff',
        boxSizing: 'border-box', overflow: 'hidden',
      }}>
        {thumbUrl && (
          <div style={{ width: '40%', background: '#111', flexShrink: 0, position: 'relative' }}>
            <img src={thumbUrl} alt={device.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}
        <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
          <div>
            {(template.orgName) && (
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
            {template.showQR && <QRCodeWrapper url={qrUrl} size={72} />}
          </div>
        </div>
      </div>
    );
  }

  // A4_FULL (default)
  return (
    <div className="exhibition-sheet a4-sheet" style={{
      width: '8.27in', minHeight: '11.69in', background: '#fff', fontFamily: 'sans-serif',
      padding: '0.5in', boxSizing: 'border-box', border: `1px solid #ddd`, position: 'relative',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `3px solid ${accent}`, paddingBottom: '12px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {template.logoPath && (
            <img src={`${API_BASE_URL}${template.logoPath}`} alt="Logo" style={{ height: '48px', objectFit: 'contain' }} />
          )}
          {template.orgName && <div style={{ fontSize: '16px', fontWeight: 'bold', color: accent }}>{template.orgName}</div>}
        </div>
        {template.showQR && <QRCodeWrapper url={qrUrl} size={72} />}
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
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>Manufacturer</span>{device.manufacturer}</div>
          )}
          {template.showModel && device.modelNumber && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>Model</span>{device.modelNumber}</div>
          )}
          {template.showSerial && device.serialNumber && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>Serial</span><span style={{ fontFamily: 'monospace' }}>{device.serialNumber}</span></div>
          )}
          {template.showCondition && device.condition && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>Condition</span>{device.condition}</div>
          )}
          {template.showStatus && device.status && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>Status</span>{device.status}</div>
          )}
          {template.showLocation && device.location && (
            <div style={{ marginBottom: '6px' }}><span style={{ color: '#888', fontSize: '11px', display: 'block' }}>Location</span>{device.location.name}</div>
          )}
        </div>
      </div>

      {/* Specs */}
      {template.showSpecs && specs.length > 0 && (
        <div style={{ borderTop: `1px solid #eee`, paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Specifications</div>
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
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Description</div>
          <div style={{ fontSize: '13px', color: '#333', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{device.info}</div>
        </div>
      )}

      {/* Tags */}
      {template.showTags && (device.tags || []).length > 0 && (
        <div style={{ borderTop: `1px solid #eee`, paddingTop: '12px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Tags</div>
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
          <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Additional Info</div>
          {(device.customFieldValues || []).map(cfv => (
            <div key={cfv.id} style={{ fontSize: '13px', color: '#333', marginBottom: '4px' }}>
              <span style={{ color: '#888' }}>{cfv.customFieldName}: </span>{cfv.value}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: '0.4in', left: '0.5in', right: '0.5in', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '11px', color: '#aaa', borderTop: `1px solid #eee`, paddingTop: '8px' }}>
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

  const preselectedDeviceId = searchParams.get('deviceId');

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<number>>(new Set());
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
      <div className="exhibition-print bg-white text-black min-h-screen">
        <style jsx global>{`
          @media print {
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
            @page { margin: 0; size: auto; }
          }
          @media screen {
            .exhibition-print { max-width: 960px; margin: 0 auto; padding: 24px; }
          }
        `}</style>

        <div className="no-print" style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
          <button onClick={() => setShowPrintView(false)} style={{ padding: '8px 16px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', background: '#f5f5f5' }}>
            ← {t.exhibition.back}
          </button>
          <button onClick={() => window.print()} style={{ padding: '8px 20px', background: '#0058bc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            🖨 {t.exhibition.print}
          </button>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {selectedDevices.length} {t.exhibition.deviceCount}{selectedDevices.length !== 1 ? 's' : ''}
          </span>
        </div>

        {selectedDevices.map((device, idx) => (
          <div key={device.id} className={idx < selectedDevices.length - 1 ? 'page-break' : ''} style={{ marginBottom: '32px' }}>
            <ExhibitionSheet device={device} template={selectedTemplate} shareBaseUrl={shareBaseUrl} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>{t.exhibition.pageTitle}</h1>

      {/* Template selector */}
      <div style={{ marginBottom: '24px', padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>
          {t.exhibition.selectTemplate}
        </label>
        {templates.length === 0 ? (
          <div style={{ color: '#888', fontSize: '14px' }}>
            {t.exhibition.noTemplateSelected}{' '}
            <a href="/exhibition/templates" style={{ color: '#0058bc' }}>{t.exhibition.newTemplate}</a>
          </div>
        ) : (
          <select
            value={selectedTemplateId}
            onChange={e => setSelectedTemplateId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', width: '100%', maxWidth: '400px' }}
          >
            {templates.map(tmpl => (
              <option key={tmpl.id} value={tmpl.id}>{tmpl.name}{tmpl.orgName ? ` — ${tmpl.orgName}` : ''}</option>
            ))}
          </select>
        )}
      </div>

      {/* Device selection */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', flex: 1 }}>{t.exhibition.selectDevices}</h2>
          <button onClick={selectAll} style={{ fontSize: '12px', color: '#0058bc', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Select All</button>
          <button onClick={clearAll} style={{ fontSize: '12px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>Clear</button>
        </div>
        <input
          type="text"
          placeholder="Search devices…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box' }}
        />
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', maxHeight: '400px', overflowY: 'auto' }}>
          {filteredDevices.map((device, idx) => (
            <label key={device.id} style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', cursor: 'pointer',
              background: selectedDeviceIds.has(device.id) ? '#f0f6ff' : idx % 2 === 0 ? '#fff' : '#fafafa',
              borderBottom: '1px solid #f0f0f0',
            }}>
              <input
                type="checkbox"
                checked={selectedDeviceIds.has(device.id)}
                onChange={() => toggleDevice(device.id)}
                style={{ width: '16px', height: '16px', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{device.name}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {[device.manufacturer, device.releaseYear, device.category?.name].filter(Boolean).join(' · ')}
                  {device.serialNumber ? ` · S/N: ${device.serialNumber}` : ''}
                </div>
              </div>
            </label>
          ))}
        </div>
        <div style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
          {selectedDeviceIds.size} {t.exhibition.deviceCount}{selectedDeviceIds.size !== 1 ? 's' : ''} selected
        </div>
      </div>

      {/* Print button */}
      <button
        onClick={() => setShowPrintView(true)}
        disabled={!selectedTemplateId || selectedDeviceIds.size === 0}
        style={{
          padding: '10px 24px', background: (!selectedTemplateId || selectedDeviceIds.size === 0) ? '#ccc' : '#0058bc',
          color: '#fff', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold',
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
