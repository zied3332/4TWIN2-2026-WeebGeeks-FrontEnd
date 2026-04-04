const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
}

function authHeaders() {
  const rawToken = localStorage.getItem("token") || localStorage.getItem("access_token");
  const token = String(rawToken || "").replace(/^Bearer\s+/i, "").trim();

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle(res: Response) {
  if (!res.ok) {
    const txt = await res.text();
    const message = txt || "Request failed";
    const err: Error & { status?: number } = new Error(message);
    err.status = res.status;
    throw err;
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export async function getAllDepartments(): Promise<Department[]> {
  const res = await fetch(`${BASE}/departments`, {
    method: "GET",
    headers: authHeaders(),
  });
  return handle(res);
}

export async function createDepartment(data: {
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
}): Promise<Department> {
  const res = await fetch(`${BASE}/departments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function updateDepartment(
  id: string,
  data: {
    name?: string;
    code?: string;
    description?: string;
    manager_id?: string;
  }
): Promise<Department> {
  const res = await fetch(`${BASE}/departments/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return handle(res);
}

export async function deleteDepartment(id: string): Promise<void> {
  const res = await fetch(`${BASE}/departments/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  await handle(res);
}
