import styles from '@/styles/panel.module.css';

/**
 * Joins local CSS Module class names, omitting names that are not in the
 * module.
 */
export function cls(...names: ReadonlyArray<string | false | null>): string {
  return names
    .filter((name): name is string => Boolean(name))
    .map((name) => styles[name] ?? '')
    .filter(Boolean)
    .join(' ');
}
