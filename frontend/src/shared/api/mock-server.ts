import type { DashboardOverview, Order, OrderStatus, Profile } from "@/shared/types/models";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

const mockProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000999",
  full_name: "Admin Demo",
  phone: "+8400000000",
  avatar_url: "",
  role: "admin",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

let mockOrders: Order[] = Array.from({ length: 9 }).map((_, index) => {
  const statusPool: OrderStatus[] = ["pending", "completed", "cancelled"];
  const status = statusPool[index % statusPool.length];
  return {
    id: crypto.randomUUID(),
    user_id: mockProfile.id,
    code: `ORD-${String(index + 1).padStart(8, "0")}`,
    title: `Demo order ${index + 1}`,
    amount: 80 + index * 20,
    status,
    created_at: new Date(Date.now() - (9 - index) * 86400000).toISOString(),
    updated_at: new Date(Date.now() - (9 - index) * 86400000).toISOString(),
  };
});

const computeOverview = (): DashboardOverview => {
  const statusBreakdown = [
    { status: "pending" as const, count: 0 },
    { status: "completed" as const, count: 0 },
    { status: "cancelled" as const, count: 0 },
  ];

  const dailyMap = new Map<string, number>();
  let totalRevenue = 0;

  mockOrders.forEach((order) => {
    const target = statusBreakdown.find((entry) => entry.status === order.status);
    if (target) {
      target.count += 1;
    }
    totalRevenue += order.amount;
    const day = order.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  });

  return {
    totalOrders: mockOrders.length,
    totalRevenue,
    statusBreakdown,
    dailySeries: Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({ day, count })),
  };
};

const jsonBody = (body?: BodyInit | null) => {
  if (typeof body !== "string") {
    return {};
  }
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return {};
  }
};

const parseQuery = (path: string) => {
  const url = new URL(`http://localhost${path}`);
  const page = Number(url.searchParams.get("page") ?? "1");
  const limit = Number(url.searchParams.get("limit") ?? "10");
  const search = (url.searchParams.get("search") ?? "").toLowerCase();
  const status = url.searchParams.get("status");
  return { page, limit, search, status };
};

export const handleMockRequest = async <T>(
  path: string,
  method: HttpMethod,
  body?: BodyInit | null,
): Promise<T> => {
  if (path.startsWith("/api/v1/stats/overview") && method === "GET") {
    return computeOverview() as T;
  }

  if (path.startsWith("/api/v1/orders") && method === "GET") {
    const { page, limit, search, status } = parseQuery(path);
    let filtered = [...mockOrders];
    if (search) {
      filtered = filtered.filter(
        (order) =>
          order.code.toLowerCase().includes(search) || order.title.toLowerCase().includes(search),
      );
    }
    if (status) {
      filtered = filtered.filter((order) => order.status === status);
    }
    const offset = (page - 1) * limit;
    const items = filtered.slice(offset, offset + limit);
    return {
      items,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    } as T;
  }

  if (path === "/api/v1/orders" && method === "POST") {
    const payload = jsonBody(body);
    const created: Order = {
      id: crypto.randomUUID(),
      user_id: mockProfile.id,
      code: `ORD-${String(mockOrders.length + 1).padStart(8, "0")}`,
      title: String(payload.title ?? "Untitled order"),
      amount: Number(payload.amount ?? 0),
      status: (payload.status as OrderStatus) ?? "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    mockOrders = [created, ...mockOrders];
    return created as T;
  }

  if (path.startsWith("/api/v1/orders/") && method === "PATCH") {
    const id = path.split("/").pop() ?? "";
    const payload = jsonBody(body);
    mockOrders = mockOrders.map((order) =>
      order.id === id
        ? {
            ...order,
            title: String(payload.title ?? order.title),
            amount: Number(payload.amount ?? order.amount),
            status: (payload.status as OrderStatus) ?? order.status,
            updated_at: new Date().toISOString(),
          }
        : order,
    );
    return mockOrders.find((order) => order.id === id) as T;
  }

  if (path.startsWith("/api/v1/orders/") && method === "DELETE") {
    const id = path.split("/").pop() ?? "";
    mockOrders = mockOrders.filter((order) => order.id !== id);
    return undefined as T;
  }

  if (path === "/api/v1/profile" && method === "GET") {
    const summary = {
      total: mockOrders.length,
      pending: mockOrders.filter((item) => item.status === "pending").length,
      completed: mockOrders.filter((item) => item.status === "completed").length,
      cancelled: mockOrders.filter((item) => item.status === "cancelled").length,
    };
    return {
      profile: mockProfile,
      orderSummary: summary,
    } as T;
  }

  if (path === "/api/v1/profile" && method === "PATCH") {
    const payload = jsonBody(body);
    mockProfile.full_name = String(payload.fullName ?? mockProfile.full_name);
    mockProfile.phone = String(payload.phone ?? mockProfile.phone);
    mockProfile.avatar_url = String(payload.avatarUrl ?? mockProfile.avatar_url);
    mockProfile.updated_at = new Date().toISOString();
    return mockProfile as T;
  }

  if (path === "/api/v1/auth/me" && method === "GET") {
    return {
      user: {
        id: mockProfile.id,
        email: "admin@demo.com",
      },
      profile: mockProfile,
    } as T;
  }

  throw new Error(`Mock route is not implemented: ${method} ${path}`);
};
