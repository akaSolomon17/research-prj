import type { DashboardOverview, Order, OrderSummary, Profile, Product } from "@/shared/types/models";

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

const mockProfile: Profile = {
  id: "00000000-0000-0000-0000-000000000999",
  address: "01 Admin Street",
  email: "admin@demo.com",
  password: "secret123",
  name: "Admin Demo",
  city: "Ho Chi Minh City",
  state: "HCM",
  source: "mock",
  birth_date: "1995-01-01",
  zip: "700000",
  created_at: new Date().toISOString(),
  role: "admin",
};

const mockProducts: Product[] = [
  {
    id: "product-1",
    ean: "EAN-000001",
    title: "Monthly Grocery Pack",
    category: "Grocery",
    vendor: "Fresh Mart",
    price: 120,
    rating: 4.4,
    created_at: new Date().toISOString(),
  },
  {
    id: "product-2",
    ean: "EAN-000002",
    title: "Laptop Accessory Kit",
    category: "Electronics",
    vendor: "Tech House",
    price: 95,
    rating: 4.3,
    created_at: new Date().toISOString(),
  },
];

let mockCustomers: Profile[] = [
  mockProfile,
  {
    id: "00000000-0000-0000-0000-000000000111",
    address: "21 Customer Road",
    email: "customer1@demo.com",
    password: null,
    name: "Customer One",
    city: "Ha Noi",
    state: "HN",
    source: "mock",
    birth_date: "1992-02-02",
    zip: "100000",
    created_at: new Date().toISOString(),
    role: "user",
  },
];

let mockOrders: Order[] = Array.from({ length: 6 }).map((_, index) => {
  const product = mockProducts[index % mockProducts.length];
  const customer = mockCustomers[index % mockCustomers.length];
  const quantity = (index % 3) + 1;
  const subtotal = Number((product.price * quantity).toFixed(2));
  const tax = Number((subtotal * 0.1).toFixed(2));
  const discount = index % 2 === 0 ? 5 : 0;
  const total = Number(Math.max(subtotal + tax - discount, 0).toFixed(2));

  return {
    id: crypto.randomUUID(),
    user_id: customer.id,
    product_id: product.id,
    subtotal,
    tax,
    total,
    discount,
    quantity,
    title: product.title,
    amount: total,
    product,
    person: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
    },
    created_at: new Date(Date.now() - (6 - index) * 86400000).toISOString(),
  };
});

const computeOverview = (): DashboardOverview => {
  const dailyMap = new Map<string, number>();
  let totalRevenue = 0;
  let totalQuantity = 0;

  mockOrders.forEach((order) => {
    totalRevenue += order.total;
    totalQuantity += order.quantity;
    const day = order.created_at.slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  });

  return {
    totalOrders: mockOrders.length,
    totalRevenue,
    totalQuantity,
    averageOrderValue: mockOrders.length > 0 ? Number((totalRevenue / mockOrders.length).toFixed(2)) : 0,
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
  return { page, limit, search };
};

const buildSummary = (): OrderSummary => {
  const totalSpent = mockOrders.reduce((sum, order) => sum + order.total, 0);
  const totalQuantity = mockOrders.reduce((sum, order) => sum + order.quantity, 0);

  return {
    total: mockOrders.length,
    totalSpent,
    totalQuantity,
    averageOrderValue: mockOrders.length > 0 ? Number((totalSpent / mockOrders.length).toFixed(2)) : 0,
  };
};

const withMeta = (profile: Profile) => ({
  ...profile,
  role: profile.role ?? "user",
});

const paginate = <T,>(items: T[], page: number, limit: number) => {
  const offset = (page - 1) * limit;
  return items.slice(offset, offset + limit);
};

export const handleMockRequest = async <T>(
  path: string,
  method: HttpMethod,
  body?: BodyInit | null,
): Promise<T> => {
  if (path.startsWith("/api/v1/stats/overview") && method === "GET") {
    return computeOverview() as T;
  }

  if (path.startsWith("/api/v1/products") && method === "GET") {
    return mockProducts as T;
  }

  if (path.startsWith("/api/v1/people") && method === "GET") {
    const { page, limit, search } = parseQuery(path);
    let filtered = [...mockCustomers];
    if (search) {
      filtered = filtered.filter((customer) => {
        const values = [customer.name, customer.email, customer.city, customer.state, customer.address];
        return values.some((value) => String(value ?? "").toLowerCase().includes(search));
      });
    }
    return {
      items: paginate(filtered, page, limit),
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    } as T;
  }

  if (path === "/api/v1/people" && method === "POST") {
    const payload = jsonBody(body);
    const created: Profile = {
      id: crypto.randomUUID(),
      address: payload.address ? String(payload.address) : null,
      email: String(payload.email ?? ""),
      password: payload.password ? String(payload.password) : null,
      name: String(payload.name ?? ""),
      city: payload.city ? String(payload.city) : null,
      state: payload.state ? String(payload.state) : null,
      source: payload.source ? String(payload.source) : null,
      birth_date: payload.birthDate ? String(payload.birthDate) : null,
      zip: payload.zip ? String(payload.zip) : null,
      created_at: new Date().toISOString(),
      role: "user",
    };
    mockCustomers = [created, ...mockCustomers];
    return withMeta(created) as T;
  }

  if (path.startsWith("/api/v1/people/") && method === "PATCH") {
    const id = path.split("/").pop() ?? "";
    const payload = jsonBody(body);
    mockCustomers = mockCustomers.map((customer) => {
      if (customer.id !== id) {
        return customer;
      }
      return {
        ...customer,
        name: payload.name !== undefined ? String(payload.name) : customer.name,
        email: payload.email !== undefined ? String(payload.email) : customer.email,
        address: payload.address !== undefined ? String(payload.address) : customer.address,
        city: payload.city !== undefined ? String(payload.city) : customer.city,
        state: payload.state !== undefined ? String(payload.state) : customer.state,
        zip: payload.zip !== undefined ? String(payload.zip) : customer.zip,
        source: payload.source !== undefined ? String(payload.source) : customer.source,
        birth_date: payload.birthDate !== undefined ? String(payload.birthDate) : customer.birth_date,
        password: payload.password !== undefined ? String(payload.password) : customer.password,
      };
    });
    const updated = mockCustomers.find((customer) => customer.id === id);
    return withMeta(updated ?? mockProfile) as T;
  }

  if (path.startsWith("/api/v1/people/") && method === "DELETE") {
    const id = path.split("/").pop() ?? "";
    mockCustomers = mockCustomers.filter((customer) => customer.id !== id);
    mockOrders = mockOrders.filter((order) => order.user_id !== id);
    return undefined as T;
  }

  if (path.startsWith("/api/v1/orders") && method === "GET") {
    const { page, limit, search } = parseQuery(path);
    let filtered = [...mockOrders];
    if (search) {
      filtered = filtered.filter((order) => {
        const values = [
          order.title?.toLowerCase(),
          order.product?.ean?.toLowerCase(),
          order.person?.name?.toLowerCase(),
          order.person?.email?.toLowerCase(),
        ];
        return values.some((value) => value?.includes(search));
      });
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
    const product = mockProducts.find((item) => item.id === String(payload.productId)) ?? mockProducts[0];
    const customer =
      mockCustomers.find((item) => item.id === String(payload.userId)) ??
      mockProfile;
    const quantity = Number(payload.quantity ?? 1);
    const discount = Number(payload.discount ?? 0);
    const subtotal = Number((product.price * quantity).toFixed(2));
    const tax = Number((subtotal * 0.1).toFixed(2));
    const total = Number(Math.max(subtotal + tax - discount, 0).toFixed(2));
    const created: Order = {
      id: crypto.randomUUID(),
      user_id: customer.id,
      product_id: product.id,
      subtotal,
      tax,
      total,
      discount,
      quantity,
      title: product.title,
      amount: total,
      product,
      person: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
      },
      created_at: new Date().toISOString(),
    };
    mockOrders = [created, ...mockOrders];
    return created as T;
  }

  if (path.startsWith("/api/v1/orders/") && method === "PATCH") {
    const id = path.split("/").pop() ?? "";
    const payload = jsonBody(body);
    mockOrders = mockOrders.map((order) => {
      if (order.id !== id) {
        return order;
      }
      const product = mockProducts.find((item) => item.id === String(payload.productId)) ?? order.product ?? mockProducts[0];
      const customer =
        mockCustomers.find((item) => item.id === String(payload.userId)) ??
        order.person ??
        mockProfile;
      const quantity = Number(payload.quantity ?? order.quantity);
      const discount = Number(payload.discount ?? order.discount);
      const subtotal = Number((product.price * quantity).toFixed(2));
      const tax = Number((subtotal * 0.1).toFixed(2));
      const total = Number(Math.max(subtotal + tax - discount, 0).toFixed(2));
      return {
        ...order,
        product_id: product.id,
        subtotal,
        tax,
        total,
        discount,
        quantity,
        title: product.title,
        amount: total,
        product,
        user_id: customer.id,
        person: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
        },
      };
    });
    return mockOrders.find((order) => order.id === id) as T;
  }

  if (path.startsWith("/api/v1/orders/") && method === "DELETE") {
    const id = path.split("/").pop() ?? "";
    mockOrders = mockOrders.filter((order) => order.id !== id);
    return undefined as T;
  }

  if (path === "/api/v1/profile" && method === "GET") {
    return {
      profile: withMeta(mockProfile),
      orderSummary: buildSummary(),
    } as T;
  }

  if (path === "/api/v1/profile" && method === "PATCH") {
    const payload = jsonBody(body);
    mockProfile.name = String(payload.name ?? mockProfile.name);
    mockProfile.address = String(payload.address ?? mockProfile.address);
    mockProfile.city = String(payload.city ?? mockProfile.city);
    mockProfile.state = String(payload.state ?? mockProfile.state);
    mockProfile.zip = String(payload.zip ?? mockProfile.zip);
    mockProfile.source = String(payload.source ?? mockProfile.source);
    mockProfile.birth_date = String(payload.birthDate ?? mockProfile.birth_date);
    return withMeta(mockProfile) as T;
  }

  if (path === "/api/v1/auth/me" && method === "GET") {
    return {
      user: {
        id: mockProfile.id,
        email: mockProfile.email,
        role: mockProfile.role,
      },
      profile: withMeta(mockProfile),
    } as T;
  }

  throw new Error(`Mock route is not implemented: ${method} ${path}`);
};
