/**
 * Button — primary interactive element for House of UGC.
 * Use for all user actions: form submissions, navigation, CTAs.
 *
 * @example
 * ```jsx
 * <Button variant="primary" size="md">Start a project</Button>
 * <Button variant="secondary" size="sm" disabled>Processing</Button>
 * <Button variant="ghost" leftIcon={<ArrowRight size={16} />}>Learn more</Button>
 * <Button variant="destructive" size="md">Delete client</Button>
 * ```
 *
 * @startingPoint section="Components" subtitle="Primary, secondary, ghost, destructive — sm/md/lg" viewport="700x200"
 */
export interface ButtonProps {
  /** Button label text */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  /** Size — affects padding and font size */
  size?: 'sm' | 'md' | 'lg';
  /** Disables interaction and dims appearance */
  disabled?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** HTML button type */
  type?: 'button' | 'submit' | 'reset';
  /** Icon before label */
  leftIcon?: React.ReactNode;
  /** Icon after label */
  rightIcon?: React.ReactNode;
  /** Stretch to full container width */
  fullWidth?: boolean;
}
