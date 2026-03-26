const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  manager_id?: string;
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
    headers: { "Content-Type": "application/json" },
  });
  return handle(res);
}
