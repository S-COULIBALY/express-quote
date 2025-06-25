import { logger } from '@/lib/logger';

const teamLogger = logger.withContext('TeamService');

export class TeamService {
    private teamPhones: string[];

    constructor() {
        // Dans un cas réel, ces numéros seraient chargés depuis une base de données
        this.teamPhones = [];
    }

    /**
     * Récupère les numéros de téléphone de l'équipe
     */
    public async getTeamPhones(): Promise<string[]> {
        return this.teamPhones;
    }

    /**
     * Ajoute un membre à l'équipe
     */
    public async addTeamMember(phone: string): Promise<void> {
        if (!this.teamPhones.includes(phone)) {
            this.teamPhones.push(phone);
            teamLogger.info('Nouveau membre ajouté à l\'équipe', { phone });
        }
    }

    /**
     * Retire un membre de l'équipe
     */
    public async removeTeamMember(phone: string): Promise<void> {
        const index = this.teamPhones.indexOf(phone);
        if (index > -1) {
            this.teamPhones.splice(index, 1);
            teamLogger.info('Membre retiré de l\'équipe', { phone });
        }
    }
} 