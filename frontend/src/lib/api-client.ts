import { toast } from "sonner";
import { ApiError } from "@/features/auth/types";

class ApiClient {
    private baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    private accessToken: string | null = null;
    private refreshPromise: Promise<string | null> | null = null;

    setToken(token: string | null) {
        this.accessToken = token;
        if (typeof window !== "undefined") {
            if (token) {
                localStorage.setItem("has_token", "true");
            } else {
                localStorage.removeItem("has_token");
            }
        }
    }

    getToken() {
        return this.accessToken;
    }

    async request<T>(
        path: string,
        options: RequestInit = {},
        skipAuth = false
    ): Promise<T> {
        const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
        const headers = new Headers(options.headers);

        if (options.body && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
            headers.set("Content-Type", "application/json");
        }

        const token = this.accessToken;
        if (token && !skipAuth) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        const fetchOptions: RequestInit = {
            ...options,
            headers,
            credentials: options.credentials || "include",
        };

        try {
            let response = await fetch(url, fetchOptions);

            // Handle 401 Unauthorized - Attempt Silent Refresh
            if (response.status === 401 && !skipAuth && !path.includes("/auth/refresh")) {
                const newToken = await this.refreshToken();
                if (newToken) {
                    headers.set("Authorization", `Bearer ${newToken}`);
                    response = await fetch(url, { ...fetchOptions, headers });
                } else {
                    this.setToken(null);
                }
            }

            if (!response.ok) {
                let errorData: any = {};
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    errorData = await response.json().catch(() => ({}));
                } else {
                    errorData = { message: await response.text().catch(() => "Server Error") };
                }

                const normalizedError: ApiError = {
                    message: errorData.message || "An unexpected error occurred",
                    code: errorData.code,
                    status: response.status,
                    fields: errorData.fields,
                };

                if (typeof window !== "undefined" &&
                    response.status !== 401 &&
                    response.status !== 422 &&
                    response.status !== 429
                ) {
                    toast.error(normalizedError.message);
                }

                throw normalizedError;
            }

            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return await response.json();
            }
            const text = await response.text();
            return text ? JSON.parse(text) : {} as T;
        } catch (error) {
            if ((error as ApiError).status) throw error;

            const networkError: ApiError = {
                message: "Network error. Please check your connection.",
                status: 500,
            };
            if (typeof window !== "undefined") {
                toast.error(networkError.message);
            }
            throw networkError;
        }
    }

    private async refreshToken(): Promise<string | null> {
        if (this.refreshPromise) return this.refreshPromise;

        this.refreshPromise = (async () => {
            try {
                const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                    method: "POST",
                    credentials: "include",
                });

                if (!response.ok) throw new Error("Refresh failed");

                const data = await response.json();
                this.accessToken = data.accessToken;
                return data.accessToken;
            } catch (err) {
                this.accessToken = null;
                return null;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    // Helper methods
    get<T>(path: string, options?: RequestInit) {
        return this.request<T>(path, { ...options, method: "GET" });
    }

    post<T>(path: string, body?: any, options?: RequestInit) {
        return this.request<T>(path, {
            ...options,
            method: "POST",
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    }

    put<T>(path: string, body?: any, options?: RequestInit) {
        return this.request<T>(path, {
            ...options,
            method: "PUT",
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    }

    patch<T>(path: string, body?: any, options?: RequestInit) {
        return this.request<T>(path, {
            ...options,
            method: "PATCH",
            body: body instanceof FormData ? body : JSON.stringify(body),
        });
    }

    delete<T>(path: string, options?: RequestInit) {
        return this.request<T>(path, { ...options, method: "DELETE" });
    }
}

export const api = new ApiClient();
