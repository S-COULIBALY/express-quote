import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { ConsentController } from "@/quotation/infrastructure/adapters/controllers/ConsentController";
import { ConsentService } from "@/quotation/application/services/ConsentService";
import { PrismaConsentRepository } from "@/quotation/infrastructure/repositories/PrismaConsentRepository";
import { prisma } from "@/lib/prisma";

// Instance partagée du contrôleur avec injection de dépendances DDD
let controllerInstance: ConsentController | null = null;

function getController(): ConsentController {
  if (!controllerInstance) {
    // Injection de dépendances selon l'architecture DDD
    const consentRepository = new PrismaConsentRepository(prisma);
    const consentService = new ConsentService(consentRepository);

    controllerInstance = new ConsentController(consentService);
  }
  return controllerInstance;
}

export async function POST(request: NextRequest) {
  try {
    const controller = getController();
    const result = await controller.recordConsent(request);
    return result;
  } catch (error) {
    console.error("Error recording consent:", error);
    return NextResponse.json(
      { error: "Failed to record consent" },
      { status: 500 },
    );
  }
}
