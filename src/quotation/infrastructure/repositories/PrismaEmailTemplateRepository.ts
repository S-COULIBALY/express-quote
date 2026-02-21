import type { PrismaClient } from "@prisma/client";
import { injectable } from "tsyringe";
import { IEmailTemplateRepository } from "../../domain/repositories/IEmailConfigRepository";
import { EmailTemplate } from "../../domain/entities/EmailConfig";
import { prisma } from "@/lib/prisma";

@injectable()
export class PrismaEmailTemplateRepository implements IEmailTemplateRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  public async getTemplates(): Promise<EmailTemplate[]> {
    try {
      const templates = await this.prisma.$queryRaw`
        SELECT * FROM "EmailTemplate" WHERE "isActive" = true
      `;

      return Array.isArray(templates)
        ? templates.map((t: any) => this.mapToEmailTemplate(t))
        : [];
    } catch (error) {
      console.error("Erreur lors de la récupération des templates:", error);
      return [];
    }
  }

  public async getTemplateByType(type: string): Promise<EmailTemplate | null> {
    try {
      const templates = await this.prisma.$queryRaw`
        SELECT * FROM "EmailTemplate" WHERE "type" = ${type}
      `;

      if (Array.isArray(templates) && templates.length > 0) {
        return this.mapToEmailTemplate(templates[0]);
      }

      return null;
    } catch (error) {
      console.error(
        `Erreur lors de la récupération du template de type ${type}:`,
        error,
      );
      return null;
    }
  }

  public async updateTemplate(template: EmailTemplate): Promise<EmailTemplate> {
    try {
      let result;

      if (template.id) {
        // Mise à jour d'un template existant
        result = await this.prisma.$queryRaw`
          UPDATE "EmailTemplate"
          SET "name" = ${template.name},
              "subject" = ${template.subject},
              "htmlContent" = ${template.htmlContent},
              "textContent" = ${template.textContent},
              "variables" = ${template.variables ? JSON.stringify(template.variables) : null},
              "isActive" = ${template.isActive},
              "updatedAt" = NOW()
          WHERE "id" = ${template.id}
          RETURNING *
        `;
      } else {
        // Création ou mise à jour basée sur le type
        const existingTemplate = await this.getTemplateByType(template.type);

        if (existingTemplate) {
          // Mise à jour basée sur le type
          result = await this.prisma.$queryRaw`
            UPDATE "EmailTemplate"
            SET "name" = ${template.name},
                "subject" = ${template.subject},
                "htmlContent" = ${template.htmlContent},
                "textContent" = ${template.textContent},
                "variables" = ${template.variables ? JSON.stringify(template.variables) : null},
                "isActive" = ${template.isActive},
                "updatedAt" = NOW()
            WHERE "type" = ${template.type}
            RETURNING *
          `;
        } else {
          // Création d'un nouveau template
          result = await this.prisma.$queryRaw`
            INSERT INTO "EmailTemplate" (
              "name", "subject", "htmlContent", "textContent", "type", 
              "variables", "isActive", "createdAt", "updatedAt"
            )
            VALUES (
              ${template.name},
              ${template.subject},
              ${template.htmlContent},
              ${template.textContent},
              ${template.type},
              ${template.variables ? JSON.stringify(template.variables) : null},
              ${template.isActive},
              NOW(),
              NOW()
            )
            RETURNING *
          `;
        }
      }

      if (Array.isArray(result) && result.length > 0) {
        return this.mapToEmailTemplate(result[0]);
      }

      throw new Error("Échec de la mise à jour du template");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du template:", error);
      throw error;
    }
  }

  private mapToEmailTemplate(data: any): EmailTemplate {
    return new EmailTemplate(
      data.id,
      data.name,
      data.subject,
      data.htmlContent,
      data.textContent,
      data.type,
      data.variables,
      data.isActive,
    );
  }
}
