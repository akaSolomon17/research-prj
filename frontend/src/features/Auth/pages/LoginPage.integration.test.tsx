import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import { LoginPage } from "@/features/Auth/pages/LoginPage";

const signInMock = vi.fn();

vi.mock("@/features/Auth/auth-context", () => ({
  useAuth: () => ({
    loading: false,
    session: null,
    signIn: signInMock,
  }),
}));

describe("LoginPage integration", () => {
  it("submits credentials and redirects on success", async () => {
    signInMock.mockResolvedValueOnce({});

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@demo.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "secret123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith({
        email: "admin@demo.com",
        password: "secret123",
      });
      expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    });
  });

  it("shows backend error when sign in fails", async () => {
    signInMock.mockResolvedValueOnce({ error: "Invalid login credentials" });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@demo.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid login credentials");
    });
  });
});
