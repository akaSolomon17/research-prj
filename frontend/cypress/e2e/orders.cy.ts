describe("Orders management", () => {
  beforeEach(() => {
    cy.intercept("GET", "**/api/v1/stats/overview", {
      statusCode: 200,
      body: {
        totalOrders: 1,
        totalRevenue: 120,
        statusBreakdown: [
          { status: "pending", count: 1 },
          { status: "completed", count: 0 },
          { status: "cancelled", count: 0 },
        ],
        dailySeries: [{ day: "2026-04-22", count: 1 }],
      },
    });

    cy.intercept("GET", "**/api/v1/orders**", {
      statusCode: 200,
      body: {
        items: [
          {
            id: "order-1",
            user_id: "u1",
            code: "ORD-00000001",
            title: "Demo order",
            amount: 120,
            status: "pending",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        pagination: {
          page: 1,
          limit: 8,
          total: 1,
          totalPages: 1,
        },
      },
    }).as("getOrders");

    cy.intercept("POST", "**/api/v1/orders", {
      statusCode: 201,
      body: {
        id: "order-2",
        user_id: "u1",
        code: "ORD-00000002",
        title: "Created from Cypress",
        amount: 200,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }).as("createOrder");

    cy.intercept("PATCH", "**/api/v1/orders/order-1", {
      statusCode: 200,
      body: {
        id: "order-1",
        user_id: "u1",
        code: "ORD-00000001",
        title: "Demo order updated",
        amount: 120,
        status: "completed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    }).as("updateOrder");

    cy.intercept("DELETE", "**/api/v1/orders/order-1", {
      statusCode: 204,
      body: {},
    }).as("deleteOrder");

    cy.visit("/login");
    cy.get("[data-atid='login-email']").type("admin@demo.com");
    cy.get("[data-atid='login-password']").type("secret123");
    cy.get("[data-atid='login-submit']").click();
  });

  it("creates, updates and deletes orders", () => {
    cy.get("[data-atid='nav-orders']").click();
    cy.wait("@getOrders");

    cy.get("[data-atid='orders-open-create']").click();
    cy.get("[data-atid='orders-modal']").should("be.visible");
    cy.get("[data-atid='orders-form-title']").type("Created from Cypress");
    cy.get("[data-atid='orders-form-amount']").type("200");
    cy.get("[data-atid='orders-form-submit']").click();
    cy.wait("@createOrder");

    cy.contains("Demo order").should("be.visible");
    cy.get("[data-atid='order-edit-order-1']").click();
    cy.get("[data-atid='orders-modal']").should("be.visible");
    cy.get("[data-atid='orders-form-status']").select("Completed");
    cy.get("[data-atid='orders-form-submit']").click();
    cy.wait("@updateOrder");

    cy.on("window:confirm", () => true);
    cy.get("[data-atid='order-delete-order-1']").click();
    cy.wait("@deleteOrder");
  });
});
