import { NextRequest, NextResponse } from 'next/server';
import { QuoteController } from '../../../quotation/application/controllers/QuoteController';
import { QuoteFactory } from '../../../quotation/application/factories/QuoteFactory';
import { ValidationError } from '../../../quotation/interfaces/http/ValidationError';
import { QuoteCalculationError } from '../../../quotation/interfaces/http/errors';
import { createPool } from '../../../config/database';
import { RuleService } from '../../../quotation/application/services/RuleService';
import { RuleMapper } from '../../../quotation/domain/mappers/RuleMapper';
import { Rule } from '../../../quotation/domain/valueObjects/Rule';

// Initialisation des services
const dbPool = createPool();
const ruleService = new RuleService(dbPool);
const ruleMapper = new RuleMapper();

// Variable pour stocker les instances initialisées
let quoteFactory: QuoteFactory;
let quoteController: QuoteController;

// Fonction d'initialisation asynchrone
async function initializeServices() {
    if (!quoteFactory || !quoteController) {
        const rules = await ruleService.getAllRules();
        quoteFactory = new QuoteFactory(rules.map(rule => ruleMapper.toBusinessRule(rule) as Rule));
        quoteController = new QuoteController(quoteFactory);
    }
    return { quoteFactory, quoteController };
}

export async function POST(request: NextRequest) {
    try {
        // Initialisation des services si nécessaire
        const { quoteController } = await initializeServices();
        
        const data = await request.json();
        const quote = await quoteController.calculateQuote(data);
        
        return NextResponse.json({
            success: true,
            data: quote
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 400 });
        }

        if (error instanceof QuoteCalculationError) {
            return NextResponse.json({
                success: false,
                error: error.message
            }, { status: 422 });
        }

        console.error('Unexpected error:', error);
        return NextResponse.json({
            success: false,
            error: 'An unexpected error occurred'
        }, { status: 500 });
    }
} 