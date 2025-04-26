export interface IRuleService {
  getRulesForActivity(activityType: string): Promise<any[]>;
  saveRules(activityType: string, rules: any[]): Promise<void>;
} 