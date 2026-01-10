/**
 * 🎭 **TYPES PLAYWRIGHT - Tests de Réservation**
 * 
 * Définitions de types pour les tests Playwright
 */

declare module '@playwright/test' {
  export interface Page {
    goto(url: string): Promise<void>;
    click(selector: string): Promise<void>;
    fill(selector: string, value: string): Promise<void>;
    selectOption(selector: string, value: string): Promise<void>;
    check(selector: string): Promise<void>;
    uncheck(selector: string): Promise<void>;
    waitForSelector(selector: string, options?: any): Promise<void>;
    waitForURL(url: string | RegExp): Promise<void>;
    waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle'): Promise<void>;
    locator(selector: string): any;
    route(url: string | RegExp, handler: (route: any) => void): Promise<void>;
    setViewportSize(size: { width: number; height: number }): Promise<void>;
    reload(): Promise<void>;
    evaluate(fn: (el: any) => any): Promise<any>;
    inputValue(selector: string): Promise<string>;
    keyboard: {
      press(key: string): Promise<void>;
    };
  }

  export interface Locator {
    toBeVisible(): Promise<void>;
    toContainText(text: string): Promise<void>;
    toHaveURL(url: string | RegExp): Promise<void>;
    toHaveAttribute(attr: string, value: string): Promise<void>;
    not: {
      toBeVisible(): Promise<void>;
    };
  }

  export interface Route {
    fulfill(options: {
      status: number;
      contentType: string;
      body: string;
    }): void;
  }

  export interface TestFunction {
    (name: string, fn: (args: { page: Page }) => Promise<void>): void;
    describe(name: string, fn: () => void): void;
    beforeEach(fn: (args: { page: Page }) => Promise<void>): void;
    afterEach(fn: (args: { page: Page }) => Promise<void>): void;
    beforeAll(fn: () => Promise<void>): void;
    afterAll(fn: () => Promise<void>): void;
  }

  export const test: TestFunction;
  export const expect: (actual: any) => any;
}
