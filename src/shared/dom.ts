export const byName = (name: string, scope: ParentNode = document) =>
  scope.querySelector<HTMLElement>(`[data-name="${name}"]`);
export const allByName = (name: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<HTMLElement>(`[data-name="${name}"]`));
export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
