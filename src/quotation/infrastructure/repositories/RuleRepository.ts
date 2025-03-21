import { Pool } from 'pg';
import { IRule } from '@/quotation/domain/interfaces/IRule';
import { IRuleRepository } from '@/quotation/domain/interfaces/IRuleRepository';
import { ServiceType } from '../../domain/entities/Service';

export class RuleRepository implements IRuleRepository {
  constructor(private dbClient: Pool) {}

  async findByActivityType(activityType: string): Promise<IRule[]> {
    const query = `
      SELECT id, activity_type, rules, version, valid_from, valid_to
      FROM business_rules 
      WHERE activity_type = $1 
      AND valid_from <= NOW() 
      AND (valid_to IS NULL OR valid_to > NOW())
      ORDER BY version DESC 
      LIMIT 1
    `;

    const result = await this.dbClient.query(query, [activityType]);
    if (!result.rows[0]) return [];

    return this.deserializeRules(result.rows[0]);
  }

  async findById(id: number): Promise<IRule | null> {
    const query = `
      SELECT id, activity_type, rules, version, valid_from, valid_to
      FROM business_rules 
      WHERE id = $1
    `;

    const result = await this.dbClient.query(query, [id]);
    if (!result.rows[0]) return null;

    return this.deserializeRules(result.rows[0])[0];
  }

  async save(rule: IRule): Promise<void> {
    const query = `
      INSERT INTO business_rules (activity_type, rules, version, valid_from)
      VALUES ($1, $2, (
        SELECT COALESCE(MAX(version), 0) + 1
        FROM business_rules
        WHERE activity_type = $1
      ), NOW())
    `;

    await this.dbClient.query(query, [
      rule.activityType,
      this.serializeRule(rule)
    ]);
  }

  async update(rule: IRule): Promise<void> {
    if (!rule.id) throw new Error('Cannot update rule without id');

    const query = `
      UPDATE business_rules 
      SET rules = $1, 
          valid_to = NOW()
      WHERE id = $2
    `;

    await this.dbClient.query(query, [
      this.serializeRule(rule),
      rule.id
    ]);

    // Insert new version
    await this.save(rule);
  }

  async delete(id: number): Promise<void> {
    const query = `
      UPDATE business_rules 
      SET valid_to = NOW()
      WHERE id = $1
    `;

    await this.dbClient.query(query, [id]);
  }

  private serializeRule(rule: IRule): any {
    return {
      condition: rule.condition.toString(),
      apply: rule.apply.toString(),
      description: rule.description
    };
  }

  private deserializeRules(row: any): IRule[] {
    const rules = row.rules;
    return rules.map((r: any) => ({
      id: row.id,
      activityType: row.activity_type,
      condition: new Function('context', r.condition),
      apply: new Function('price', 'context', r.apply),
      description: r.description,
      version: row.version,
      validFrom: row.valid_from,
      validTo: row.valid_to
    }));
  }

  async findByServiceType(serviceType: ServiceType): Promise<IRule[]> {
    const result = await this.dbClient.query(
      'SELECT * FROM rules WHERE service_type = $1',
      [serviceType]
    );
    return result.rows.map(this.mapToRule);
  }

  async findAll(): Promise<IRule[]> {
    const result = await this.dbClient.query('SELECT * FROM rules');
    return result.rows.map(this.mapToRule);
  }

  async save(rule: IRule & { serviceType: ServiceType }): Promise<void> {
    await this.dbClient.query(
      `INSERT INTO rules (
        name, 
        type, 
        value, 
        condition, 
        priority, 
        service_type
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (name, service_type) 
      DO UPDATE SET 
        type = EXCLUDED.type,
        value = EXCLUDED.value,
        condition = EXCLUDED.condition,
        priority = EXCLUDED.priority`,
      [
        rule.name,
        rule.type,
        rule.value,
        rule.condition,
        rule.priority,
        rule.serviceType
      ]
    );
  }

  private mapToRule(row: any): IRule {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      value: row.value,
      condition: row.condition,
      priority: row.priority
    };
  }
} 