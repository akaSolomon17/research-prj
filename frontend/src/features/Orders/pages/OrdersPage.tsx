import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/features/Auth/auth-context";
import { fetchCustomers } from "@/features/Customers/api";
import { createOrder, deleteOrder, fetchOrders, fetchProducts, updateOrder } from "@/features/Orders/api";
import { formatMoney } from "@/features/Orders/utils";
import type { Customer, Order, Product } from "@/shared/types/models";

type ModalMode = "create" | "edit";

interface OrderFormState {
  userId: string;
  productId: string;
  quantity: string;
  discount: string;
}

const initialForm: OrderFormState = {
  userId: "",
  productId: "",
  quantity: "1",
  discount: "0",
};

export const OrdersPage = () => {
  const { session, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OrderFormState>(initialForm);
  const [isDirty, setIsDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const defaultProductId = useMemo(() => products[0]?.id ?? "", [products]);
  const defaultCustomerId = useMemo(() => customers[0]?.id ?? "", [customers]);
  const isAdmin = profile?.role === "admin";

  const loadProducts = useCallback(async () => {
    if (!session) {
      return;
    }
    setProductsLoading(true);
    try {
      const payload = await fetchProducts(session.accessToken);
      setProducts(payload);
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "Failed to load products";
      setLoadError(message);
    } finally {
      setProductsLoading(false);
    }
  }, [session]);

  const loadCustomers = useCallback(async () => {
    if (!session || !isAdmin) {
      return;
    }
    try {
      const payload = await fetchCustomers(session.accessToken, {
        page: 1,
        limit: 50,
        search: "",
      });
      setCustomers(payload.items);
    } catch {
      setCustomers([]);
    }
  }, [isAdmin, session]);

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
      });
      setOrders(payload.items);
      setTotalPages(payload.pagination.totalPages);
    } catch (reason: unknown) {
      const message = reason instanceof Error ? reason.message : "Failed to load orders";
      setLoadError(message);
    } finally {
      setLoading(false);
    }
  }, [page, search, session]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

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
    setForm({
      userId: isAdmin ? defaultCustomerId : "",
      productId: defaultProductId,
      quantity: "1",
      discount: "0",
    });
    setIsDirty(false);
    setFormError(null);
    setIsSubmitting(false);
    setIsModalOpen(true);
  };

  const openEditModal = (order: Order) => {
    setMode("edit");
    setEditingId(order.id);
    setForm({
      userId: isAdmin ? order.user_id : "",
      productId: order.product_id,
      quantity: String(order.quantity),
      discount: String(order.discount),
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
    if (!form.productId) {
      return "Please select a product.";
    }
    if (isAdmin && !form.userId) {
      return "Please select a customer.";
    }
    const quantity = Number(form.quantity);
    if (Number.isNaN(quantity) || quantity < 1) {
      return "Quantity must be at least 1.";
    }
    const discount = Number(form.discount);
    if (Number.isNaN(discount) || discount < 0) {
      return "Discount must be zero or greater.";
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
      ...(isAdmin ? { userId: form.userId } : {}),
      productId: form.productId,
      quantity: Number(form.quantity),
      discount: Number(form.discount),
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
      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <span className="chip">Table view</span>
          <h1 className="font-heading text-3xl font-bold text-slate-900">Order Management</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">
            Create, update, search, and track orders with product and quantity data.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Loaded</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{orders.length}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Pages</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{totalPages}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wider text-slate-500">Products</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{products.length}</p>
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
            <h2 className="font-heading text-lg font-semibold text-slate-900">Orders table</h2>
            <p className="mt-1 text-sm text-slate-500">Manage order records and inspect product/customer links.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              className="field-soft sm:w-80"
              data-atid="orders-search"
              placeholder="Search product or customer"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <button className="btn-primary" data-atid="orders-open-create" type="button" onClick={openCreateModal}>
              Create order
            </button>
          </div>
        </div>

        {loadError ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{loadError}</p>
        ) : null}

        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200" data-atid="orders-table">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-50/95 backdrop-blur">
              <tr>
                <th className="px-4 py-3 font-semibold text-slate-600">Product</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Customer</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Qty</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Subtotal</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Tax</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Discount</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Total</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Created</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td className="px-4 py-5 text-slate-500" colSpan={9}>
                    Loading...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={9}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="transition hover:bg-slate-50/80" data-atid={`order-row-${order.id}`}>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      <div className="space-y-1">
                        <p>{order.title ?? order.product?.title ?? "Order item"}</p>
                        <p className="text-xs text-slate-500">{order.product?.ean ?? order.product_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{order.person?.name ?? order.person?.email ?? "-"}</td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="chip">{order.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatMoney(order.subtotal)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMoney(order.tax)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMoney(order.discount)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMoney(order.amount ?? order.total)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          className="btn-secondary px-3 py-1.5 text-xs"
                          data-atid={`order-edit-${order.id}`}
                          type="button"
                          onClick={() => openEditModal(order)}
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-xl border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
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

        <div className="mt-5 flex items-center justify-end gap-3">
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 backdrop-blur-sm"
          data-atid="orders-modal-backdrop"
        >
          <div
            aria-labelledby="orders-modal-title"
            aria-modal="true"
            className="panel-strong w-full max-w-2xl p-6 shadow-2xl"
            data-atid="orders-modal"
            role="dialog"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <span className="chip">{mode === "edit" ? "Edit" : "Create"}</span>
                <h2 className="mt-2 font-heading text-xl font-semibold text-slate-900" id="orders-modal-title">
                  {modalTitle}
                </h2>
              </div>
              <button className="btn-secondary px-3 py-1.5" data-atid="orders-modal-close" type="button" onClick={closeModal}>
                Close
              </button>
            </div>

            <form className="grid gap-4 sm:grid-cols-4" data-atid="orders-form" onSubmit={handleSubmit}>
              {isAdmin ? (
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700" htmlFor="orders-customer">
                    Customer
                  </label>
                  <select
                    id="orders-customer"
                    className="field-soft"
                    value={form.userId ?? ""}
                    onChange={(event) => {
                      setForm((prev) => ({ ...prev, userId: event.target.value }));
                      setIsDirty(true);
                    }}
                  >
                    <option value="">{customers.length === 0 ? "No customers available" : "Select a customer"}</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name ?? customer.email ?? customer.id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div className={`${isAdmin ? "" : "sm:col-span-2"} space-y-1.5`}>
                <label className="block text-sm font-medium text-slate-700" htmlFor="orders-product">
                  Product
                </label>
                <select
                  id="orders-product"
                  className="field-soft"
                  data-atid="orders-form-product"
                  value={form.productId}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, productId: event.target.value }));
                    setIsDirty(true);
                  }}
                >
                  <option value="">{productsLoading ? "Loading products..." : "Select a product"}</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} - {product.ean}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="orders-quantity">
                  Quantity
                </label>
                <input
                  id="orders-quantity"
                  className="field-soft"
                  data-atid="orders-form-quantity"
                  min="1"
                  placeholder="1"
                  step="1"
                  type="number"
                  value={form.quantity}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, quantity: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700" htmlFor="orders-discount">
                  Discount
                </label>
                <input
                  id="orders-discount"
                  className="field-soft"
                  data-atid="orders-form-discount"
                  min="0"
                  placeholder="0"
                  step="0.01"
                  type="number"
                  value={form.discount}
                  onChange={(event) => {
                    setForm((prev) => ({ ...prev, discount: event.target.value }));
                    setIsDirty(true);
                  }}
                />
              </div>

              {formError ? (
                <p className="sm:col-span-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {formError}
                </p>
              ) : null}

              <div className="sm:col-span-4 flex flex-wrap gap-3 pt-1">
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
