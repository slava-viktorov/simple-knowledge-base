export const REFRESH_TOKEN_NAME =
  process.env.JWT_REFRESH_TOKEN_NAME || 'refreshToken';
export const ACCESS_TOKEN_NAME =
  process.env.JWT_ACCESS_TOKEN_NAME || 'accessToken';

export function extractTokensFromCookies(
  setCookieHeader: string[] | undefined,
): {
  accessToken: string;
  refreshToken: string;
} {
  let accessToken = '';
  let refreshToken = '';
  if (Array.isArray(setCookieHeader)) {
    for (const cookieStr of setCookieHeader) {
      const matchAccess = cookieStr.match(
        new RegExp(`${ACCESS_TOKEN_NAME}=([^;]+)`),
      );
      if (matchAccess) accessToken = matchAccess[1];
      const matchRefresh = cookieStr.match(
        new RegExp(`${REFRESH_TOKEN_NAME}=([^;]+)`),
      );
      if (matchRefresh) refreshToken = matchRefresh[1];
    }
  }
  return { accessToken, refreshToken };
}
