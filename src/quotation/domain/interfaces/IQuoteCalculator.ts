import { Money } from '../valueObjects/Money';
import { QuoteContext } from '../valueObjects/QuoteContext';
import { Rule } from '../valueObjects/Rule';
import { Quote } from '../valueObjects/Quote';

export interface IQuoteCalculator {
    /**
     * Calcule le prix pour un contexte donné
     * @param context Le contexte contenant les informations nécessaires au calcul
     * @returns Une promesse contenant le devis calculé
     */
    calculate(context: QuoteContext): Promise<Quote>;
    
    /**
     * Retourne le prix de base avant application des règles
     * @param context Le contexte contenant les informations nécessaires au calcul
     * @returns Le montant de base calculé
     */
    getBasePrice(context: QuoteContext): Money;
    
    /**
     * Ajoute une règle au calculateur
     * @param rule La règle à ajouter
     */
    addRule(rule: Rule): void;
    
    /**
     * Retourne la liste des règles du calculateur
     * @returns Les règles appliquées par ce calculateur
     */
    getRules(): Rule[];
} 