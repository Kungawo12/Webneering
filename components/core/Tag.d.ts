/**
 * Tag — small ALL CAPS label chip for categories and metadata.
 * Use for service type labels, category filters, and metadata chips.
 *
 * @example
 * ```jsx
 * <Tag>UGC Content</Tag>
 * <Tag variant="active">Performance Marketing</Tag>
 * <Tag size="sm" onClick={() => setFilter('creative')}>Creative Strategy</Tag>
 * ```
 */
export interface TagProps {
  /** Tag text (auto-uppercased via CSS) */
  children: React.ReactNode;
  /** Active/selected state variant */
  variant?: 'default' | 'active';
  /** Size */
  size?: 'sm' | 'md';
  /** Click handler — also makes the tag interactive */
  onClick?: () => void;
}
