/** White-label brand applied across the shell. */
export interface Brand {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  companyId: string | null;
  role: string;
  isSuperAdmin: boolean;
}

/** Default brand used in demo mode or before a tenant is resolved. */
export const DEFAULT_BRAND: Brand = {
  name: "NetBite360",
  logoUrl: null,
  primaryColor: "#4f46e5",
  companyId: null,
  role: "SUPER_ADMIN",
  isSuperAdmin: true,
};
