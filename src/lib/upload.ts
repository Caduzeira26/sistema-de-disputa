/**
 * Largest logo/crest image accepted. Uploads travel inside a Server Action
 * request, and Vercel caps a request body at 4.5 MB, so this stays under it
 * (see `serverActions.bodySizeLimit` in next.config.ts).
 */
export const MAX_LOGO_BYTES = 3 * 1024 * 1024;
export const MAX_LOGO_LABEL = "3MB";
