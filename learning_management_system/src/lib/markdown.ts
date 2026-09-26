import { defaultSchema } from "rehype-sanitize";

/**
 * Strict sanitization schema for user-provided markdown.
 * - Strips script tags, style tags, object tags, and event handlers.
 * - Strips iframes, forms, and embedded applets.
 * - Forces noopener, noreferrer, and nofollow on all anchor links.
 */
export const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    a: [
      ...(defaultSchema.attributes?.a || []),
      ["rel", "noopener", "noreferrer", "nofollow"],
      ["target", "_blank"],
    ],
  },
  tagNames: defaultSchema.tagNames?.filter(
    (tag) => !["script", "style", "iframe", "object", "embed", "form", "input"].includes(tag)
  ),
};
