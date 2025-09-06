import { expect } from "@std/expect";
import type { EnvironmentComponent } from "@cuss2/models";

export function validateComponent(
  component: EnvironmentComponent,
  options: { id?: number; subtype?: string; description?: string } = {}
): void {
  // Validate component has required properties
  expect(component).toBeTruthy();
  
  // Check componentID if specified in options
  if (options.id !== undefined) {
    expect(component.componentID).toBe(options.id);
  }
  
  // Validate component has a type
  expect(component.componentType).toBeTruthy();
  
  // Validate component characteristics if present
  if (component.componentCharacteristics && Array.isArray(component.componentCharacteristics)) {
    expect(component.componentCharacteristics.length).toBeGreaterThan(0);
  }
}