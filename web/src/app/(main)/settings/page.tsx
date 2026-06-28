'use client';

import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';
import { API_BASE_URL } from '../../../lib/config';
import { useAuth } from '../../../lib/auth-context';
import { useT } from '../../../i18n/context';

const SET_SYSTEM_SETTING = gql`
  mutation SetSystemSetting($key: String!, $value: String!) {
    setSystemSetting(key: $key, value: $value)
  }
`;

const MODELS = ['gpt-image-1.5', 'gpt-image-2'] as const;
type ImageModel = (typeof MODELS)[number];

export default function SettingsPage() {
  const t = useT();
  const ts = t.pages.settings;
  const { isAuthenticated, isLoading: authLoading, getAccessToken, authRequired, externalTemplatesEnabled } = useAuth();
  const [setSystemSetting] = useMutation(SET_SYSTEM_SETTING);

  const [openaiEnabled, setOpenaiEnabled] = useState<boolean | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imageModel, setImageModel] = useState<ImageModel>('gpt-image-1.5');
  const [promptSaved, setPromptSaved] = useState(false);
  const [modelSaved, setModelSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guestAccess, setGuestAccess] = useState(true);
  const [guestAccessSaved, setGuestAccessSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/generate-image/config`)
      .then(r => r.json())
      .then(d => {
        setOpenaiEnabled(!!d.enabled);
        if (d.defaultPrompt) setPrompt(d.defaultPrompt);
        if (d.imageModel && MODELS.includes(d.imageModel as ImageModel)) {
          setImageModel(d.imageModel as ImageModel);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/auth/status`)
      .then(r => r.json())
      .then(d => {
        setGuestAccess(d.guestAccessEnabled ?? true);
      })
      .catch(() => {});
  }, []);

  const savePrompt = async () => {
    await setSystemSetting({ variables: { key: 'imagePrompt', value: prompt } });
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  };

  const saveModel = async (model: ImageModel) => {
    setImageModel(model);
    await setSystemSetting({ variables: { key: 'imageModel', value: model } });
    setModelSaved(true);
    setTimeout(() => setModelSaved(false), 2000);
  };

  const saveGuestAccess = async (enabled: boolean) => {
    setGuestAccess(enabled);
    setIsSaving(true);
    try {
      await setSystemSetting({
        variables: { key: 'guestAccessEnabled', value: enabled ? 'true' : 'false' },
      });
      setGuestAccessSaved(true);
      setTimeout(() => setGuestAccessSaved(false), 2000);
    } catch {
      setGuestAccess(!enabled);
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="text-on-surface-variant text-sm animate-pulse">{t.pages.generateImages.loading}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
      <h1 className="text-2xl font-bold text-on-surface tracking-tight">{ts.pageTitle}</h1>

      {/* AI Image Generation */}
      <section className="space-y-6">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/30 pb-2">
          {ts.aiImages}
        </h2>

        {openaiEnabled === false && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
            {ts.notConfigured}
          </div>
        )}

        {/* Prompt */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-on-surface">
            {ts.imagePromptLabel}
          </label>
          <p className="text-xs text-on-surface-variant">{ts.imagePromptHint}</p>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:bg-[#1e2129] dark:border-[#3a3f4b] resize-none"
          />
          <div className="flex justify-end">
            <button
              onClick={savePrompt}
              disabled={!isAuthenticated}
              className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all"
            >
              {promptSaved ? ts.saved : ts.save}
            </button>
          </div>
        </div>

        {/* Model */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold text-on-surface">{ts.imageModelLabel}</label>
            <p className="text-xs text-on-surface-variant mt-1">{ts.imageModelHint}</p>
          </div>
          <div className="space-y-2">
            {MODELS.map(model => (
              <label key={model} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="imageModel"
                  value={model}
                  checked={imageModel === model}
                  onChange={() => saveModel(model)}
                  disabled={!isAuthenticated}
                  className="mt-0.5 accent-primary"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-on-surface font-mono">{model}</span>
                  {model === 'gpt-image-2' && (
                    <p className="text-xs text-on-surface-variant mt-1">{ts.gptImage2Warning}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
          {modelSaved && (
            <p className="text-xs text-primary font-medium">{ts.saved}</p>
          )}
        </div>
      </section>

      {/* External Templates */}
      <section className="space-y-4">
        <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/30 pb-2">
          {ts.externalTemplates}
        </h2>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-on-surface">{ts.externalTemplatesLabel}</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{ts.externalTemplatesDescription}</p>
            <p className="text-xs mt-1 font-medium" style={{ color: externalTemplatesEnabled ? 'var(--color-primary, #2563eb)' : 'var(--color-on-surface-variant, #6b7280)' }}>
              {externalTemplatesEnabled ? ts.externalTemplatesEnabled : ts.externalTemplatesDisabled}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">{ts.externalTemplatesServerNote}</p>
          </div>
          <div className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent ${externalTemplatesEnabled ? 'bg-primary' : 'bg-outline-variant'}`}>
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${externalTemplatesEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </div>
        </div>
      </section>

      {authRequired && (
        <section className="space-y-6">
          <h2 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/30 pb-2">
            {ts.accessControl}
          </h2>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-on-surface">{ts.guestAccessLabel}</p>
                <p className="text-xs text-on-surface-variant mt-1">{ts.guestAccessDescription}</p>
              </div>
              <button
                role="switch"
                aria-checked={guestAccess}
                onClick={() => saveGuestAccess(!guestAccess)}
                disabled={!isAuthenticated || isSaving}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40 ${
                  guestAccess ? 'bg-primary' : 'bg-outline-variant'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    guestAccess ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-on-surface-variant">
              {guestAccess ? ts.guestAccessEnabled : ts.guestAccessDisabled}
            </p>
            {guestAccessSaved && (
              <p className="text-xs text-primary font-medium">{ts.saved}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
