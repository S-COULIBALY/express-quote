# Express Quote - Système de calcul de prix

## Modifications récentes

Nous avons apporté plusieurs modifications importantes au système de calcul de prix pour le rendre plus cohérent et prévisible:

### 1. Clarification de la terminologie des prix

Le système utilise désormais une terminologie claire et cohérente pour les différents types de prix:

- **defaultPrice**: Prix unitaire de base sans considération des quantités, durées, etc.
- **basePrice**: Prix ajusté après multiplication par les quantités, durées, nombre de travailleurs
- **finalPrice**: Prix final après application des réductions et majorations

### 2. Correction de la règle "Tarif minimum"

La règle "Tarif minimum" a été modifiée pour fonctionner comme un plancher plutôt que comme une réduction:

- Le tarif minimum est fixé à 90% du prix de base (basePrice)
- Cette règle s'assure que les réductions ne font jamais descendre le prix final en dessous de ce seuil
- Cela évite les situations où le prix final est trop bas ou nul

### 3. Amélioration du RuleEngine

Le moteur de règles a été amélioré pour:

- Traiter correctement les règles définissant un prix minimum
- Appliquer les réductions de manière cohérente
- Documenter clairement l'ordre d'application des règles
- Éviter les erreurs liées aux pourcentages élevés

### 4. Amélioration de l'API

L'API `/api/bookings/calculate` a été mise à jour pour:

- Utiliser la nouvelle terminologie des prix
- Renommer automatiquement `basePrice` en `defaultPrice` pour la compatibilité
- Retourner tous les types de prix dans la réponse

## Comment tester

Pour tester ces modifications, exécutez une requête comme:

```bash
curl -X POST http://localhost:3000/api/bookings/calculate \
  -H "Content-Type: application/json" \
  -d '{"serviceType":"SERVICE","defaultPrice":200,"duration":10,"workers":4}'
```

Le système devrait maintenant retourner un résultat où:
- Le prix final n'est jamais inférieur à 90% du prix de base
- Les réductions sont correctement appliquées
- Les différents prix sont clairement identifiés dans la réponse 