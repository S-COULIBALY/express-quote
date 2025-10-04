import {
  submitForm,
  handleSubmission,
  prepareFormData,
  validateBeforeSubmit,
  handleSubmissionError,
  retrySubmission,
} from "../submission";

import type {
  FormData,
  SubmissionOptions,
  SubmissionResult,
  ValidationResult,
  RetryOptions,
} from "../types";

// Mock des fonctions externes
const mockValidateForm = jest.fn();
const mockSaveToDatabase = jest.fn();
const mockNotifyUser = jest.fn();
const mockTrackAnalytics = jest.fn();

jest.mock("../validation", () => ({
  validateForm: (...args) => mockValidateForm(...args),
}));

describe("Form Submission", () => {
  // Configuration de base pour les tests
  const mockFormData: FormData = {
    name: "John Doe",
    email: "john@example.com",
    service: "moving",
    date: "2025-01-01",
  };

  const mockOptions: SubmissionOptions = {
    validateBeforeSubmit: true,
    saveToDatabase: true,
    notifyUser: true,
    trackAnalytics: true,
  };

  beforeEach(() => {
    // Réinitialiser les mocks avant chaque test
    jest.clearAllMocks();
    mockValidateForm.mockReset();
    mockSaveToDatabase.mockReset();
    mockNotifyUser.mockReset();
    mockTrackAnalytics.mockReset();
  });

  // Tests de préparation des données
  describe("Data Preparation", () => {
    it("prepares form data correctly", () => {
      const result = prepareFormData(mockFormData);
      expect(result).toEqual(
        expect.objectContaining({
          name: "John Doe",
          email: "john@example.com",
        }),
      );
    });

    it("removes empty fields", () => {
      const data = {
        ...mockFormData,
        emptyField: "",
        nullField: null,
        undefinedField: undefined,
      };

      const result = prepareFormData(data);
      expect(result).not.toHaveProperty("emptyField");
      expect(result).not.toHaveProperty("nullField");
      expect(result).not.toHaveProperty("undefinedField");
    });

    it("formats dates correctly", () => {
      const data = {
        ...mockFormData,
        date: new Date("2025-01-01"),
      };

      const result = prepareFormData(data);
      expect(result.date).toBe("2025-01-01");
    });

    it("handles nested objects", () => {
      const data = {
        ...mockFormData,
        address: {
          street: "123 Main St",
          city: "Paris",
          empty: "",
        },
      };

      const result = prepareFormData(data);
      expect(result.address).toEqual({
        street: "123 Main St",
        city: "Paris",
      });
    });
  });

  // Tests de validation avant soumission
  describe("Pre-submission Validation", () => {
    it("validates form before submission when enabled", async () => {
      mockValidateForm.mockResolvedValue({ isValid: true });

      const result = await validateBeforeSubmit(mockFormData, {
        validateBeforeSubmit: true,
      });

      expect(mockValidateForm).toHaveBeenCalledWith(mockFormData);
      expect(result.isValid).toBe(true);
    });

    it("skips validation when disabled", async () => {
      const result = await validateBeforeSubmit(mockFormData, {
        validateBeforeSubmit: false,
      });

      expect(mockValidateForm).not.toHaveBeenCalled();
      expect(result.isValid).toBe(true);
    });

    it("returns validation errors", async () => {
      const errors = { email: ["Email invalide"] };
      mockValidateForm.mockResolvedValue({ isValid: false, errors });

      const result = await validateBeforeSubmit(mockFormData, {
        validateBeforeSubmit: true,
      });

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(errors);
    });
  });

  // Tests de soumission du formulaire
  describe("Form Submission", () => {
    it("submits form successfully", async () => {
      mockValidateForm.mockResolvedValue({ isValid: true });
      mockSaveToDatabase.mockResolvedValue({ id: "123" });

      const result = await submitForm(mockFormData, mockOptions);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("id", "123");
    });

    it("handles validation failure", async () => {
      const errors = { email: ["Email invalide"] };
      mockValidateForm.mockResolvedValue({ isValid: false, errors });

      const result = await submitForm(mockFormData, mockOptions);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(errors);
    });

    it("handles submission error", async () => {
      mockValidateForm.mockResolvedValue({ isValid: true });
      mockSaveToDatabase.mockRejectedValue(new Error("Database error"));

      const result = await submitForm(mockFormData, mockOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("tracks analytics when enabled", async () => {
      mockValidateForm.mockResolvedValue({ isValid: true });
      mockSaveToDatabase.mockResolvedValue({ id: "123" });

      await submitForm(mockFormData, mockOptions);

      expect(mockTrackAnalytics).toHaveBeenCalledWith({
        event: "form_submission",
        formData: expect.any(Object),
      });
    });
  });

  // Tests de gestion des erreurs
  describe("Error Handling", () => {
    it("handles network errors", async () => {
      const networkError = new Error("Network error");
      mockSaveToDatabase.mockRejectedValue(networkError);

      const result = await handleSubmissionError(networkError);

      expect(result).toEqual({
        success: false,
        error: "Network error",
        canRetry: true,
      });
    });

    it("handles validation errors", async () => {
      const validationError = {
        type: "validation",
        errors: { email: ["Email invalide"] },
      };

      const result = await handleSubmissionError(validationError);

      expect(result).toEqual({
        success: false,
        errors: validationError.errors,
        canRetry: false,
      });
    });

    it("handles unknown errors", async () => {
      const unknownError = new Error("Unknown error");

      const result = await handleSubmissionError(unknownError);

      expect(result).toEqual({
        success: false,
        error: "Une erreur est survenue",
        canRetry: false,
      });
    });
  });

  // Tests de nouvelle tentative
  describe("Retry Handling", () => {
    const mockRetryOptions: RetryOptions = {
      maxAttempts: 3,
      delay: 1000,
    };

    it("retries failed submission", async () => {
      mockSaveToDatabase
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ id: "123" });

      const result = await retrySubmission(
        mockFormData,
        mockOptions,
        mockRetryOptions,
      );

      expect(mockSaveToDatabase).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("id", "123");
    });

    it("gives up after max attempts", async () => {
      mockSaveToDatabase.mockRejectedValue(new Error("Network error"));

      const result = await retrySubmission(
        mockFormData,
        mockOptions,
        mockRetryOptions,
      );

      expect(mockSaveToDatabase).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("respects retry delay", async () => {
      jest.useFakeTimers();

      mockSaveToDatabase
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ id: "123" });

      const submissionPromise = retrySubmission(
        mockFormData,
        mockOptions,
        mockRetryOptions,
      );

      jest.advanceTimersByTime(1000);
      const result = await submissionPromise;

      expect(result.success).toBe(true);
      jest.useRealTimers();
    });
  });

  // Tests d'intégration
  describe("Integration Tests", () => {
    it("handles complete submission flow", async () => {
      // Simuler un succès complet
      mockValidateForm.mockResolvedValue({ isValid: true });
      mockSaveToDatabase.mockResolvedValue({ id: "123" });
      mockNotifyUser.mockResolvedValue(true);
      mockTrackAnalytics.mockResolvedValue(true);

      const result = await handleSubmission(mockFormData, mockOptions);

      expect(result.success).toBe(true);
      expect(mockValidateForm).toHaveBeenCalled();
      expect(mockSaveToDatabase).toHaveBeenCalled();
      expect(mockNotifyUser).toHaveBeenCalled();
      expect(mockTrackAnalytics).toHaveBeenCalled();
    });

    it("handles submission with retries", async () => {
      // Simuler un échec puis un succès
      mockValidateForm.mockResolvedValue({ isValid: true });
      mockSaveToDatabase
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ id: "123" });

      const result = await handleSubmission(mockFormData, {
        ...mockOptions,
        retry: {
          maxAttempts: 2,
          delay: 1000,
        },
      });

      expect(result.success).toBe(true);
      expect(mockSaveToDatabase).toHaveBeenCalledTimes(2);
    });

    it("handles complete failure flow", async () => {
      // Simuler un échec complet
      mockValidateForm.mockResolvedValue({ isValid: false });

      const result = await handleSubmission(mockFormData, mockOptions);

      expect(result.success).toBe(false);
      expect(mockSaveToDatabase).not.toHaveBeenCalled();
      expect(mockNotifyUser).not.toHaveBeenCalled();
      expect(mockTrackAnalytics).not.toHaveBeenCalled();
    });
  });

  // Tests de performance
  describe("Performance", () => {
    it("handles large form data efficiently", async () => {
      const largeFormData = {
        ...mockFormData,
        ...Array.from({ length: 100 }, (_, i) => ({
          [`field${i}`]: `value${i}`,
        })).reduce((acc, curr) => ({ ...acc, ...curr }), {}),
      };

      const start = performance.now();
      await submitForm(largeFormData, mockOptions);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100); // Soumission en moins de 100ms
    });

    it("handles multiple simultaneous submissions", async () => {
      const submissions = Array.from({ length: 10 }, () =>
        submitForm(mockFormData, mockOptions),
      );

      const start = performance.now();
      await Promise.all(submissions);
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(1000); // 10 soumissions en moins de 1s
    });
  });

  // Tests de cas limites
  describe("Edge Cases", () => {
    it("handles empty form data", async () => {
      const result = await submitForm({}, mockOptions);
      expect(result.success).toBe(false);
    });

    it("handles missing required options", async () => {
      const result = await submitForm(mockFormData, {});
      expect(result.success).toBe(false);
    });

    it("handles invalid retry options", async () => {
      const result = await submitForm(mockFormData, {
        ...mockOptions,
        retry: {
          maxAttempts: -1,
          delay: -1000,
        },
      });

      expect(result.success).toBe(false);
    });

    it("handles submission timeout", async () => {
      jest.useFakeTimers();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 5000),
      );

      mockSaveToDatabase.mockImplementation(() => timeoutPromise);

      const result = await submitForm(mockFormData, {
        ...mockOptions,
        timeout: 1000,
      });

      jest.runAllTimers();
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/timeout/i);

      jest.useRealTimers();
    });
  });
});
