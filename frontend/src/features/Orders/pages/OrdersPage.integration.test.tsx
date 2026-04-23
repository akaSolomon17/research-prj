import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrdersPage } from "@/features/Orders/pages/OrdersPage";

const fetchOrdersMock = vi.fn();
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
  createOrder: (...args: unknown[]) => createOrderMock(...args),
  updateOrder: (...args: unknown[]) => updateOrderMock(...args),
  deleteOrder: (...args: unknown[]) => deleteOrderMock(...args),
}));

const initialPayload = {
  items: [
    {
      id: "order-1",
      user_id: "user-id",
      code: "ORD-00000001",
      title: "Laptop order",
      amount: 100,
      status: "pending" as const,
      created_at: "2026-04-20T10:00:00.000Z",
      updated_at: "2026-04-20T10:00:00.000Z",
    },
  ],
  pagination: {
    page: 1,
    limit: 8,
    total: 1,
    totalPages: 1,
  },
};

describe("OrdersPage integration", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it("loads table and creates a new order", async () => {
    fetchOrdersMock.mockResolvedValue(initialPayload);
    createOrderMock.mockResolvedValue({});

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Laptop order")).toBeInTheDocument();
    });

    fireEvent.click(document.querySelector("[data-atid='orders-open-create']") as HTMLElement);
    fireEvent.change(screen.getByPlaceholderText("Order title"), {
      target: { value: "New order" },
    });
    fireEvent.change(screen.getByPlaceholderText("Amount"), {
      target: { value: "250" },
    });
    fireEvent.click(document.querySelector("[data-atid='orders-form-submit']") as HTMLElement);

    await waitFor(() => {
      expect(createOrderMock).toHaveBeenCalledWith("token", {
        title: "New order",
        amount: 250,
        status: "pending",
      });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(fetchOrdersMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("edits and deletes an existing order", async () => {
    fetchOrdersMock.mockResolvedValue(initialPayload);
    updateOrderMock.mockResolvedValue({});
    deleteOrderMock.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Laptop order")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByPlaceholderText("Order title"), {
      target: { value: "Laptop order updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update order" }));

    await waitFor(() => {
      expect(updateOrderMock).toHaveBeenCalledWith("token", "order-1", {
        title: "Laptop order updated",
        amount: 100,
        status: "pending",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteOrderMock).toHaveBeenCalledWith("token", "order-1");
    });
  });

  it("asks for confirmation when closing dirty modal", async () => {
    fetchOrdersMock.mockResolvedValue(initialPayload);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<OrdersPage />);

    await waitFor(() => {
      expect(screen.getByText("Laptop order")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Create order" }));
    fireEvent.change(screen.getByPlaceholderText("Order title"), {
      target: { value: "Changed value" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(confirmSpy).toHaveBeenCalledWith("You have unsaved changes. Close this popup?");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes modal without confirmation when there is no change", async () => {
    fetchOrdersMock.mockResolvedValue(initialPayload);
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
