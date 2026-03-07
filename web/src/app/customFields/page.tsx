"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { LoadingPanel } from "../../components/LoadingPanel";

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

const CREATE_CUSTOM_FIELD = gql`
  mutation CreateCustomField($input: CustomFieldCreateInput!) {
    createCustomField(input: $input) {
      id
      name
      isPublic
      sortOrder
    }
  }
`;

const UPDATE_CUSTOM_FIELD = gql`
  mutation UpdateCustomField($input: CustomFieldUpdateInput!) {
    updateCustomField(input: $input) {
      id
      name
      isPublic
      sortOrder
    }
  }
`;

const DELETE_CUSTOM_FIELD = gql`
  mutation DeleteCustomField($id: Int!) {
    deleteCustomField(id: $id)
  }
`;

type CustomField = {
  id: number;
  name: string;
  isPublic: boolean;
  sortOrder: number;
};

export default function CustomFieldsPage() {
  const { data, loading, error, refetch } = useQuery(GET_CUSTOM_FIELDS, {
    fetchPolicy: "cache-and-network",
  });

  const [createCustomField, { loading: creating }] = useMutation(CREATE_CUSTOM_FIELD);
  const [updateCustomField, { loading: updating }] = useMutation(UPDATE_CUSTOM_FIELD);
  const [deleteCustomField, { loading: deleting }] = useMutation(DELETE_CUSTOM_FIELD);

  const customFields: CustomField[] = useMemo(() => data?.customFields ?? [], [data?.customFields]);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [newSortOrder, setNewSortOrder] = useState<number>(0);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editSortOrder, setEditSortOrder] = useState<number>(0);

  // Delete confirmation state
  const [deleteField, setDeleteField] = useState<CustomField | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const startEdit = (field: CustomField) => {
    setEditingId(field.id);
    setEditName(field.name);
    setEditIsPublic(field.isPublic);
    setEditSortOrder(field.sortOrder);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditIsPublic(false);
    setEditSortOrder(0);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;

    await createCustomField({
      variables: {
        input: {
          name,
          isPublic: newIsPublic,
          sortOrder: Number.isFinite(newSortOrder) ? newSortOrder : 0,
        },
      },
    });

    setNewName("");
    setNewIsPublic(false);
    setNewSortOrder(0);
    await refetch();
  };

  const handleSave = async () => {
    if (editingId == null) return;
    const name = editName.trim();
    if (!name) return;

    await updateCustomField({
      variables: {
        input: {
          id: editingId,
          name,
          isPublic: editIsPublic,
          sortOrder: Number.isFinite(editSortOrder) ? editSortOrder : 0,
        },
      },
    });

    cancelEdit();
    await refetch();
  };

  const handleDelete = async () => {
    if (!deleteField) return;

    await deleteCustomField({
      variables: { id: deleteField.id },
    });

    setDeleteField(null);
    setDeleteConfirmText("");
    await refetch();
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">Manage Custom Fields</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Define custom attributes that can be set on any device.</p>
        </div>
        <Link href="/" className="btn-retro text-sm px-3 py-1.5">
          Back
        </Link>
      </header>

      <section className="mb-6 rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">Add Custom Field</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <input
            type="number"
            value={newSortOrder}
            onChange={(e) => setNewSortOrder(parseInt(e.target.value || "0", 10))}
            placeholder="Sort"
            className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Field name"
            className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)] sm:col-span-2"
          />
          <label className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] cursor-pointer">
            <input
              type="checkbox"
              checked={newIsPublic}
              onChange={(e) => setNewIsPublic(e.target.checked)}
              className="accent-[var(--apple-blue)]"
            />
            Public
          </label>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="inline-flex items-center justify-center rounded bg-[var(--apple-blue)] px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-50 border border-[#007acc]"
          >
            Add
          </button>
        </div>
      </section>

      {loading && (
        <div className="p-4">
          <LoadingPanel title="Loading custom fields..." subtitle="Fetching field definitions" />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {!loading && !error && (
        <section className="overflow-hidden rounded border border-[var(--border)] card-retro">
          {customFields.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
              No custom fields defined yet. Add one above.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[var(--muted)] text-[var(--foreground)]">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Sort</th>
                  <th className="px-4 py-2 text-left font-medium">Name</th>
                  <th className="px-4 py-2 text-left font-medium">Visibility</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-[var(--card)]">
                {customFields.map((field) => {
                  const isEditing = editingId === field.id;
                  return (
                    <tr key={field.id} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editSortOrder}
                            onChange={(e) => setEditSortOrder(parseInt(e.target.value || "0", 10))}
                            className="input-retro w-24 px-2 py-1 text-[var(--foreground)]"
                          />
                        ) : (
                          <span className="tabular-nums">{field.sortOrder}</span>
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
                          field.name
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editIsPublic}
                              onChange={(e) => setEditIsPublic(e.target.checked)}
                              className="accent-[var(--apple-blue)]"
                            />
                            Public
                          </label>
                        ) : (
                          <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                            field.isPublic
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                          }`}>
                            {field.isPublic ? "Public" : "Private"}
                          </span>
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
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSave}
                              disabled={updating}
                              className="rounded bg-[var(--apple-blue)] px-3 py-1 text-sm text-white hover:brightness-110 disabled:opacity-50 border border-[#007acc]"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(field)}
                              className="btn-retro px-3 py-1 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => { setDeleteField(field); setDeleteConfirmText(""); }}
                              className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 border border-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      )}

      {/* Delete confirmation modal */}
      {deleteField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl card-retro">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">Delete Custom Field</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              This will permanently delete the field <strong>&quot;{deleteField.name}&quot;</strong> and remove its value from all devices. This action cannot be undone.
            </p>
            <p className="text-sm text-[var(--foreground)] mb-2">
              Type <strong>{deleteField.name}</strong> to confirm:
            </p>
            <input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder={deleteField.name}
              className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)] mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setDeleteField(null); setDeleteConfirmText(""); }}
                className="btn-retro px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteConfirmText !== deleteField.name || deleting}
                className="rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50 border border-red-700"
              >
                Delete Field
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
