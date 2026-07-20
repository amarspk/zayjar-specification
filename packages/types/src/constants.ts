export const PLATFORM_LIMITS = {
  BRONZE: {
    maxBranches: 1,
    maxRestaurants: 1,
    maxProductsPerBranch: 100,
    allowCustomDomains: false,
    allowOnlinePayments: false,
    allowAnalytics: false,
  },
  SILVER: {
    maxBranches: 3,
    maxRestaurants: 1,
    maxProductsPerBranch: 500,
    allowCustomDomains: false,
    allowOnlinePayments: true,
    allowAnalytics: true,
  },
  GOLD: {
    maxBranches: 9999, // Unlimited
    maxRestaurants: 9999,
    maxProductsPerBranch: 99999,
    allowCustomDomains: true,
    allowOnlinePayments: true,
    allowAnalytics: true,
  },
};

export const SECURITY_CONFIG = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days in ms
};

export const IMAGE_LIMITS = {
  logoMaxSize: 2 * 1024 * 1024, // 2MB
  bannerMaxSize: 4 * 1024 * 1024, // 4MB
  productMaxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

export const BRAND_DEFAULTS = {
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
};
