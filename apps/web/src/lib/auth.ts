import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  roles: string[];
  permissions: string[];
  companyId?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  companyId?: string;
  exp: number;
  iat: number;
}

export const auth = {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get(ACCESS_TOKEN_KEY) || null;
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return Cookies.get(REFRESH_TOKEN_KEY) || null;
  },

  setTokens(accessToken: string, refreshToken?: string): void {
    if (typeof window === "undefined") return;
    
    // Decode token to get expiration
    const decoded = jwtDecode<TokenPayload>(accessToken);
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
      expires: expiresIn / 86400, // Convert seconds to days
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    if (refreshToken) {
      Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
        expires: 30, // 30 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });
    }
  },

  clearTokens(): void {
    if (typeof window === "undefined") return;
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
  },

  getUser(): User | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return {
        id: decoded.sub,
        email: decoded.email,
        firstName: "",
        lastName: "",
        roles: decoded.roles || [],
        permissions: [],
        companyId: decoded.companyId,
      };
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  },

  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  },
};
