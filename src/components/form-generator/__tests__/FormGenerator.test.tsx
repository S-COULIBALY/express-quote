import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FormGenerator } from "../FormGenerator";
import { CatalogueMovingItemPreset } from "../presets/catalogueMovingItem-service/catalogueMovingItemPresets";

describe("FormGenerator", () => {
  // Configuration de base pour les tests
  const mockConfig = {
    title: "Test Form",
    fields: [
      {
        name: "testField",
        label: "Test Field",
        type: "text",
        required: true,
      },
    ],
  };

  // Tests de rendu de base
  describe("Basic Rendering", () => {
    it("renders without crashing", () => {
      render(<FormGenerator config={mockConfig} />);
      expect(screen.getByText("Test Form")).toBeInTheDocument();
    });

    it("renders error message when no config provided", () => {
      render(<FormGenerator config={null} />);
      expect(
        screen.getByText("Erreur: Configuration manquante"),
      ).toBeInTheDocument();
    });

    it("renders all fields from config", () => {
      render(<FormGenerator config={mockConfig} />);
      expect(screen.getByLabelText("Test Field")).toBeInTheDocument();
    });
  });

  // Tests des presets catalogue
  describe("Catalogue Presets", () => {
    it("renders moving service preset correctly", () => {
      const config = {
        ...mockConfig,
        preset: CatalogueMovingItemPreset,
      };
      render(<FormGenerator config={config} />);

      // Vérifier les champs spécifiques au déménagement
      expect(
        screen.getByLabelText(/date du déménagement/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/adresse de départ/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/adresse d'arrivée/i)).toBeInTheDocument();
    });

    it("renders cleaning service preset correctly", () => {
      const config = {
        ...mockConfig,
        preset: CatalogueCleaningItemPreset,
      };
      render(<FormGenerator config={config} />);

      // Vérifier les champs spécifiques au nettoyage
      expect(screen.getByLabelText(/date du service/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/surface/i)).toBeInTheDocument();
    });
  });

  // Tests des layouts
  describe("Layouts", () => {
    it("renders default layout correctly", () => {
      render(<FormGenerator config={mockConfig} />);
      expect(screen.getByRole("form")).toHaveClass("space-y-4");
    });

    it("renders sidebar layout correctly", () => {
      const config = {
        ...mockConfig,
        layout: {
          type: "sidebar",
          options: {
            showPriceCalculation: true,
          },
        },
      };
      render(<FormGenerator config={config} />);
      expect(screen.getByTestId("sidebar-layout")).toBeInTheDocument();
    });

    it("renders service-summary layout correctly", () => {
      const config = {
        ...mockConfig,
        layout: {
          type: "service-summary",
          serviceSummaryOptions: {
            serviceDetails: {
              id: "1",
              name: "Test Service",
              price: 100,
              duration: 120,
              workers: 2,
            },
            quoteDetails: {
              id: "1",
              calculatedPrice: 100,
            },
          },
        },
      };
      render(<FormGenerator config={config} />);
      expect(screen.getByTestId("service-summary")).toBeInTheDocument();
    });
  });

  // Tests des interactions utilisateur
  describe("User Interactions", () => {
    it("handles field changes correctly", async () => {
      const onChange = jest.fn();
      render(
        <FormGenerator
          config={{
            ...mockConfig,
            onChange,
          }}
        />,
      );

      const input = screen.getByLabelText("Test Field");
      fireEvent.change(input, { target: { value: "test value" } });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          "testField",
          "test value",
          expect.any(Object),
        );
      });
    });

    it("handles form submission correctly", async () => {
      const onSubmit = jest.fn();
      render(
        <FormGenerator
          config={{
            ...mockConfig,
            onSubmit,
          }}
        />,
      );

      const input = screen.getByLabelText("Test Field");
      fireEvent.change(input, { target: { value: "test value" } });

      const submitButton = screen.getByRole("button", { name: /valider/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          testField: "test value",
        });
      });
    });

    it("shows loading state during submission", async () => {
      const onSubmit = jest.fn(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
      render(
        <FormGenerator
          config={{
            ...mockConfig,
            onSubmit,
            isLoading: true,
            loadingText: "Envoi en cours...",
          }}
        />,
      );

      const submitButton = screen.getByRole("button", {
        name: /envoi en cours/i,
      });
      expect(submitButton).toBeDisabled();
    });
  });

  // Tests des styles et de la présentation
  describe("Styles and Presentation", () => {
    it("applies custom styles correctly", () => {
      const config = {
        ...mockConfig,
        className: "custom-form-class",
        customStyles: ".custom-form-class { background: red; }",
      };
      render(<FormGenerator config={config} />);
      expect(screen.getByTestId("form-styles")).toHaveTextContent(
        config.customStyles,
      );
    });

    it("applies preset styles correctly", () => {
      const config = {
        ...mockConfig,
        preset: CatalogueMovingItemPreset,
      };
      render(<FormGenerator config={config} />);
      expect(screen.getByTestId("form-styles")).toHaveTextContent(
        CatalogueMovingItemPreset.styles,
      );
    });
  });

  // Tests de performance
  describe("Performance", () => {
    it("memoizes form styles correctly", () => {
      const { rerender } = render(<FormGenerator config={mockConfig} />);
      const initialStyles = screen.getByTestId("form-styles").textContent;

      rerender(<FormGenerator config={mockConfig} />);
      const rerenderedStyles = screen.getByTestId("form-styles").textContent;

      expect(initialStyles).toBe(rerenderedStyles);
    });

    it("handles large forms efficiently", () => {
      const largeConfig = {
        ...mockConfig,
        fields: Array.from({ length: 100 }, (_, i) => ({
          name: `field${i}`,
          label: `Field ${i}`,
          type: "text",
        })),
      };

      const start = performance.now();
      render(<FormGenerator config={largeConfig} />);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Rendu en moins de 100ms
      expect(screen.getAllByRole("textbox")).toHaveLength(100);
    });
  });

  // Tests d'accessibilité
  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      render(<FormGenerator config={mockConfig} />);
      expect(screen.getByLabelText("Test Field")).toHaveAttribute(
        "aria-required",
        "true",
      );
    });

    it("shows error messages to screen readers", async () => {
      render(
        <FormGenerator
          config={{
            ...mockConfig,
            validation: {
              fields: {
                testField: [
                  {
                    type: "required",
                    message: "Ce champ est requis",
                  },
                ],
              },
            },
          }}
        />,
      );

      const input = screen.getByLabelText("Test Field");
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Ce champ est requis",
        );
      });
    });
  });

  // Tests de compatibilité
  describe("Compatibility", () => {
    it("works with legacy presets", () => {
      const legacyConfig = {
        ...mockConfig,
        fields: [
          {
            name: "legacyField",
            type: "text",
            validation: {
              required: true,
            },
          },
        ],
      };
      render(<FormGenerator config={legacyConfig} />);
      expect(screen.getByLabelText("legacyField")).toBeInTheDocument();
    });

    it("handles missing optional props gracefully", () => {
      const minimalConfig = {
        fields: [
          {
            name: "minimalField",
            type: "text",
          },
        ],
      };
      render(<FormGenerator config={minimalConfig} />);
      expect(screen.getByLabelText("minimalField")).toBeInTheDocument();
    });
  });
});
