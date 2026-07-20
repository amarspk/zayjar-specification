export interface UserProfile {
    id: string;
    tenantId: string | null;
    firstName: string;
    lastName: string;
    email: string;
    roles: string[];
    isMfaEnabled: boolean;
}
export interface TenantBranding {
    logoUrl: string | null;
    bannerUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
}
//# sourceMappingURL=core.d.ts.map