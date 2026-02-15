const envBase = import.meta.env.VITE_API_BASE;
export const API_BASE = envBase && envBase.trim().length > 0 ? envBase : "";
