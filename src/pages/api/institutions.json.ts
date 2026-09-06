import type { APIRoute } from "astro";
import { institutionsPayload } from "../../lib/api";
import { siteOrigin } from "../../lib/paths";

export const GET: APIRoute = (context) =>
  Response.json(institutionsPayload(siteOrigin(context.site)));
