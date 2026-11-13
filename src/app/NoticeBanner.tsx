// NoticeBanner: a notice under the header in Scrappy's slim style (ADR-0012): a rounded box lined up with the content,
// everything centered, its border tinted by its tone. Updates are accent, projects that don't match warning, errors
// danger, a done notice success.

import { Banner, type BannerProps } from "iro-ui";

// ── Types ─────────────────────────────────
interface Props extends Omit<BannerProps, "tone" | "className"> {
  tone: "accent" | "success" | "warning" | "danger";
}

// ── Public API ────────────────────────────
/** iro-ui's Banner in the app's notice style. */
export function NoticeBanner({ tone, ...rest }: Props) {
  return <Banner tone={tone} className="notice-banner" data-notice={tone} {...rest} />;
}
