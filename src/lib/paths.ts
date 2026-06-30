const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/** Build a site-absolute href that respects the configured base path. */
export function href(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}` || "/";
}

/** Permalink for an institution's page. */
export function universityHref(slug: string): string {
  return href(`/${slug}`);
}
