function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseSecretKey() {
    return required("SUPABASE_SECRET_KEY");
  },
  get sessionCookieName() {
    return process.env.SESSION_COOKIE_NAME || "bn_session";
  },
  get googleSheetsWebhookUrl() {
    return process.env.GOOGLE_SHEETS_WEBHOOK_URL || "";
  },
};
