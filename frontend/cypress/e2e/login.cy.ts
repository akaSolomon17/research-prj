describe("Login screen", () => {
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
    cy.visit("/login");
  });

  it("logs in and redirects to dashboard", () => {
    cy.get("[data-atid='login-email']").type("admin@demo.com");
    cy.get("[data-atid='login-password']").type("secret123");
    cy.get("[data-atid='login-submit']").click();
    cy.url().should("include", "/dashboard");
    cy.contains("Home Dashboard").should("be.visible");
  });
});
