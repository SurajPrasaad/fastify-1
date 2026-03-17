import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth-store';


export interface ApiError {
    message: string;
    status?: number;
    code?: string;
    fields?: Record<string, string>;
}

class ApiClient {
    private baseUrl = process.env.EXPO_PUBLIC_API_URL || 
        (Platform.OS === 'web' ? "http://localhost:8000" : "http://10.0.2.2:8000");
    private accessToken: string | null = null;
    private refreshPromise: Promise<string | null> | null = null;

    setToken(token: string | null) {
        this.accessToken = token;
        // Sync with Zustand store
        useAuthStore.getState().setToken(token);
        if (!token) {
            useAuthStore.getState().setUser(null);
        }
    }

    getToken() {
        if (!this.accessToken) {
            this.accessToken = useAuthStore.getState().token;
        }
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

        const token = this.getToken();
        if (token && !skipAuth) {
            headers.set("Authorization", `Bearer ${token}`);
        }

        const fetchOptions: RequestInit = {
            ...options,
            headers,
            credentials: 'include',
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
            throw networkError;
        }
    }

    private async refreshToken(): Promise<string | null> {
        if (this.refreshPromise) return this.refreshPromise;

        this.refreshPromise = (async () => {
            try {
                const response = await fetch(`${this.baseUrl}/auth/refresh`, {
                    method: "POST",
                    credentials: 'include',
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
