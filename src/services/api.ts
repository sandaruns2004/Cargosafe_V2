const API = "/api"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function authHeaders(): HeadersInit {
  const token = getToken()
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" }
}

export async function handle(res: Response) {
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    throw new Error("Unauthorized")
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `API error ${res.status}`)
  }
  return res.json()
}

// Add API fetch helpers
export const api = {
  get: async (path: string) => {
    const res = await fetch(`${API}${path}`, { headers: authHeaders() })
    return handle(res)
  },
  post: async (path: string, body: any) => {
    const res = await fetch(`${API}${path}`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    })
    return handle(res)
  },
  patch: async (path: string, body: any) => {
    const res = await fetch(`${API}${path}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    })
    return handle(res)
  },
  delete: async (path: string) => {
    const res = await fetch(`${API}${path}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
    return handle(res)
  }
}
