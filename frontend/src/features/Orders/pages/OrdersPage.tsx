import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/features/Auth/auth-context";
import { createOrder, deleteOrder, fetchOrders, updateOrder } from "@/features/Orders/api";
import { formatMoney, getStatusColor, ORDER_STATUSES, toReadableStatus } from "@/features/Orders/utils";
import type { Order, OrderStatus } from "@/shared/types/models";

type StatusFilter = "all" | OrderStatus;
type ModalMode = "create" | "edit";

const initialForm = {
  title: "",
  amount: "",
  status: "pending" as OrderStatus,
};

export const OrdersPage = () => {
  const { session } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!session) {
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const payload = await fetchOrders(session.accessToken, {
        page,
        limit: 8,
        search,
        status: statusFilter,
      });
      setOrders(payload.items);
      setTotalPages(payload.pagination.totalPages);
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "Failed to load orders";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, session, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

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

  const openEditModal = (order: Order) => {
    setMode("edit");
    setEditingId(order.id);
    setForm({
      title: order.title,
      amount: String(order.amount),
      status: order.status,
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
    if (isDirty) {
      const shouldClose = window.confirm("You have unsaved changes. Close this popup?");
      if (!shouldClose) {
        return;
      }
    }
    resetModalState();
  };

  const validateForm = () => {
    if (form.title.trim().length < 2) {
      return "Title must contain at least 2 characters.";
    }
    const amount = Number(form.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      return "Amount must be a positive number.";
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session) {
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
      title: form.title.trim(),
      amount: Number(form.amount),
      status: form.status,
    };

    try {
      if (mode === "edit" && editingId) {
        await updateOrder(session.accessToken, editingId, payload);
      } else {
        await createOrder(session.accessToken, payload);
      }
      await loadOrders();
      resetModalState();
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "Failed to save order";
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!session) {
      return;
    }
    const shouldDelete = window.confirm("Delete this order?");
    if (!shouldDelete) {
      return;
    }

    setLoadError(null);
    try {
      await deleteOrder(session.accessToken, id);
      await loadOrders();
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "Failed to delete order";
      setLoadError(message);
    }
  };

  const modalTitle = mode === "edit" ? "Update order" : "Create new order";

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-slate-900">Order Management</h1>
        <p className="mt-2 text-sm text-slate-500">
          Create, update and track order status in one place.
        </p>
      </header>

      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-semibold text-slate-900">Orders table</h2>
          <div className="flex flex-wrap gap-3">
            <button className="btn-primary" data-atid="orders-open-create" type="button" onClick={openCreateModal}>
              Create order
            </button>
            <input
              className="field w-56"
              data-atid="orders-search"
              placeholder="Search code or title"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <select
              className="field w-44"
              data-atid="orders-filter-status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
            >
              <option value="all">All statuses</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {toReadableStatus(status)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{loadError}</p>
        ) : null}

        <div className="mt-4 overflow-x-auto" data-atid="orders-table">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 font-semibold text-slate-600">Code</th>
                <th className="px-3 py-2 font-semibold text-slate-600">Title</th>
                <th className="px-3 py-2 font-semibold text-slate-600">Amount</th>
                <th className="px-3 py-2 font-semibold text-slate-600">Status</th>
                <th className="px-3 py-2 font-semibold text-slate-600">Created</th>
                <th className="px-3 py-2 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={6}>
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-slate-500" colSpan={6}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} data-atid={`order-row-${order.id}`}>
                    <td className="px-3 py-2 font-medium text-slate-700">{order.code}</td>
                    <td className="px-3 py-2 text-slate-700">{order.title}</td>
                    <td className="px-3 py-2 text-slate-700">{formatMoney(order.amount)}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {toReadableStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          className="btn-secondary px-3 py-1 text-xs"
                          data-atid={`order-edit-${order.id}`}
                          type="button"
                          onClick={() => openEditModal(order)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                          data-atid={`order-delete-${order.id}`}
                          type="button"
                          onClick={() => onDelete(order.id)}
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

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            className="btn-secondary"
            disabled={page <= 1}
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          >
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4" data-atid="orders-modal-backdrop">
          <div
            aria-labelledby="orders-modal-title"
            aria-modal="true"
            className="panel w-full max-w-2xl p-5"
            data-atid="orders-modal"
            role="dialog"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-heading text-lg font-semibold text-slate-900" id="orders-modal-title">
                {modalTitle}
              </h2>
              <button className="btn-secondary px-3 py-1" data-atid="orders-modal-close" type="button" onClick={closeModal}>
                Close
              </button>
            </div>

            <form className="grid gap-3 sm:grid-cols-4" data-atid="orders-form" onSubmit={handleSubmit}>
              <input
                className="field sm:col-span-2"
                data-atid="orders-form-title"
                placeholder="Order title"
                value={form.title}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, title: event.target.value }));
                  setIsDirty(true);
                }}
              />
              <input
                className="field"
                data-atid="orders-form-amount"
                min="0"
                placeholder="Amount"
                step="0.01"
                type="number"
                value={form.amount}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, amount: event.target.value }));
                  setIsDirty(true);
                }}
              />
              <select
                className="field"
                data-atid="orders-form-status"
                value={form.status}
                onChange={(event) => {
                  setForm((prev) => ({ ...prev, status: event.target.value as OrderStatus }));
                  setIsDirty(true);
                }}
              >
                {ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {toReadableStatus(status)}
                  </option>
                ))}
              </select>

              {formError ? (
                <p className="sm:col-span-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</p>
              ) : null}

              <div className="sm:col-span-4 flex flex-wrap gap-3">
                <button
                  className="btn-primary"
                  data-atid="orders-form-submit"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Saving..." : mode === "edit" ? "Update order" : "Create order"}
                </button>
                <button className="btn-secondary" data-atid="orders-modal-cancel" type="button" onClick={closeModal}>
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
