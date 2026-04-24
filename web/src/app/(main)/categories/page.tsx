"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import { LoadingPanel } from "../../../components/LoadingPanel";
import { useT } from "../../../i18n/context";

const GET_CATEGORIES = gql`
  query GetCategories {
    categories {
      id
      name
      type
      sortOrder
    }
  }
`;

const CREATE_CATEGORY = gql`
  mutation CreateCategory($name: String!, $type: String!, $sortOrder: Int) {
    createCategory(name: $name, type: $type, sortOrder: $sortOrder) {
      id
      name
      type
      sortOrder
    }
  }
`;

const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: Int!, $name: String, $type: String, $sortOrder: Int) {
    updateCategory(id: $id, name: $name, type: $type, sortOrder: $sortOrder) {
      id
      name
      type
      sortOrder
    }
  }
`;

const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: Int!) {
    deleteCategory(id: $id) {
      id
    }
  }
`;

type Category = {
  id: number;
  name: string;
  type: string;
  sortOrder: number;
};

const CATEGORY_TYPES = ["COMPUTER", "PERIPHERAL", "ACCESSORY", "OTHER"] as const;

export default function CategoriesPage() {
  const t = useT();
  const { data, loading, error, refetch } = useQuery(GET_CATEGORIES, {
    fetchPolicy: "cache-and-network",
  });

  const [createCategory, { loading: creating }] = useMutation(CREATE_CATEGORY);
  const [updateCategory, { loading: updating }] = useMutation(UPDATE_CATEGORY);
  const [deleteCategory] = useMutation(DELETE_CATEGORY);

  const categories: Category[] = useMemo(() => data?.categories ?? [], [data?.categories]);

  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<(typeof CATEGORY_TYPES)[number]>("COMPUTER");
  const [newSortOrder, setNewSortOrder] = useState<number>(0);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState<(typeof CATEGORY_TYPES)[number]>("COMPUTER");
  const [editSortOrder, setEditSortOrder] = useState<number>(0);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditType((CATEGORY_TYPES as readonly string[]).includes(cat.type) ? (cat.type as any) : "OTHER");
    setEditSortOrder(cat.sortOrder ?? 0);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditType("COMPUTER");
    setEditSortOrder(0);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;

    await createCategory({
      variables: {
        name,
        type: newType,
        sortOrder: Number.isFinite(newSortOrder) ? newSortOrder : 0,
      },
    });

    setNewName("");
    setNewType("COMPUTER");
    setNewSortOrder(0);
    await refetch();
  };

  const handleSave = async () => {
    if (editingId == null) return;
    const name = editName.trim();
    if (!name) return;

    await updateCategory({
      variables: {
        id: editingId,
        name,
        type: editType,
        sortOrder: Number.isFinite(editSortOrder) ? editSortOrder : 0,
      },
    });

    cancelEdit();
    await refetch();
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`${t.pages.categories.deleteConfirm} "${cat.name}"?`)) return;
    try {
      await deleteCategory({ variables: { id: cat.id } });
      await refetch();
    } catch (err: any) {
      const msg = err?.graphQLErrors?.[0]?.message ?? err?.message ?? "Delete failed.";
      if (msg.includes("assigned to this category") || msg.includes("device")) {
        alert(t.pages.categories.deleteInUse);
      } else {
        alert(msg);
      }
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)] mb-6">{t.pages.categories.title}</h1>

      <section className="mb-6 rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.pages.categories.addSection}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input
            type="number"
            value={newSortOrder}
            onChange={(e) => setNewSortOrder(parseInt(e.target.value || "0", 10))}
            className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t.common.name}
            className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as any)}
            className="select-flat w-full px-4 py-2 text-sm text-[var(--foreground)]"
          >
            {CATEGORY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center justify-center rounded bg-[var(--apple-blue)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 border border-[#007acc]"
          >
            {t.common.add}
          </button>
        </div>
      </section>

      {loading && (
        <div className="p-4">
          <LoadingPanel title={t.pages.categories.loading} subtitle={t.pages.categories.loadingSubtitle} />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {!loading && !error && (
        <section className="overflow-hidden rounded border border-[var(--border)] card-retro">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-[var(--foreground)]">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{t.pages.categories.sort}</th>
                <th className="px-4 py-2 text-left font-medium">{t.common.name}</th>
                <th className="px-4 py-2 text-left font-medium">{t.common.type}</th>
                <th className="px-4 py-2 text-right font-medium">{t.pages.categories.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-[var(--card)]">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;
                return (
                  <tr key={cat.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editSortOrder}
                          onChange={(e) => setEditSortOrder(parseInt(e.target.value || "0", 10))}
                          className="input-retro w-24 px-2 py-1 text-[var(--foreground)]"
                        />
                      ) : (
                        <span className="tabular-nums">{cat.sortOrder}</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-retro w-full px-2 py-1 text-[var(--foreground)]"
                        />
                      ) : (
                        cat.name
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as any)}
                          className="select-flat w-full px-4 py-1 text-[var(--foreground)]"
                        >
                          {CATEGORY_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      ) : (
                        cat.type
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={updating}
                            className="btn-retro px-3 py-1 text-sm disabled:opacity-50"
                          >
                            {t.common.cancel}
                          </button>
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={updating}
                            className="rounded bg-[var(--apple-blue)] px-3 py-1 text-sm text-white hover:brightness-110 disabled:opacity-50 border border-[#007acc]"
                          >
                            {t.common.save}
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(cat)}
                            className="btn-retro px-3 py-1 text-sm"
                          >
                            {t.common.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cat)}
                            className="btn-retro px-3 py-1 text-sm text-[var(--apple-red)]"
                          >
                            {t.common.delete}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
