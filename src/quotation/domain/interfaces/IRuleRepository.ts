import { IRule } from './IRule';

export interface IRuleRepository {
  findByActivityType(activityType: string): Promise<IRule[]>;
  save(rule: IRule): Promise<void>;
  findById(id: number): Promise<IRule | null>;
  update(rule: IRule): Promise<void>;
  delete(id: number): Promise<void>;
} 