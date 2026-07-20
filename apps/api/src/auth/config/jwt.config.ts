export const JWT_CONFIG = {
  // Access Token defaults
  accessTokenSecret: process.env.JWT_SECRET || 'zayjar-default-secret-key-12345!',
  accessTokenExpiry: '15m',
  
  // Refresh Token defaults
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'zayjar-default-refresh-secret-key-999!',
  refreshTokenExpiry: '7d',
  
  // Cookie standard configuration
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days in ms
  }
};
