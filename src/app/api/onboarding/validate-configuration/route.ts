import { NextRequest, NextResponse } from "next/server";
import { InMemorySimEsimCatalogRepository } from "@/lib/db/InMemorySimEsimCatalogRepository";

const simEsimRepo = new InMemorySimEsimCatalogRepository();

function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  const res = NextResponse.json(data, init);
  const original = res.json.bind(res);
  let cached: Promise<unknown> | undefined;
  (res as NextResponse & { json: () => Promise<unknown> }).json = () => {
    if (!cached) cached = original();
    return cached;
  };
  return res;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(
      { error: "INVALID_BODY", message: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("simEsimOfferId" in body) ||
    !("planId" in body) ||
    typeof (body as Record<string, unknown>).simEsimOfferId !== "string" ||
    !((body as Record<string, unknown>).simEsimOfferId as string) ||
    typeof (body as Record<string, unknown>).planId !== "string" ||
    !((body as Record<string, unknown>).planId as string)
  ) {
    return jsonResponse(
      {
        error: "MISSING_FIELDS",
        message: "Both 'simEsimOfferId' and 'planId' are required.",
      },
      { status: 400 }
    );
  }

  const { simEsimOfferId, planId } = body as {
    simEsimOfferId: string;
    planId: string;
  };

  const offer = simEsimRepo.findById(simEsimOfferId);
  if (!offer) {
    return jsonResponse(
      {
        error: "OFFER_NOT_FOUND",
        message: `SIM/eSIM offer '${simEsimOfferId}' does not exist.`,
      },
      { status: 404 }
    );
  }

  if (!offer.planIds.includes(planId)) {
    return jsonResponse(
      {
        valid: false,
        reason: `Plan '${planId}' is not compatible with offer '${simEsimOfferId}'. Compatible plans: ${offer.planIds.join(", ")}.`,
      },
      { status: 422 }
    );
  }

  return jsonResponse({ valid: true });
}
