"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { LoadingPanel } from "../../../../components/LoadingPanel";
import { useT } from "../../../../i18n/context";
import { useRequireAuth } from "../../../../lib/useRequireAuth";
import { API_BASE_URL } from "../../../../lib/config";

const TEMPLATE_FRAGMENT = gql`
  fragment ExhibitionTemplateFields on ExhibitionTemplate {
    id name orgName logoPath layout accentColor footerText
    showQR showManufacturer showModel showSerial showYear showCategory
    showStatus showCondition showLocation showDescription showSpecs showTags showCustomFields
    showHistoricalNotes showNotes showMaintenanceHistory showStoreQR
    customHtml createdAt
  }
`;

const GET_TEMPLATES = gql`
  query GetExhibitionTemplates {
    exhibitionTemplates {
      ...ExhibitionTemplateFields
    }
  }
  ${TEMPLATE_FRAGMENT}
`;

const CREATE_TEMPLATE = gql`
  mutation CreateExhibitionTemplate($input: ExhibitionTemplateInput!) {
    createExhibitionTemplate(input: $input) {
      ...ExhibitionTemplateFields
    }
  }
  ${TEMPLATE_FRAGMENT}
`;

const UPDATE_TEMPLATE = gql`
  mutation UpdateExhibitionTemplate($id: ID!, $input: ExhibitionTemplateUpdateInput!) {
    updateExhibitionTemplate(id: $id, input: $input) {
      ...ExhibitionTemplateFields
    }
  }
  ${TEMPLATE_FRAGMENT}
`;

const DELETE_TEMPLATE = gql`
  mutation DeleteExhibitionTemplate($id: ID!) {
    deleteExhibitionTemplate(id: $id)
  }
`;

type ExhibitionTemplate = {
  id: string; name: string; orgName?: string; logoPath?: string;
  layout: string; accentColor?: string; footerText?: string;
  showQR: boolean; showManufacturer: boolean; showModel: boolean; showSerial: boolean;
  showYear: boolean; showCategory: boolean; showStatus: boolean; showCondition: boolean;
  showLocation: boolean; showDescription: boolean; showSpecs: boolean; showTags: boolean;
  showCustomFields: boolean; showHistoricalNotes: boolean; showNotes: boolean;
  showMaintenanceHistory: boolean; showStoreQR: boolean; customHtml?: string; createdAt: string;
};

type FormState = {
  name: string; orgName: string; logoPath: string; layout: string;
  accentColor: string; footerText: string;
  showQR: boolean; showManufacturer: boolean; showModel: boolean; showSerial: boolean;
  showYear: boolean; showCategory: boolean; showStatus: boolean; showCondition: boolean;
  showLocation: boolean; showDescription: boolean; showSpecs: boolean; showTags: boolean;
  showCustomFields: boolean; showHistoricalNotes: boolean; showNotes: boolean;
  showMaintenanceHistory: boolean; showStoreQR: boolean; customHtml: string;
};

const DEFAULT_FORM: FormState = {
  name: '', orgName: '', logoPath: '', layout: 'A4_FULL', accentColor: '#0058bc', footerText: '',
  showQR: true, showManufacturer: true, showModel: true, showSerial: true,
  showYear: true, showCategory: true, showStatus: false, showCondition: true,
  showLocation: false, showDescription: true, showSpecs: true, showTags: false,
  showCustomFields: false, showHistoricalNotes: false, showNotes: false,
  showMaintenanceHistory: false, showStoreQR: false, customHtml: '',
};

const LAYOUTS = ['A4_FULL', 'DISPLAY_CARD', 'COMPACT_LABEL', 'CUSTOM'] as const;

const BOOL_FIELDS: { key: keyof FormState; labelKey: keyof ReturnType<typeof useT>['exhibition'] }[] = [
  { key: 'showQR', labelKey: 'showQR' },
  { key: 'showManufacturer', labelKey: 'showManufacturer' },
  { key: 'showModel', labelKey: 'showModel' },
  { key: 'showSerial', labelKey: 'showSerial' },
  { key: 'showYear', labelKey: 'showYear' },
  { key: 'showCategory', labelKey: 'showCategory' },
  { key: 'showStatus', labelKey: 'showStatus' },
  { key: 'showCondition', labelKey: 'showCondition' },
  { key: 'showLocation', labelKey: 'showLocation' },
  { key: 'showDescription', labelKey: 'showDescription' },
  { key: 'showSpecs', labelKey: 'showSpecs' },
  { key: 'showTags', labelKey: 'showTags' },
  { key: 'showCustomFields', labelKey: 'showCustomFields' },
  { key: 'showHistoricalNotes', labelKey: 'showHistoricalNotes' },
  { key: 'showNotes', labelKey: 'showNotes' },
  { key: 'showMaintenanceHistory', labelKey: 'showMaintenanceHistory' },
  { key: 'showStoreQR', labelKey: 'showStoreQR' },
];

function formFromTemplate(t: ExhibitionTemplate): FormState {
  return {
    name: t.name, orgName: t.orgName || '', logoPath: t.logoPath || '',
    layout: t.layout, accentColor: t.accentColor || '#0058bc', footerText: t.footerText || '',
    showQR: t.showQR, showManufacturer: t.showManufacturer, showModel: t.showModel,
    showSerial: t.showSerial, showYear: t.showYear, showCategory: t.showCategory,
    showStatus: t.showStatus, showCondition: t.showCondition, showLocation: t.showLocation,
    showDescription: t.showDescription, showSpecs: t.showSpecs, showTags: t.showTags,
    showCustomFields: t.showCustomFields, showHistoricalNotes: t.showHistoricalNotes,
    showNotes: t.showNotes, showMaintenanceHistory: t.showMaintenanceHistory,
    showStoreQR: t.showStoreQR, customHtml: t.customHtml || '',
  };
}

export default function ExhibitionTemplatesPage() {
  const t = useT();
  const ex = t.exhibition;
  const redirecting = useRequireAuth();

  const { data, loading } = useQuery(GET_TEMPLATES);
  const [createTemplate] = useMutation(CREATE_TEMPLATE, { refetchQueries: [{ query: GET_TEMPLATES }] });
  const [updateTemplate] = useMutation(UPDATE_TEMPLATE, { refetchQueries: [{ query: GET_TEMPLATES }] });
  const [deleteTemplate] = useMutation(DELETE_TEMPLATE, { refetchQueries: [{ query: GET_TEMPLATES }] });

  const templates: ExhibitionTemplate[] = data?.exhibitionTemplates || [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function openCreate() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setIsCreating(true);
  }

  function openEdit(tmpl: ExhibitionTemplate) {
    setForm(formFromTemplate(tmpl));
    setEditingId(tmpl.id);
    setIsCreating(true);
  }

  function cancelEdit() {
    setIsCreating(false);
    setEditingId(null);
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function uploadLogo(file: File) {
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API_BASE_URL}/upload/exhibition-logo`, {
        method: 'POST',
        credentials: 'include',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: fd,
      });
      const json = await res.json();
      if (json.path) setField('logoPath', json.path);
    } finally {
      setLogoUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const input: Record<string, unknown> = {
        name: form.name, orgName: form.orgName || null, logoPath: form.logoPath || null,
        layout: form.layout, accentColor: form.accentColor || null, footerText: form.footerText || null,
        customHtml: form.layout === 'CUSTOM' ? (form.customHtml || null) : null,
        showQR: form.showQR, showManufacturer: form.showManufacturer, showModel: form.showModel,
        showSerial: form.showSerial, showYear: form.showYear, showCategory: form.showCategory,
        showStatus: form.showStatus, showCondition: form.showCondition, showLocation: form.showLocation,
        showDescription: form.showDescription, showSpecs: form.showSpecs, showTags: form.showTags,
        showCustomFields: form.showCustomFields,
        showHistoricalNotes: form.showHistoricalNotes, showNotes: form.showNotes,
        showMaintenanceHistory: form.showMaintenanceHistory, showStoreQR: form.showStoreQR,
      };
      if (editingId) {
        await updateTemplate({ variables: { id: editingId, input } });
      } else {
        await createTemplate({ variables: { input } });
      }
      cancelEdit();
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(id: string) {
    await deleteTemplate({ variables: { id } });
    setConfirmDeleteId(null);
  }

  const layoutLabel = (layout: string) => {
    switch (layout) {
      case 'A4_FULL': return ex.layoutA4Full;
      case 'DISPLAY_CARD': return ex.layoutDisplayCard;
      case 'COMPACT_LABEL': return ex.layoutCompactLabel;
      case 'CUSTOM': return ex.layoutCustom;
      default: return layout;
    }
  };

  if (redirecting || loading) return <LoadingPanel title={ex.templatesPageTitle} subtitle="" />;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc',
    fontSize: '14px', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: '#555' };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>{ex.templatesPageTitle}</h1>
        <button onClick={openCreate} style={{ padding: '8px 16px', background: '#0058bc', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          + {ex.newTemplate}
        </button>
      </div>

      {/* Create / Edit form */}
      {isCreating && (
        <div style={{ border: '1px solid #0058bc', borderRadius: '8px', padding: '20px', marginBottom: '24px', background: '#f8faff' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 'bold', marginBottom: '16px' }}>
            {editingId ? ex.editTemplate : ex.newTemplate}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>{ex.templateName} *</label>
              <input style={inputStyle} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="e.g. RetroMac Show 2026" />
            </div>
            <div>
              <label style={labelStyle}>{ex.orgName}</label>
              <input style={inputStyle} value={form.orgName} onChange={e => setField('orgName', e.target.value)} placeholder={ex.orgNamePlaceholder} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>{ex.layout}</label>
              <select style={inputStyle} value={form.layout} onChange={e => setField('layout', e.target.value)}>
                {LAYOUTS.map(l => <option key={l} value={l}>{layoutLabel(l)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{ex.accentColor}</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input type="color" value={form.accentColor} onChange={e => setField('accentColor', e.target.value)} style={{ width: '40px', height: '36px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', padding: '2px' }} />
                <input style={{ ...inputStyle, flex: 1 }} value={form.accentColor} onChange={e => setField('accentColor', e.target.value)} placeholder="#0058bc" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{ex.logo}</label>
              {form.logoPath ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <img src={`${API_BASE_URL}${form.logoPath}`} alt="Logo" style={{ height: '36px', objectFit: 'contain' }} />
                  <button onClick={() => setField('logoPath', '')} style={{ fontSize: '12px', color: '#c00', background: 'none', border: 'none', cursor: 'pointer' }}>{ex.removeLogo}</button>
                </div>
              ) : (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadLogo(e.target.files[0]); }} />
                  <span style={{ padding: '6px 12px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '13px', background: '#fff' }}>
                    {logoUploading ? '…' : ex.uploadLogo}
                  </span>
                </label>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{ex.footerText}</label>
            <input style={inputStyle} value={form.footerText} onChange={e => setField('footerText', e.target.value)} placeholder={ex.footerTextPlaceholder} />
          </div>

          {/* Custom HTML */}
          {form.layout === 'CUSTOM' && (
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>{ex.customHtmlLabel}</label>
              <textarea
                style={{ ...inputStyle, height: '160px', fontFamily: 'monospace', fontSize: '12px', resize: 'vertical' }}
                value={form.customHtml}
                onChange={e => setField('customHtml', e.target.value)}
                placeholder="<h1>{{device.name}}</h1><p>{{device.info}}</p>{{qr}}"
              />
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{ex.customHtmlHint}</div>
            </div>
          )}

          {/* Field toggles */}
          {form.layout !== 'CUSTOM' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#555' }}>{ex.fieldsSection}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px' }}>
                {BOOL_FIELDS.map(({ key, labelKey }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={e => setField(key, e.target.checked as FormState[typeof key])}
                    />
                    {ex[labelKey]}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={save} disabled={saving || !form.name} style={{ padding: '8px 20px', background: !form.name ? '#ccc' : '#0058bc', color: '#fff', border: 'none', borderRadius: '6px', cursor: !form.name ? 'default' : 'pointer', fontWeight: 'bold' }}>
              {saving ? '…' : ex.save}
            </button>
            <button onClick={cancelEdit} style={{ padding: '8px 16px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer' }}>
              {ex.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 && !isCreating ? (
        <div style={{ color: '#888', fontSize: '14px', padding: '24px', textAlign: 'center', border: '1px dashed #ddd', borderRadius: '8px' }}>
          {ex.noTemplates}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {templates.map(tmpl => (
            <div key={tmpl.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {tmpl.logoPath && <img src={`${API_BASE_URL}${tmpl.logoPath}`} alt="" style={{ height: '32px', objectFit: 'contain' }} />}
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{tmpl.name}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>
                    {layoutLabel(tmpl.layout)}{tmpl.orgName ? ` · ${tmpl.orgName}` : ''}
                  </div>
                </div>
                <span style={{ padding: '2px 10px', background: tmpl.accentColor || '#0058bc', color: '#fff', borderRadius: '12px', fontSize: '11px' }}>
                  {layoutLabel(tmpl.layout)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a href="/exhibition" style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '6px', textDecoration: 'none', color: '#333' }}>
                  Use
                </a>
                <button onClick={() => openEdit(tmpl)} style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #ccc', borderRadius: '6px', cursor: 'pointer', background: '#fff' }}>
                  {ex.editTemplate}
                </button>
                {confirmDeleteId === tmpl.id ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#c00' }}>{ex.confirmDelete}</span>
                    <button onClick={() => confirmDelete(tmpl.id)} style={{ padding: '4px 10px', background: '#c00', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Yes</button>
                    <button onClick={() => setConfirmDeleteId(null)} style={{ padding: '4px 10px', background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(tmpl.id)} style={{ padding: '6px 12px', fontSize: '13px', border: '1px solid #fcc', borderRadius: '6px', cursor: 'pointer', background: '#fff', color: '#c00' }}>
                    {ex.delete}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
