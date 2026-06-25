/**
 * Badge — compact status indicator.
 * Use to communicate status, state, or metadata inline.
 *
 * @example
 * ```jsx
 * <Badge variant="success" dot>Live</Badge>
 * <Badge variant="warning">Review needed</Badge>
 * <Badge variant="danger">Failed</Badge>
 * <Badge variant="outline">Draft</Badge>
 * ```
 */
export interface BadgeProps {
  /** Label text */
  children: React.ReactNode;
  /** Color variant conveying semantic meaning */
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
  /** Size variant */
  size?: 'sm' | 'md';
  /** Show a small status dot before the label */
  dot?: boolean;
}
