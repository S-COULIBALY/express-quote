import 'reflect-metadata';

/**
 * Décorateur pour marquer une classe comme injectable
 * dans le système d'injection de dépendances.
 */
export function Injectable() {
  return function (target: any) {
    // Simplement marquer la classe comme injectable
    // L'implémentation réelle de l'injection de dépendances
    // serait gérée par un container de services
    Reflect.defineMetadata('injectable', true, target);
    return target;
  };
}

/**
 * Vérifie si une classe est injectable
 */
export function isInjectable(target: any): boolean {
  return Reflect.getMetadata('injectable', target) === true;
} 