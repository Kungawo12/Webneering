/**
 * Card — content surface for grouping related information.
 * Use as the base for service cards, project cards, stat blocks, etc.
 *
 * @example
 * ```jsx
 * <Card padding="md" hoverable>
 *   <h3>Performance Marketing</h3>
 *   <p>Conversion-focused ad creative at scale.</p>
 * </Card>
 * ```
 */
export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Enables hover highlight effect */
  hoverable?: boolean;
  /** Internal padding size */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Click handler (also enables hover state) */
  onClick?: () => void;
  /** Additional inline styles */
  style?: React.CSSProperties;
}
