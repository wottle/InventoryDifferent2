"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import { LoadingPanel } from "../../components/LoadingPanel";
import { useT } from "../../i18n/context";

const GET_LOCATIONS = gql`
  query GetLocations {
    locations {
      id
      name
      description
      deviceCount
    }
  }
`;

const CREATE_LOCATION = gql`
  mutation CreateLocation($name: String!, $description: String) {
    createLocation(name: $name, description: $description) {
      id
      name
      description
      deviceCount
    }
  }
`;

const UPDATE_LOCATION = gql`
  mutation UpdateLocation($id: Int!, $name: String, $description: String) {
    updateLocation(id: $id, name: $name, description: $description) {
      id
      name
      description
      deviceCount
    }
  }
`;

const DELETE_LOCATION = gql`
  mutation DeleteLocation($id: Int!) {
    deleteLocation(id: $id) {
      id
    }
  }
`;

type Location = {
  id: number;
  name: string;
  description: string | null;
  deviceCount: number;
};

export default function LocationsPage() {
  const t = useT();
  const { data, loading, error, refetch } = useQuery(GET_LOCATIONS, {
    fetchPolicy: "cache-and-network",
  });

  const [createLocation, { loading: creating }] = useMutation(CREATE_LOCATION);
  const [updateLocation, { loading: updating }] = useMutation(UPDATE_LOCATION);
  const [deleteLocation] = useMutation(DELETE_LOCATION);

  const locations: Location[] = useMemo(() => data?.locations ?? [], [data?.locations]);

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const startEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditName(loc.name);
    setEditDescription(loc.description ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;

    await createLocation({
      variables: {
        name,
        description: newDescription.trim() || undefined,
      },
    });

    setNewName("");
    setNewDescription("");
    await refetch();
  };

  const handleSave = async () => {
    if (editingId == null) return;
    const name = editName.trim();
    if (!name) return;

    await updateLocation({
      variables: {
        id: editingId,
        name,
        description: editDescription.trim() || undefined,
      },
    });

    cancelEdit();
    await refetch();
  };

  const handleDelete = async (loc: Location) => {
    const msg =
      loc.deviceCount > 0
        ? `${t.pages.locations.deleteConfirm} "${loc.name}"? ${t.pages.locations.deleteInUse}`
        : `${t.pages.locations.deleteConfirm} "${loc.name}"?`;
    if (!confirm(msg)) return;
    try {
      await deleteLocation({ variables: { id: loc.id } });
      await refetch();
    } catch (err: any) {
      const errMsg = err?.graphQLErrors?.[0]?.message ?? err?.message ?? "Delete failed.";
      alert(errMsg);
    }
  };

  return (
    <div className="min-h-screen font-sans">
      <header className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-light tracking-tight text-[var(--foreground)]">{t.pages.locations.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{t.pages.locations.subtitle}</p>
        </div>
        <Link href="/" className="btn-retro text-sm px-3 py-1.5">
          {t.common.back}
        </Link>
      </header>

      <section className="mb-6 rounded border border-[var(--border)] bg-[var(--card)] p-4 card-retro">
        <h2 className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.pages.locations.addSection}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t.common.name}
            className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
          />
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder={t.pages.locations.description}
            className="input-retro w-full px-3 py-2 text-sm text-[var(--foreground)]"
          />
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
          <LoadingPanel title={t.pages.locations.loading} subtitle={t.pages.locations.loadingSubtitle} />
        </div>
      )}
      {error && <div className="p-4 text-red-500">Error: {error.message}</div>}

      {!loading && !error && (
        <section className="overflow-hidden rounded border border-[var(--border)] card-retro">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-[var(--foreground)]">
              <tr>
                <th className="px-4 py-2 text-left font-medium">{t.common.name}</th>
                <th className="px-4 py-2 text-left font-medium hidden sm:table-cell">{t.pages.locations.description}</th>
                <th className="px-4 py-2 text-center font-medium">{t.pages.locations.deviceCount}</th>
                <th className="px-4 py-2 text-center font-medium">{t.pages.locations.qrCode}</th>
                <th className="px-4 py-2 text-right font-medium">{t.pages.locations.actions}</th>
              </tr>
            </thead>
            <tbody className="bg-[var(--card)]">
              {locations.map((loc) => {
                const isEditing = editingId === loc.id;
                return (
                  <tr key={loc.id} className="border-t border-[var(--border)]">
                    <td className="px-4 py-2">
                      {isEditing ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-retro w-full px-2 py-1 text-[var(--foreground)]"
                        />
                      ) : (
                        <Link href={`/locations/${loc.id}`} className="text-[var(--apple-blue)] hover:underline">
                          {loc.name}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-2 hidden sm:table-cell text-[var(--muted-foreground)]">
                      {isEditing ? (
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder={t.pages.locations.description}
                          className="input-retro w-full px-2 py-1 text-[var(--foreground)]"
                        />
                      ) : (
                        loc.description ?? ""
                      )}
                    </td>
                    <td className="px-4 py-2 text-center tabular-nums">{loc.deviceCount}</td>
                    <td className="px-4 py-2 text-center">
                      <Link
                        href={`/locations/${loc.id}`}
                        className="text-xs text-[var(--apple-blue)] hover:underline"
                      >
                        {t.pages.locations.qrCode}
                      </Link>
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
                            onClick={() => startEdit(loc)}
                            className="btn-retro px-3 py-1 text-sm"
                          >
                            {t.common.edit}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(loc)}
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
