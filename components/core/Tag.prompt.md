Tag — ALL CAPS label chip for categories and metadata.

Use Tag for service labels, content type filters, or any short categorical metadata. Not for status (use Badge).

```jsx
<Tag>UGC Content</Tag>
<Tag variant="active">Performance Marketing</Tag>
<Tag size="sm">Creative Strategy</Tag>
<Tag onClick={() => setFilter('ugc')}>UGC Content</Tag>
```

Notable variants/props:
- `variant`: default (muted) | active (highlighted)
- `size`: sm | md
- `onClick`: makes tag interactive/filterable
