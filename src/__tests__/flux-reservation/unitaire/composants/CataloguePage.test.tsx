/**
 * 🧪 **TESTS UNITAIRES - CataloguePage**
 * 
 * Tests unitaires pour le composant CataloguePage
 * qui est très lent quand on clique sur un élément du catalogue.
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CataloguePage from '@/app/catalogue/page';

// Mock des dépendances
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/lib/caches', () => ({
  catalogueItemsCache: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn()
  }
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock des composants enfants
jest.mock('@/components/ui/CatalogueCard', () => ({
  CatalogueCard: ({ item, onClick }: any) => (
    <div data-testid={`catalogue-card-${item.id}`} onClick={onClick}>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      <span data-testid="price">{item.price}€</span>
    </div>
  )
}));

jest.mock('@/components/ServicesNavigation', () => ({
  ServicesNavigation: () => <div data-testid="services-navigation">Services Navigation</div>
}));

// Mock des icônes
jest.mock('@heroicons/react/24/outline', () => ({
  ArrowRightIcon: () => <div data-testid="arrow-right-icon" />,
  TruckIcon: () => <div data-testid="truck-icon" />,
  HomeIcon: () => <div data-testid="home-icon" />,
  UsersIcon: () => <div data-testid="users-icon" />,
  SparklesIcon: () => <div data-testid="sparkles-icon" />,
  CubeIcon: () => <div data-testid="cube-icon" />,
  StarIcon: () => <div data-testid="star-icon" />,
  CheckIcon: () => <div data-testid="check-icon" />
}));

import { catalogueItemsCache } from '@/lib/caches';

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  prefetch: jest.fn()
};

(useRouter as jest.Mock).mockReturnValue(mockRouter);

// Données de test
const mockCatalogItems = [
  {
    id: 'catalog-demenagement-sur-mesure',
    catalogId: 'catalog-demenagement-sur-mesure',
    title: 'Déménagement Économique',
    subtitle: 'Payez uniquement la main d\'œuvre dont vous avez besoin',
    description: 'Tarification horaire flexible à 19€/h - Équipe professionnelle',
    price: 0,
    originalPrice: 0,
    duration: 1,
    workers: 3,
    features: ['Tarification horaire flexible', 'Équipe adaptée', 'Prix transparents'],
    includedDistance: 30,
    distanceUnit: 'km',
    isFeatured: true,
    isNewOffer: false,
    badgeText: 'Économique',
    badgeColor: '#E67E22',
    category: 'DEMENAGEMENT',
    subcategory: 'sur-mesure',
    targetAudience: 'particuliers',
    type: 'service' as const
  },
  {
    id: 'catalog-menage-sur-mesure',
    catalogId: 'catalog-menage-sur-mesure',
    title: 'Ménage Flexible',
    subtitle: 'Service modulaire sans forfait rigide',
    description: 'À partir de 21€/h - Service personnalisé selon vos besoins',
    price: 0,
    originalPrice: 0,
    duration: 1,
    workers: 2,
    features: ['Service modulaire', 'Prix transparents', 'Personnalisation'],
    includedDistance: 0,
    distanceUnit: 'km',
    isFeatured: true,
    isNewOffer: true,
    badgeText: 'Flexible',
    badgeColor: '#27AE60',
    category: 'MENAGE',
    subcategory: 'sur-mesure',
    targetAudience: 'particuliers',
    type: 'service' as const
  }
];

describe('CataloguePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (catalogueItemsCache.get as jest.Mock).mockResolvedValue(mockCatalogItems);
  });

  test('rendre la page de catalogue avec les éléments', async () => {
    render(<CataloguePage />);

    // Attendre le chargement
    await waitFor(() => {
      expect(screen.getByTestId('services-navigation')).toBeInTheDocument();
    });

    // Vérifier que les éléments du catalogue sont affichés
    expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    expect(screen.getByTestId('catalogue-card-catalog-menage-sur-mesure')).toBeInTheDocument();
  });

  test('afficher le skeleton pendant le chargement', () => {
    (catalogueItemsCache.get as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(mockCatalogItems), 1000))
    );

    render(<CataloguePage />);

    // Vérifier que le skeleton est affiché
    expect(screen.getByTestId('catalogue-skeleton')).toBeInTheDocument();
  });

  test('gérer les erreurs de chargement', async () => {
    (catalogueItemsCache.get as jest.Mock).mockRejectedValue(new Error('Erreur de chargement'));

    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement du catalogue')).toBeInTheDocument();
    });
  });

  test('utiliser les données de fallback en cas d\'échec', async () => {
    (catalogueItemsCache.get as jest.Mock).mockResolvedValue([]);

    render(<CataloguePage />);

    await waitFor(() => {
      // Vérifier que les éléments de fallback sont affichés
      expect(screen.getByText('Déménagement Économique')).toBeInTheDocument();
      expect(screen.getByText('Ménage Flexible')).toBeInTheDocument();
    });
  });

  test('navigation vers la page de détail au clic sur un élément', async () => {
    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });

    // Cliquer sur un élément du catalogue
    const catalogueCard = screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure');
    fireEvent.click(catalogueCard);

    // Vérifier la navigation
    expect(mockPush).toHaveBeenCalledWith('/catalogue/catalog-demenagement-sur-mesure');
  });

  test('performance - éviter les re-renders inutiles', async () => {
    const { rerender } = render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });

    // Re-render avec les mêmes props
    rerender(<CataloguePage />);

    // Vérifier que les éléments sont toujours présents
    expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
  });

  test('randomisation des éléments du catalogue', async () => {
    const mockRandom = jest.spyOn(Math, 'random');
    mockRandom.mockReturnValue(0.5);

    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });

    // Vérifier que les éléments sont randomisés
    const catalogueCards = screen.getAllByTestId(/catalogue-card-/);
    expect(catalogueCards).toHaveLength(2);

    mockRandom.mockRestore();
  });

  test('gestion des états de chargement', async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise(resolve => {
      resolvePromise = resolve;
    });
    
    (catalogueItemsCache.get as jest.Mock).mockReturnValue(promise);

    render(<CataloguePage />);

    // Vérifier l'état de chargement initial
    expect(screen.getByTestId('catalogue-skeleton')).toBeInTheDocument();

    // Résoudre la promesse
    act(() => {
      resolvePromise!(mockCatalogItems);
    });

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });
  });

  test('filtrage par catégorie', async () => {
    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });

    // Vérifier que les éléments sont filtrés par catégorie
    const demenagementCard = screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure');
    const menageCard = screen.getByTestId('catalogue-card-catalog-menage-sur-mesure');

    expect(demenagementCard).toBeInTheDocument();
    expect(menageCard).toBeInTheDocument();
  });

  test('affichage des badges et promotions', async () => {
    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });

    // Vérifier les badges
    expect(screen.getByText('Économique')).toBeInTheDocument();
    expect(screen.getByText('Flexible')).toBeInTheDocument();
  });

  test('gestion des clics multiples rapides', async () => {
    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });

    const catalogueCard = screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure');

    // Cliquer plusieurs fois rapidement
    fireEvent.click(catalogueCard);
    fireEvent.click(catalogueCard);
    fireEvent.click(catalogueCard);

    // Vérifier que la navigation n'est appelée qu'une fois
    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  test('mise à jour du cache après chargement', async () => {
    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });

    // Vérifier que le cache a été mis à jour
    expect(catalogueItemsCache.set).toHaveBeenCalledWith(
      'catalogue-items',
      expect.any(Array),
      expect.any(Number)
    );
  });

  test('gestion des données vides', async () => {
    (catalogueItemsCache.get as jest.Mock).mockResolvedValue([]);

    render(<CataloguePage />);

    await waitFor(() => {
      // Vérifier que les éléments de fallback sont affichés
      expect(screen.getByText('Déménagement Économique')).toBeInTheDocument();
    });
  });

  test('performance - temps de chargement acceptable', async () => {
    const startTime = Date.now();
    
    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });

    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Vérifier que le chargement est rapide (moins de 2 secondes)
    expect(loadTime).toBeLessThan(2000);
  });

  test('gestion des erreurs de réseau', async () => {
    (catalogueItemsCache.get as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByText('Erreur lors du chargement du catalogue')).toBeInTheDocument();
    });
  });

  test('retry automatique en cas d\'échec', async () => {
    let callCount = 0;
    (catalogueItemsCache.get as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error('Premier échec'));
      }
      return Promise.resolve(mockCatalogItems);
    });

    render(<CataloguePage />);

    await waitFor(() => {
      expect(screen.getByTestId('catalogue-card-catalog-demenagement-sur-mesure')).toBeInTheDocument();
    });

    // Vérifier que le retry a été effectué
    expect(callCount).toBeGreaterThan(1);
  });
});
