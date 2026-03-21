/** Public path and filename for the built-in diploma background (see `web/public/diplomas/`). */
export const DEFAULT_DIPLOMA_TEMPLATE_PUBLIC_PATH = "/diplomas/default.pdf";
export const DEFAULT_DIPLOMA_TEMPLATE_FILENAME = "default.pdf";

/** Thrown from `useCommunityDiplomaTemplateBytes` when the default asset HTTP fetch fails (e.g. 404). */
export const DIPLOMA_TEMPLATE_ERR_DEFAULT_ASSET = "DIPLOMA_TEMPLATE_DEFAULT_ASSET_MISSING";
/** Thrown when the API reports no stored PDF for a community flagged with a custom template. */
export const DIPLOMA_TEMPLATE_ERR_CUSTOM_NOT_FOUND = "DIPLOMA_TEMPLATE_CUSTOM_NOT_FOUND";
