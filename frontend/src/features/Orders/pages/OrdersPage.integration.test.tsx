import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrdersPage } from "@/features/Orders/pages/OrdersPage";

const fetchOrdersMock = vi.fn();
const fetchProductsMock = vi.fn();
const createOrderMock = vi.fn();
const updateOrderMock = vi.fn();
const deleteOrderMock = vi.fn();

vi.mock("@/features/Auth/auth-context", () => ({
  useAuth: () => ({
    session: {
      accessToken: "token",
      user: {
        id: "user-id",
        email: "admin@demo.com",
      },
    },
  }),
}));

vi.mock("@/features/Orders/api", () => ({
  fetchOrders: (...args: unknown[]) => fetchOrdersMock(...args),
  fetchProducts: (...args: unknown[]) => fetchProductsMock(...args),
  createOrder: (...args: unknown[]) => createOrderMock(...args),
  updateOrder: (...args: unknown[]) => updateOrderMock(...args),
  deleteOrder: (...args: unknown[]) => deleteOrderMock(...args),
}));

const initialPayload = {
  items: [
    {
      id: "order-1",
      user_id: "user-id",
      product_id: "product-1",
      subtotal: 100,
      tax: 10,
      total: 105,
      amount: 105,
      discount: 5,
      quantity: 1,
      title: "Laptop order",
      product: {
        id: "product-1",
        ean: "EAN-000001",
        title: "Laptop order",
        category: "Electronics",
        vendor: "Tech House",
        price: 100,
        rating: 4.2,
        created_at: "2026-04-20T10:00:00.000Z",
      },
      person: {
        id: "user-id",
        name: "Admin Demo",
        email: "admin@demo.com",
      },
      created_at: "2026-04-20T10:00:00.000Z",
    },
  ],
  pagination: {
    page: 1,
    limit: 8,
    total: 1,
    totalPages: 1,
  },
};

const productsPayload = [
  {
    id: "product-1",
    ean: "EAN-000001",
    title: "Laptop order",
    category: "Electronics",
    vendor: "Tech House",
    price: 100,
    rating: 4.2,
    created_at: "2026-04-20T10:00:00.000Z",
  },
];

describe("OrdersPage integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("loads table and creates a new order", async () => {
    fetchOrdersMock.mockResolvedValue(initialPayload);
    fetchProductsMock.mockResolvedValue(productsPayload);
    createOrderMock.mockResolvedValue({});

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Laptop order")).toBeInTheDocument();
    });

    fireEvent.click(document.querySelector("[data-atid='orders-open-create']") as HTMLElement);
    fireEvent.change(document.querySelector("[data-atid='orders-form-product']") as HTMLSelectElement, {
      target: { value: "product-1" },
    });
    fireEvent.change(document.querySelector("[data-atid='orders-form-quantity']") as HTMLInputElement, {
      target: { value: "2" },
    });
    fireEvent.change(document.querySelector("[data-atid='orders-form-discount']") as HTMLInputElement, {
      target: { value: "5" },
    });
    fireEvent.click(document.querySelector("[data-atid='orders-form-submit']") as HTMLElement);

    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalledWith("token", {
        productId: "product-1",
        quantity: 2,
        discount: 5,
      });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(fetchOrdersMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("edits and deletes an existing order", async () => {
    fetchOrdersMock.mockResolvedValue(initialPayload);
    fetchProductsMock.mockResolvedValue(productsPayload);
    updateOrderMock.mockResolvedValue({});
    deleteOrderMock.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Laptop order")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(document.querySelector("[data-atid='orders-form-quantity']") as HTMLInputElement, {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update order" }));

    await waitFor(() => {
      expect(updateOrderMock).toHaveBeenCalledWith("token", "order-1", {
        productId: "product-1",
        quantity: 3,
        discount: 5,
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteOrderMock).toHaveBeenCalledWith("token", "order-1");
    });
  });

  it("asks for confirmation when closing dirty modal", async () => {
    fetchOrdersMock.mockResolvedValue(initialPayload);
    fetchProductsMock.mockResolvedValue(productsPayload);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Laptop order")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Create order" }));
    fireEvent.change(document.querySelector("[data-atid='orders-form-discount']") as HTMLInputElement, {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(confirmSpy).toHaveBeenCalledWith("You have unsaved changes. Close this popup?");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes modal without confirmation when there is no change", async () => {
    fetchOrdersMock.mockResolvedValue(initialPayload);
    fetchProductsMock.mockResolvedValue(productsPayload);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Laptop order")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Create order" }));
    fireEvent.click(document.querySelector("[data-atid='orders-modal-cancel']") as HTMLElement);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
