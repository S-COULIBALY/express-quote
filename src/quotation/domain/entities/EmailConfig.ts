export class EmailConfig {
  constructor(
    public readonly smtpHost: string,
    public readonly smtpPort: number,
    public readonly smtpUser: string,
    public readonly smtpPassword: string,
    public readonly emailFrom: string,
    public readonly salesTeamEmails: string[],
    public readonly accountingEmails: string[],
    public readonly professionalsEmails: string[],
    public readonly notificationsEmails: string[],
    public readonly externalProviders: ExternalProvider[],
    public readonly emailTypes: Record<string, EmailTypeConfig>,
    public readonly reminderDays: number[]
  ) {}
}

export class ExternalProvider {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly category: string,
    public readonly isActive: boolean
  ) {}
}

export class EmailTypeConfig {
  constructor(
    public readonly internal: string[],
    public readonly external: string[],
    public readonly includeClient: boolean
  ) {}
}

export class EmailTemplate {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly subject: string,
    public readonly htmlContent: string,
    public readonly textContent: string,
    public readonly type: string,
    public readonly variables: Record<string, any> | null,
    public readonly isActive: boolean
  ) {}
} 