import {
  validateField,
  validateForm,
  validateDependencies,
  validateCustomRules,
} from "../validation";

import type {
  ValidationRule,
  FieldValidation,
  FormValidation,
  FieldDependency,
  CustomValidation,
} from "../types";

describe("Form Validation", () => {
  // Tests de validation de champ
  describe("Field Validation", () => {
    describe("Required Fields", () => {
      const requiredRule: ValidationRule = {
        type: "required",
        message: "Ce champ est requis",
      };

      it("validates required field with value", () => {
        const result = validateField("test", [requiredRule]);
        expect(result).toEqual([]);
      });

      it("validates required field without value", () => {
        const result = validateField("", [requiredRule]);
        expect(result).toEqual(["Ce champ est requis"]);
      });

      it("validates required field with null", () => {
        const result = validateField(null, [requiredRule]);
        expect(result).toEqual(["Ce champ est requis"]);
      });

      it("validates required field with undefined", () => {
        const result = validateField(undefined, [requiredRule]);
        expect(result).toEqual(["Ce champ est requis"]);
      });
    });

    describe("Email Validation", () => {
      const emailRule: ValidationRule = {
        type: "email",
        message: "Email invalide",
      };

      it("validates correct email", () => {
        const result = validateField("test@example.com", [emailRule]);
        expect(result).toEqual([]);
      });

      it("validates incorrect email", () => {
        const result = validateField("invalid-email", [emailRule]);
        expect(result).toEqual(["Email invalide"]);
      });

      it("validates email with special characters", () => {
        const result = validateField("test+alias@sub.example.com", [emailRule]);
        expect(result).toEqual([]);
      });
    });

    describe("Phone Validation", () => {
      const phoneRule: ValidationRule = {
        type: "phone",
        pattern: /^(\+33|0)[1-9](\d{2}){4}$/,
        message: "Numéro de téléphone invalide",
      };

      it("validates correct French phone number", () => {
        const validNumbers = ["0123456789", "+33123456789", "0612345678"];

        validNumbers.forEach((number) => {
          const result = validateField(number, [phoneRule]);
          expect(result).toEqual([]);
        });
      });

      it("validates incorrect phone numbers", () => {
        const invalidNumbers = ["012345", "+331234567890", "abc1234567"];

        invalidNumbers.forEach((number) => {
          const result = validateField(number, [phoneRule]);
          expect(result).toEqual(["Numéro de téléphone invalide"]);
        });
      });
    });

    describe("Number Validation", () => {
      const numberRules: ValidationRule[] = [
        {
          type: "min",
          value: 0,
          message: "Le nombre doit être positif",
        },
        {
          type: "max",
          value: 100,
          message: "Le nombre doit être inférieur à 100",
        },
      ];

      it("validates numbers within range", () => {
        const result = validateField(50, numberRules);
        expect(result).toEqual([]);
      });

      it("validates numbers below minimum", () => {
        const result = validateField(-1, numberRules);
        expect(result).toEqual(["Le nombre doit être positif"]);
      });

      it("validates numbers above maximum", () => {
        const result = validateField(101, numberRules);
        expect(result).toEqual(["Le nombre doit être inférieur à 100"]);
      });

      it("validates non-numeric values", () => {
        const result = validateField("abc", numberRules);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe("Date Validation", () => {
      const dateRules: ValidationRule[] = [
        {
          type: "date",
          value: {
            min: new Date(),
            format: "YYYY-MM-DD",
          },
          message: "La date doit être future",
        },
      ];

      it("validates future date", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const result = validateField(futureDate, dateRules);
        expect(result).toEqual([]);
      });

      it("validates past date", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const result = validateField(pastDate, dateRules);
        expect(result).toEqual(["La date doit être future"]);
      });

      it("validates invalid date format", () => {
        const result = validateField("invalid-date", dateRules);
        expect(result.length).toBeGreaterThan(0);
      });
    });

    describe("Custom Validation", () => {
      const customRule: ValidationRule = {
        type: "custom",
        validate: (value: string) => value.length >= 3,
        message: "Minimum 3 caractères requis",
      };

      it("validates custom rule success", () => {
        const result = validateField("test", [customRule]);
        expect(result).toEqual([]);
      });

      it("validates custom rule failure", () => {
        const result = validateField("ab", [customRule]);
        expect(result).toEqual(["Minimum 3 caractères requis"]);
      });
    });
  });

  // Tests de validation de formulaire
  describe("Form Validation", () => {
    const mockForm: FormValidation = {
      fields: {
        name: [
          {
            type: "required",
            message: "Le nom est requis",
          },
        ],
        email: [
          {
            type: "required",
            message: "L'email est requis",
          },
          {
            type: "email",
            message: "Email invalide",
          },
        ],
      },
    };

    it("validates complete valid form", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
      };

      const result = validateForm(data, mockForm);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("validates form with missing required fields", () => {
      const data = {
        name: "",
        email: "",
      };

      const result = validateForm(data, mockForm);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty("name");
      expect(result.errors).toHaveProperty("email");
    });

    it("validates form with invalid email", () => {
      const data = {
        name: "John Doe",
        email: "invalid-email",
      };

      const result = validateForm(data, mockForm);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty("email");
    });

    it("validates form with extra fields", () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        extra: "value",
      };

      const result = validateForm(data, mockForm);
      expect(result.isValid).toBe(true);
    });
  });

  // Tests de validation des dépendances
  describe("Dependencies Validation", () => {
    const mockDependencies: FieldDependency[] = [
      {
        field: "hasElevator",
        affects: ["floorNumber"],
        condition: (value) => value === false,
        validation: {
          type: "required",
          message: "L'étage est requis sans ascenseur",
        },
      },
    ];

    it("validates when dependency condition is met", () => {
      const data = {
        hasElevator: false,
        floorNumber: "",
      };

      const result = validateDependencies(data, mockDependencies);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty("floorNumber");
    });

    it("validates when dependency condition is not met", () => {
      const data = {
        hasElevator: true,
        floorNumber: "",
      };

      const result = validateDependencies(data, mockDependencies);
      expect(result.isValid).toBe(true);
    });

    it("validates with multiple dependencies", () => {
      const dependencies: FieldDependency[] = [
        ...mockDependencies,
        {
          field: "needsParking",
          affects: ["parkingDuration"],
          condition: (value) => value === true,
          validation: {
            type: "required",
            message: "La durée est requise avec parking",
          },
        },
      ];

      const data = {
        hasElevator: false,
        floorNumber: "3",
        needsParking: true,
        parkingDuration: "",
      };

      const result = validateDependencies(data, dependencies);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty("parkingDuration");
    });
  });

  // Tests de validation personnalisée
  describe("Custom Validation", () => {
    const mockCustomRules: CustomValidation[] = [
      {
        validate: (data) => {
          const { pickupDate, deliveryDate } = data;
          return new Date(deliveryDate) > new Date(pickupDate);
        },
        message: "La date de livraison doit être après la date de retrait",
      },
    ];

    it("validates custom rules success", () => {
      const data = {
        pickupDate: "2025-01-01",
        deliveryDate: "2025-01-02",
      };

      const result = validateCustomRules(data, mockCustomRules);
      expect(result.isValid).toBe(true);
    });

    it("validates custom rules failure", () => {
      const data = {
        pickupDate: "2025-01-02",
        deliveryDate: "2025-01-01",
      };

      const result = validateCustomRules(data, mockCustomRules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it("validates multiple custom rules", () => {
      const customRules: CustomValidation[] = [
        ...mockCustomRules,
        {
          validate: (data) => {
            return data.volume <= 50;
          },
          message: "Le volume ne doit pas dépasser 50m³",
        },
      ];

      const data = {
        pickupDate: "2025-01-01",
        deliveryDate: "2025-01-02",
        volume: 60,
      };

      const result = validateCustomRules(data, customRules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  // Tests de performance
  describe("Validation Performance", () => {
    it("validates large forms quickly", () => {
      const fields = Array.from({ length: 100 }, (_, i) => ({
        [`field${i}`]: [
          {
            type: "required",
            message: `Field ${i} is required`,
          },
        ],
      })).reduce((acc, curr) => ({ ...acc, ...curr }), {});

      const largeForm: FormValidation = { fields };
      const data = Object.keys(fields).reduce(
        (acc, key) => ({
          ...acc,
          [key]: "value",
        }),
        {},
      );

      const start = performance.now();
      const result = validateForm(data, largeForm);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Validation en moins de 100ms
      expect(result.isValid).toBe(true);
    });

    it("validates complex dependencies quickly", () => {
      const dependencies: FieldDependency[] = Array.from(
        { length: 50 },
        (_, i) => ({
          field: `field${i}`,
          affects: [`dependent${i}`],
          condition: (value) => value === true,
          validation: {
            type: "required",
            message: `Dependent field ${i} is required`,
          },
        }),
      );

      const data = dependencies.reduce(
        (acc, dep) => ({
          ...acc,
          [dep.field]: true,
          [dep.affects[0]]: "",
        }),
        {},
      );

      const start = performance.now();
      const result = validateDependencies(data, dependencies);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Validation en moins de 100ms
      expect(result.isValid).toBe(false);
    });
  });

  // Tests d'intégration
  describe("Integration Tests", () => {
    const completeValidation = {
      fields: {
        name: [
          {
            type: "required",
            message: "Le nom est requis",
          },
        ],
        email: [
          {
            type: "required",
            message: "L'email est requis",
          },
          {
            type: "email",
            message: "Email invalide",
          },
        ],
      },
      dependencies: [
        {
          field: "hasElevator",
          affects: ["floorNumber"],
          condition: (value) => value === false,
          validation: {
            type: "required",
            message: "L'étage est requis sans ascenseur",
          },
        },
      ],
      customRules: [
        {
          validate: (data) => {
            return data.acceptTerms === true;
          },
          message: "Vous devez accepter les conditions",
        },
      ],
    };

    it("validates complete form with all rules", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        hasElevator: true,
        acceptTerms: true,
      };

      const result = validateForm(validData, completeValidation);
      expect(result.isValid).toBe(true);
    });

    it("validates form with multiple errors", () => {
      const invalidData = {
        name: "",
        email: "invalid-email",
        hasElevator: false,
        acceptTerms: false,
      };

      const result = validateForm(invalidData, completeValidation);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(1);
    });

    it("validates form with mixed valid and invalid fields", () => {
      const mixedData = {
        name: "John Doe",
        email: "invalid-email",
        hasElevator: false,
        floorNumber: "3",
        acceptTerms: true,
      };

      const result = validateForm(mixedData, completeValidation);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty("email");
    });
  });
});
