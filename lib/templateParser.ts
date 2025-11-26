/**
 * Template parsing utilities for TextNode variable interpolation.
 *
 * Template syntax: {variableName} where variableName is alphanumeric + underscores
 * e.g., "A {fruit} in a {color} bowl"
 */

/**
 * Parse template string and extract variable names.
 * @param template - String containing {variable} patterns
 * @returns Array of unique variable names in order of first appearance
 */
export function parseTemplateVariables(template: string): string[] {
  const regex = /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g;
  const variables: string[] = [];
  let match;

  while ((match = regex.exec(template)) !== null) {
    const varName = match[1];
    if (!variables.includes(varName)) {
      variables.push(varName);
    }
  }

  return variables;
}

/**
 * Interpolate template with provided values.
 * Missing variables are left as-is: {missing} stays as {missing}
 * @param template - String containing {variable} patterns
 * @param values - Record mapping variable names to their values
 * @returns Interpolated string
 */
export function interpolateTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(
    /\{([a-zA-Z_][a-zA-Z0-9_]*)\}/g,
    (match, varName: string) => values[varName] ?? match
  );
}

/**
 * Result of template interpolation with potential list inputs.
 */
export type InterpolationResult = {
  results: string[];
  listInfo?: { names: string[]; counts: number[]; totalCombinations: number };
  error?: string;
};

/**
 * Generate cartesian product of multiple arrays.
 * @param arrays - Array of arrays to combine
 * @returns Array of all combinations (each combination is an array of values)
 */
function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  if (arrays.some((arr) => arr.length === 0)) return [];

  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((combo) => curr.map((item) => [...combo, item])),
    [[]]
  );
}

/**
 * Generate all interpolated strings when one or more inputs is a list.
 * Supports multiple lists via cartesian product (all combinations).
 *
 * @param template - String containing {variable} patterns
 * @param values - Record mapping variable names to single values or arrays
 * @returns Object with results array and optional error
 */
export function interpolateTemplateWithList(
  template: string,
  values: Record<string, string | string[]>
): InterpolationResult {
  // Separate list and single values
  const listEntries = Object.entries(values).filter(
    (entry): entry is [string, string[]] => Array.isArray(entry[1])
  );
  const singleEntries = Object.entries(values).filter(
    (entry): entry is [string, string] => !Array.isArray(entry[1])
  );

  // Check for empty lists
  const emptyLists = listEntries.filter(([, arr]) => arr.length === 0);
  if (emptyLists.length > 0) {
    return {
      results: [],
      error: `Empty list(s): ${emptyLists.map(([k]) => k).join(", ")}`,
    };
  }

  // No lists - just interpolate once
  if (listEntries.length === 0) {
    const singleValues = Object.fromEntries(singleEntries);
    return { results: [interpolateTemplate(template, singleValues)] };
  }

  // Build list info for UI
  const listNames = listEntries.map(([name]) => name);
  const listCounts = listEntries.map(([, arr]) => arr.length);
  const totalCombinations = listCounts.reduce((a, b) => a * b, 1);

  // Generate cartesian product of all lists
  const listArrays = listEntries.map(([, arr]) => arr);
  const combinations = cartesianProduct(listArrays);

  // Build single values map
  const singleValues = Object.fromEntries(singleEntries);

  // Generate result for each combination
  const results = combinations.map((combo) => {
    const comboValues: Record<string, string> = { ...singleValues };
    listEntries.forEach(([name], index) => {
      comboValues[name] = combo[index];
    });
    return interpolateTemplate(template, comboValues);
  });

  return {
    results,
    listInfo: {
      names: listNames,
      counts: listCounts,
      totalCombinations,
    },
  };
}
