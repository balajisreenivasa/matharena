// Constants shared by the edge middleware and the Node auth code. Keep this file free
// of Node imports: middleware.ts runs in the edge runtime.
export const SESSION_COOKIE = "ma_session";
export const SESSION_DAYS = 90;
