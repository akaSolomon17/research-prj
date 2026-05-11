import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/features/Auth/auth-context";
import { createCustomer, deleteCustomer, fetchCustomers, updateCustomer } from "@/features/Customers/api";
import type { Customer } from "@/shared/types/models";

type ModalMode = "create" | "edit";

const initialForm = {
  name: "",
  email: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  source: "",
  birthDate: "",
};

export const CustomersPage = () => {
  const { session, profile } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isAdmin = profile?.role === "admin";

  const loadCustomers = useCallback(async () => {
    if (!session || !isAdmin) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const payload = await fetchCustomers(session.accessToken, {
        page,
        limit: 10,
        search,
      });
      setCustomers(payload.items);
      setTotalPages(payload.pagination.totalPages);
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "Failed to load customers";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, search, session]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const resetModalState = () => {
    setIsModalOpen(false);
    setMode("create");
    setForm(initialForm);
    setEditingId(null);
    setIsDirty(false);
    setIsSubmitting(false);
    setFormError(null);
  };

  const openCreateModal = () => {
    setMode("create");
    setEditingId(null);
    setForm(initialForm);
    setIsDirty(false);
    setFormError(null);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const openEditModal = (customer: Customer) => {
    setMode("edit");
    setEditingId(customer.id);
    setForm({
      name: customer.name ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
      city: customer.city ?? "",
      state: customer.state ?? "",
      zip: customer.zip ?? "",
      source: customer.source ?? "",
      birthDate: customer.birth_date ?? "",
    });
    setIsDirty(false);
    setFormError(null);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) {
      return;
    }
    if (isDirty && !window.confirm("You have unsaved changes. Close this popup?")) {
      return;
    }
    resetModalState();
  };

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return "Name is required.";
    }
    if (!form.email.trim()) {
      return "Email is required.";
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session || !isAdmin) {
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      address: form.address.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      zip: form.zip.trim() || undefined,
      source: form.source.trim() || undefined,
      birthDate: form.birthDate.trim() || undefined,
    };

    try {
      if (mode === "edit" && editingId) {
        await updateCustomer(session.accessToken, editingId, payload);
      } else {
        await createCustomer(session.accessToken, payload);
      }
      await loadCustomers();
      resetModalState();
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "Failed to save customer";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!session || !isAdmin) {
      return;
    }
    if (!window.confirm("Delete this customer?")) {
      return;
    }
    setLoadError(null);
    try {
      await deleteCustomer(session.accessToken, id);
      await loadCustomers();
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "Failed to delete customer";
      setLoadError(message);
    }
  };

  const statusLabel = useMemo(() => (isAdmin ? "Admin customer CRUD" : "Read only"), [isAdmin]);

  if (!isAdmin) {
    return (
      <section className="panel-strong p-6">
        <h1 className="font-heading text-3xl font-bold text-slate-900">Customers</h1>
        <p className="mt-2 text-sm text-slate-500">Only admin can manage fake customer data for order creation.</p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="chip">Customer data</span>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Customers</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Create fake customer records and reuse them when creating orders.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Loaded</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{customers.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Pages</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{totalPages}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Mode</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{statusLabel}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Search</p>
            <p className="mt-1 truncate text-lg font-semibold text-slate-900">{search || "All"}</p>
          </div>
        </div>
      </header>

      <div className="panel-strong p-5 md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-slate-900">Customer table</h2>
            <p className="mt-1 text-sm text-slate-500">Use these rows as fake buyers for orders.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="field-soft sm:w-80"
              placeholder="Search name, email, city"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <button className="btn-primary" type="button" onClick={openCreateModal}>
              Create customer
            </button>
          </div>
        </div>

        {loadError ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{loadError}</p>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="px-4 py-3 font-semibold text-slate-600">City</th>
                <th className="px-4 py-3 font-semibold text-slate-600">State</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Created</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-5 text-slate-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={6}>
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="transition hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium text-slate-700">{customer.name ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{customer.email ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{customer.city ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">{customer.state ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(customer.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="btn-secondary px-3 py-1.5 text-xs" type="button" onClick={() => openEditModal(customer)}>
                          Edit
                        </button>
                        <button
                          className="rounded-xl border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          type="button"
                          onClick={() => void onDelete(customer.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button className="btn-secondary" disabled={page <= 1} type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} / {totalPages}
          </span>
          <button
            className="btn-secondary"
            disabled={page >= totalPages}
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm">
          <div className="panel-strong w-full max-w-3xl p-6 shadow-2xl" role="dialog" aria-modal="true">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <span className="chip">{mode === "edit" ? "Edit" : "Create"}</span>
                <h2 className="mt-2 font-heading text-xl font-semibold text-slate-900">
                  {mode === "edit" ? "Update customer" : "Create customer"}
                </h2>
              </div>
              <button className="btn-secondary px-3 py-1.5" type="button" onClick={closeModal}>
                Close
              </button>
            </div>

            <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="customer-name">
                  Name
                </label>
                <input
                  id="customer-name"
                  className="field-soft"
                  value={form.name}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, name: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="customer-email">
                  Email
                </label>
                <input
                  id="customer-email"
                  className="field-soft"
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, email: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="customer-address">
                  Address
                </label>
                <input
                  id="customer-address"
                  className="field-soft"
                  value={form.address}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, address: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="customer-city">
                  City
                </label>
                <input
                  id="customer-city"
                  className="field-soft"
                  value={form.city}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, city: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="customer-state">
                  State
                </label>
                <input
                  id="customer-state"
                  className="field-soft"
                  value={form.state}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, state: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="customer-zip">
                  ZIP
                </label>
                <input
                  id="customer-zip"
                  className="field-soft"
                  value={form.zip}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, zip: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="customer-source">
                  Source
                </label>
                <input
                  id="customer-source"
                  className="field-soft"
                  value={form.source}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, source: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="customer-birthDate">
                  Birth date
                </label>
                <input
                  id="customer-birthDate"
                  className="field-soft"
                  type="date"
                  value={form.birthDate}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, birthDate: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>
              {formError ? (
                <p className="sm:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {formError}
                </p>
              ) : null}

              <div className="sm:col-span-2 flex gap-3 pt-1">
                <button className="btn-primary" disabled={isSubmitting} type="submit">
                  {isSubmitting ? "Saving..." : mode === "edit" ? "Update customer" : "Create customer"}
                </button>
                <button className="btn-secondary" type="button" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
};
