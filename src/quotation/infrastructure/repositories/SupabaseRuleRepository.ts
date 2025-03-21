import { IPersistedRule } from '@/quotation/domain/interfaces/IRule';
import { IRuleRepository } from '@/quotation/domain/interfaces/IRuleRepository';
import { ServiceType } from '../../domain/entities/Service';
import { supabaseAdmin } from '@/lib/supabase';

export class SupabaseRuleRepository implements IRuleRepository {
  private readonly TABLE_NAME = 'business_rules';

  async findByActivityType(activityType: string): Promise<IPersistedRule[]> {
    const { data, error } = await supabaseAdmin
      .from(this.TABLE_NAME)
      .select('*')
      .eq('activity_type', activityType)
      .lte('valid_from', new Date().toISOString())
      .or(`valid_to.is.null,valid_to.gt.${new Date().toISOString()}`)
      .order('version', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching rules by activity type:', error);
      throw new Error(`Failed to fetch rules: ${error.message}`);
    }

    if (!data || data.length === 0) return [];

    return this.deserializeRules(data[0]);
  }

  async findById(id: number): Promise<IPersistedRule | null> {
    const { data, error } = await supabaseAdmin
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching rule by id:', error);
      throw new Error(`Failed to fetch rule: ${error.message}`);
    }

    if (!data) return null;

    return this.deserializeRules(data)[0];
  }

  async save(rule: IPersistedRule): Promise<void> {
    // Obtenir la version actuelle la plus élevée
    const { data: versionData, error: versionError } = await supabaseAdmin
      .from(this.TABLE_NAME)
      .select('version')
      .eq('activity_type', rule.activityType)
      .order('version', { ascending: false })
      .limit(1);

    if (versionError) {
      console.error('Error getting latest version:', versionError);
      throw new Error(`Failed to get latest version: ${versionError.message}`);
    }

    const nextVersion = versionData && versionData.length > 0 
      ? (versionData[0].version + 1) 
      : 1;

    // Insérer la nouvelle règle
    const { error } = await supabaseAdmin
      .from(this.TABLE_NAME)
      .insert({
        activity_type: rule.activityType,
        rules: this.serializeRule(rule),
        version: nextVersion,
        valid_from: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving rule:', error);
      throw new Error(`Failed to save rule: ${error.message}`);
    }
  }

  async update(rule: IPersistedRule): Promise<void> {
    if (!rule.id) throw new Error('Cannot update rule without id');

    // Mettre à jour la règle existante (marquer comme obsolète)
    const { error: updateError } = await supabaseAdmin
      .from(this.TABLE_NAME)
      .update({
        rules: this.serializeRule(rule),
        valid_to: new Date().toISOString()
      })
      .eq('id', rule.id);

    if (updateError) {
      console.error('Error updating rule:', updateError);
      throw new Error(`Failed to update rule: ${updateError.message}`);
    }

    // Insérer nouvelle version
    await this.save(rule);
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from(this.TABLE_NAME)
      .update({ valid_to: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting rule:', error);
      throw new Error(`Failed to delete rule: ${error.message}`);
    }
  }

  // Fonctions utilitaires pour la sérialisation/désérialisation
  private serializeRule(rule: IPersistedRule): any {
    return JSON.stringify(rule);
  }

  private deserializeRules(row: any): IPersistedRule[] {
    try {
      const rulesData = typeof row.rules === 'string' 
        ? JSON.parse(row.rules) 
        : row.rules;
      
      // Si c'est un tableau, retourner directement
      if (Array.isArray(rulesData)) {
        return rulesData.map(r => ({
          ...r,
          id: row.id
        }));
      }
      
      // Sinon, emballer dans un tableau
      return [{
        ...rulesData,
        id: row.id
      }];
    } catch (error) {
      console.error('Error deserializing rules:', error);
      return [];
    }
  }

  // Méthodes additionnelles pour les nouveaux cas d'utilisation
  async findByServiceType(serviceType: ServiceType): Promise<IPersistedRule[]> {
    const { data, error } = await supabaseAdmin
      .from('rules')
      .select('*')
      .eq('service_type', serviceType);

    if (error) {
      console.error('Error fetching rules by service type:', error);
      throw new Error(`Failed to fetch rules: ${error.message}`);
    }

    return data?.map(this.mapToRule) || [];
  }

  async findAll(): Promise<IPersistedRule[]> {
    const { data, error } = await supabaseAdmin
      .from('rules')
      .select('*');

    if (error) {
      console.error('Error fetching all rules:', error);
      throw new Error(`Failed to fetch rules: ${error.message}`);
    }

    return data?.map(this.mapToRule) || [];
  }

  private mapToRule(row: any): IPersistedRule {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      value: row.value,
      condition: row.condition,
      activityType: row.service_type // Mapper service_type vers activityType
    };
  }
} 