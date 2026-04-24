"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { LoadingPanel } from "../../../components/LoadingPanel";
import { useT } from "../../../i18n/context";

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
      externalUrl
      externalLinkLabel
      cpu
      ram
      storage
      graphics
      rarity
      historicalNotes
      categoryId
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
  }
`;

const CREATE_TEMPLATE = gql`
  mutation CreateTemplate($input: TemplateCreateInput!) {
    createTemplate(input: $input) {
      id
      name
      additionalName
      manufacturer
      modelNumber
      releaseYear
      estimatedValue
      externalUrl
      externalLinkLabel
      cpu
      ram
      storage
      graphics
      rarity
      historicalNotes
      categoryId
      category {
        id
        name
        type
      }
    }
  }
`;

const UPDATE_TEMPLATE = gql`
  mutation UpdateTemplate($input: TemplateUpdateInput!) {
    updateTemplate(input: $input) {
      id
      name
      additionalName
      manufacturer
      modelNumber
      releaseYear
      estimatedValue
      externalUrl
      externalLinkLabel
      cpu
      ram
      storage
      graphics
      rarity
      historicalNotes
      categoryId
      category {
        id
        name
        type
      }
    }
  }
`;

const DELETE_TEMPLATE = gql`
  mutation DeleteTemplate($id: Int!) {
    deleteTemplate(id: $id)
  }
`;

type Category = {
  id: number;
  name: string;
  type: string;
};

// RARITY_OPTIONS is now built inside the component using t (see below)

type Template = {
  id: number;
  name: string;
  additionalName?: string | null;
  manufacturer?: string | null;
  modelNumber?: string | null;
  releaseYear?: number | null;
  estimatedValue?: number | null;
  externalUrl?: string | null;
  externalLinkLabel?: string | null;
  cpu?: string | null;
  ram?: string | null;
  storage?: string | null;
  graphics?: string | null;
  rarity?: string | null;
  historicalNotes?: string | null;
  categoryId: number;
  category?: Category;
};

type TemplateFormState = {
  name: string;
  additionalName: string;
  manufacturer: string;
  modelNumber: string;
  releaseYear: string;
  estimatedValue: string;
  externalUrl: string;
  externalLinkLabel: string;
  cpu: string;
  ram: string;
  storage: string;
  graphics: string;
  rarity: string;
  historicalNotes: string;
  categoryId: number;
};

const emptyFormState: TemplateFormState = {
  name: "",
  additionalName: "",
  manufacturer: "",
  modelNumber: "",
  releaseYear: String(new Date().getFullYear()),
  estimatedValue: "",
  externalUrl: "",
  externalLinkLabel: "",
  cpu: "",
  ram: "",
  storage: "",
  graphics: "",
  rarity: "",
  historicalNotes: "",
  categoryId: 0,
};

export default function TemplatesPage() {
  const t = useT();
  const { data, loading, error, refetch } = useQuery(GET_TEMPLATES, {
    fetchPolicy: "cache-and-network",
  });

  const [createTemplate, { loading: creating }] = useMutation(CREATE_TEMPLATE);
  const [updateTemplate, { loading: updating }] = useMutation(UPDATE_TEMPLATE);
  const [deleteTemplate, { loading: deleting }] = useMutation(DELETE_TEMPLATE);

  const templates: Template[] = useMemo(() => data?.templates ?? [], [data?.templates]);
  const categories: Category[] = useMemo(() => data?.categories ?? [], [data?.categories]);

  const categoryTypeById = useMemo(() => {
    return new Map<number, string>(categories.map((c) => [c.id, c.type]));
  }, [categories]);

  const RARITY_OPTIONS = useMemo(() => [
    { value: "", label: t.pages.templates.rarityNotSet },
    { value: "COMMON", label: t.rarity.COMMON },
    { value: "UNCOMMON", label: t.rarity.UNCOMMON },
    { value: "RARE", label: t.rarity.RARE },
    { value: "VERY_RARE", label: t.rarity.VERY_RARE },
    { value: "EXTREMELY_RARE", label: t.rarity.EXTREMELY_RARE },
  ], [t]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeTemplateId, setActiveTemplateId] = useState<number | null>(null);
  const [form, setForm] = useState<TemplateFormState>(emptyFormState);

  const selectedType = categoryTypeById.get(form.categoryId) ?? "";
  const isComputer = selectedType === "COMPUTER";

  const openCreateModal = () => {
    setModalMode("create");
    setActiveTemplateId(null);
    setForm(emptyFormState);
    setModalOpen(true);
  };

  const openEditModal = (tpl: Template) => {
    setModalMode("edit");
    setActiveTemplateId(tpl.id);
    setForm({
      name: tpl.name ?? "",
      additionalName: tpl.additionalName ?? "",
      manufacturer: tpl.manufacturer ?? "",
      modelNumber: tpl.modelNumber ?? "",
      releaseYear: tpl.releaseYear != null ? String(tpl.releaseYear) : "",
      estimatedValue: tpl.estimatedValue != null ? String(tpl.estimatedValue) : "",
      externalUrl: tpl.externalUrl ?? "",
      externalLinkLabel: tpl.externalLinkLabel ?? "",
      cpu: tpl.cpu ?? "",
      ram: tpl.ram ?? "",
      storage: tpl.storage ?? "",
      graphics: tpl.graphics ?? "",
      rarity: tpl.rarity ?? "",
      historicalNotes: tpl.historicalNotes ?? "",
      categoryId: tpl.categoryId ?? 0,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleModalSave = async () => {
    const name = form.name.trim();
    if (!name) return;
    if (!form.categoryId) return;

    const releaseYear = form.releaseYear.trim() ? Number.parseInt(form.releaseYear, 10) : null;
    const estimatedValue = form.estimatedValue.trim() ? Number.parseFloat(form.estimatedValue) : null;

    const input: any = {
      name,
      categoryId: form.categoryId,
      additionalName: form.additionalName.trim() || null,
      manufacturer: form.manufacturer.trim() || null,
      modelNumber: form.modelNumber.trim() || null,
      releaseYear: Number.isFinite(releaseYear as any) ? releaseYear : null,
      estimatedValue: Number.isFinite(estimatedValue as any) ? estimatedValue : null,
      externalUrl: form.externalUrl.trim() || null,
      externalLinkLabel: form.externalLinkLabel.trim() || null,
      rarity: form.rarity || null,
      historicalNotes: form.historicalNotes.trim() || null,
    };

    if (isComputer) {
      input.cpu = form.cpu.trim() || null;
      input.ram = form.ram.trim() || null;
      input.storage = form.storage.trim() || null;
      input.graphics = form.graphics.trim() || null;
    } else {
      input.cpu = null;
      input.ram = null;
      input.storage = null;
      input.graphics = null;
    }

    if (modalMode === "create") {
      await createTemplate({
        variables: {
          input,
        },
      });
    } else {
      if (activeTemplateId == null) return;
      await updateTemplate({
        variables: {
          input: {
            id: activeTemplateId,
            ...input,
          },
        },
      });
    }

    closeModal();
    await refetch();
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t.pages.templates.deleteConfirm)) return;
    await deleteTemplate({ variables: { id } });
    if (activeTemplateId === id) closeModal();
    await refetch();
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{t.pages.templates.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{t.pages.templates.subtitle}</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded bg-[var(--apple-blue)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 border border-[#007acc]"
          >
            {t.pages.templates.newTemplate}
          </button>
        </div>
      </header>

      {loading && (
        <div className="p-4">
          <LoadingPanel title={t.pages.templates.loading} subtitle={t.pages.templates.loadingSubtitle} />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {!loading && !error && (
        <section className="overflow-hidden rounded border border-[var(--border)] card-retro">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-[var(--foreground)]">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{t.common.name}</th>
                <th className="px-4 py-2 text-left font-medium">{t.pages.templates.additional}</th>
                <th className="px-4 py-2 text-left font-medium">{t.form.manufacturerLabel}</th>
                <th className="px-4 py-2 text-left font-medium">{t.pages.templates.model}</th>
                <th className="px-4 py-2 text-left font-medium">{t.pages.templates.year}</th>
                <th className="px-4 py-2 text-left font-medium">{t.detail.estimatedValue}</th>
                <th className="px-4 py-2 text-left font-medium">{t.filter.category}</th>
                <th className="px-4 py-2 text-right font-medium">{t.pages.templates.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-[var(--card)]">
              {templates.map((tpl) => {
                return (
                  <tr
                    key={tpl.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--muted)] cursor-pointer"
                    onClick={() => openEditModal(tpl)}
                  >
                    <td className="px-4 py-2">{tpl.name}</td>
                    <td className="px-4 py-2">{tpl.additionalName ?? ""}</td>
                    <td className="px-4 py-2">{tpl.manufacturer ?? ""}</td>
                    <td className="px-4 py-2">{tpl.modelNumber ?? ""}</td>
                    <td className="px-4 py-2 tabular-nums">{tpl.releaseYear ?? ""}</td>
                    <td className="px-4 py-2 tabular-nums">{tpl.estimatedValue ?? ""}</td>
                    <td className="px-4 py-2">{tpl.category?.name ?? ""}</td>
                    <td className="px-4 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(tpl)}
                          className="btn-retro px-3 py-1 text-sm"
                        >
                          {t.common.edit}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tpl.id)}
                          className="rounded border border-[var(--apple-red)] bg-[var(--card)] px-3 py-1 text-sm text-[var(--apple-red)] hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          {t.common.delete}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative z-10 w-full max-w-3xl rounded border border-[var(--border)] bg-[var(--card)] shadow-xl card-retro">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold text-[var(--foreground)]">
                {modalMode === "create" ? t.pages.templates.newTemplateTitle : t.pages.templates.editTemplateTitle}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="btn-retro px-2 py-1 text-sm"
              >
                {t.pages.templates.closeBtn}
              </button>
            </div>

            <div className="px-4 py-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.filter.category}</label>
                  <select
                    value={form.categoryId}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        categoryId: parseInt(e.target.value || "0", 10),
                      }))
                    }
                    className="select-flat w-full px-4 py-2 text-sm text-[var(--foreground)]"
                  >
                    <option value={0}>{t.pages.templates.selectCategory}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.common.name}</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.form.additionalNameLabel}</label>
                  <input
                    value={form.additionalName}
                    onChange={(e) => setForm((prev) => ({ ...prev, additionalName: e.target.value }))}
                    className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.form.manufacturerLabel}</label>
                  <input
                    value={form.manufacturer}
                    onChange={(e) => setForm((prev) => ({ ...prev, manufacturer: e.target.value }))}
                    className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.form.modelNumberLabel}</label>
                  <input
                    value={form.modelNumber}
                    onChange={(e) => setForm((prev) => ({ ...prev, modelNumber: e.target.value }))}
                    className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.detail.releaseYear}</label>
                  <input
                    type="number"
                    value={form.releaseYear}
                    onChange={(e) => setForm((prev) => ({ ...prev, releaseYear: e.target.value }))}
                    className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.detail.estimatedValue}</label>
                  <input
                    type="number"
                    value={form.estimatedValue}
                    onChange={(e) => setForm((prev) => ({ ...prev, estimatedValue: e.target.value }))}
                    className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.pages.templates.linkLabel}</label>
                  <input
                    value={form.externalLinkLabel}
                    onChange={(e) => setForm((prev) => ({ ...prev, externalLinkLabel: e.target.value }))}
                    placeholder={t.pages.templates.linkLabelPlaceholder}
                    className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.form.externalUrlLabel}</label>
                  <input
                    value={form.externalUrl}
                    onChange={(e) => setForm((prev) => ({ ...prev, externalUrl: e.target.value }))}
                    className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                  />
                  {form.externalUrl.trim() && (
                    <div className="mt-1 text-xs">
                      <a
                        href={form.externalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[var(--apple-blue)] hover:underline"
                      >
                        {t.pages.templates.openLink}
                      </a>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.filter.rarity}</label>
                  <select
                    value={form.rarity}
                    onChange={(e) => setForm((prev) => ({ ...prev, rarity: e.target.value }))}
                    className="select-flat w-full px-4 py-2 text-sm text-[var(--foreground)]"
                  >
                    {RARITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {isComputer && (
                <div className="mt-4">
                  <div className="mb-2 text-xs font-semibold text-[var(--foreground)]">{t.pages.templates.computerSpecs}</div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.detail.cpu}</label>
                      <input
                        value={form.cpu}
                        onChange={(e) => setForm((prev) => ({ ...prev, cpu: e.target.value }))}
                        className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.detail.ram}</label>
                      <input
                        value={form.ram}
                        onChange={(e) => setForm((prev) => ({ ...prev, ram: e.target.value }))}
                        className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.detail.storage}</label>
                      <input
                        value={form.storage}
                        onChange={(e) => setForm((prev) => ({ ...prev, storage: e.target.value }))}
                        className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">{t.detail.graphics}</label>
                      <input
                        value={form.graphics}
                        onChange={(e) => setForm((prev) => ({ ...prev, graphics: e.target.value }))}
                        className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[var(--muted-foreground)] mb-1">Historical Notes</label>
                <textarea
                  value={form.historicalNotes}
                  onChange={(e) => setForm((prev) => ({ ...prev, historicalNotes: e.target.value }))}
                  rows={4}
                  placeholder="Historical context and significance of this device model…"
                  className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)] resize-y"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3">
              <div className="text-xs text-[var(--muted-foreground)]">{modalMode === "edit" ? `ID: ${activeTemplateId}` : ""}</div>
              <div className="flex gap-2">
                {modalMode === "edit" && activeTemplateId != null && (
                  <button
                    type="button"
                    onClick={() => handleDelete(activeTemplateId)}
                    disabled={deleting}
                    className="rounded bg-[var(--apple-red)] px-3 py-1.5 text-sm text-white hover:brightness-110 disabled:opacity-50 border border-[#c02020]"
                  >
                    {t.common.delete}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-retro px-3 py-1.5 text-sm"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="button"
                  onClick={handleModalSave}
                  disabled={creating || updating}
                  className="rounded bg-[var(--apple-blue)] px-3 py-1.5 text-sm text-white hover:brightness-110 disabled:opacity-50 border border-[#007acc]"
                >
                  {t.common.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
