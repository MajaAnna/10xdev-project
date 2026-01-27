import { type ReactElement, type ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";

/**
 * Helper functions for tests
 */

// Custom render function with providers (if needed)
const AllTheProviders = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const renderWithProviders = (ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) => {
  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from testing-library
export * from "@testing-library/react";
export { renderWithProviders as render };
