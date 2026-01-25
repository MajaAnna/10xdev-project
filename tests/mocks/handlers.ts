import { http, HttpResponse } from "msw";

/**
 * Example MSW handlers for API mocking
 *
 * MSW (Mock Service Worker) allows intercepting HTTP requests
 * and returning mocked responses without actually calling the API.
 */

// Base API URL - adjust to your application
const API_URL = process.env.PUBLIC_API_URL || "http://localhost:4321";

export const handlers = [
  // Example: GET /api/users
  http.get(`${API_URL}/api/users`, () => {
    return HttpResponse.json([
      { id: 1, name: "John Doe", email: "john@example.com" },
      { id: 2, name: "Jane Smith", email: "jane@example.com" },
    ]);
  }),

  // Example: GET /api/users/:id
  http.get(`${API_URL}/api/users/:id`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      id: Number(id),
      name: "John Doe",
      email: "john@example.com",
    });
  }),

  // Example: POST /api/users
  http.post(`${API_URL}/api/users`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json(
      {
        id: 3,
        ...body,
      },
      { status: 201 }
    );
  }),

  // Example: PUT /api/users/:id
  http.put(`${API_URL}/api/users/:id`, async ({ params, request }) => {
    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      id: Number(id),
      ...body,
    });
  }),

  // Example: DELETE /api/users/:id
  http.delete(`${API_URL}/api/users/:id`, ({ params }) => {
    const { id } = params;

    return HttpResponse.json({ message: `User ${id} deleted` }, { status: 200 });
  }),

  // Example: 404 Error
  http.get(`${API_URL}/api/not-found`, () => {
    return HttpResponse.json({ error: "Not found" }, { status: 404 });
  }),

  // Example: 500 Error
  http.get(`${API_URL}/api/error`, () => {
    return HttpResponse.json({ error: "Internal server error" }, { status: 500 });
  }),

  // Example: Delayed response
  http.get(`${API_URL}/api/slow`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return HttpResponse.json({ message: "Slow response" });
  }),

  // Example: Authentication
  http.post(`${API_URL}/api/auth/login`, async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };

    if (email === "test@example.com" && password === "password123") {
      return HttpResponse.json({
        token: "mock-jwt-token",
        user: {
          id: 1,
          email: "test@example.com",
          name: "Test User",
        },
      });
    }

    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  // Example: Endpoint with query params
  http.get(`${API_URL}/api/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q");

    return HttpResponse.json({
      query,
      results: [{ id: 1, title: `Result for ${query}` }],
    });
  }),
];
