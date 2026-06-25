/**
 * Input — styled text input for House of UGC forms.
 * Use for all single-line text entry: contact forms, search, settings.
 *
 * @example
 * ```jsx
 * <Input label="Email" placeholder="you@company.com" type="email" />
 * <Input label="Budget" prefix="$" placeholder="5,000" />
 * <Input label="Domain" suffix=".com" error="Already taken" />
 * <Input label="Name" hint="As it appears on your brief" />
 * ```
 */
export interface InputProps {
  /** Field label (also sets the input's id) */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Controlled value */
  value?: string;
  /** Change handler */
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** HTML input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  /** Error message — shown below input in danger color */
  error?: string;
  /** Hint message — shown below input when no error */
  hint?: string;
  /** Disables the field */
  disabled?: boolean;
  /** Text or icon prepended inside the field */
  prefix?: React.ReactNode;
  /** Text or icon appended inside the field */
  suffix?: React.ReactNode;
  /** Explicit id override */
  id?: string;
}
