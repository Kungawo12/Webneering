Badge — compact status/state indicator for House of UGC UIs.

Use Badge for status labels, metadata counts, and approval states. Keep labels short (1–2 words).

```jsx
<Badge variant="success" dot>Live</Badge>
<Badge variant="warning">Under review</Badge>
<Badge variant="danger">Rejected</Badge>
<Badge variant="default">Draft</Badge>
<Badge variant="outline">Archived</Badge>
```

Notable variants/props:
- `variant`: default | success | warning | danger | outline
- `dot`: adds a small colored status dot before the label
- `size`: sm | md
