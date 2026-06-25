Card — dark surface container for grouped content.

Use Card as the base for project cards, service tiles, testimonials, stat blocks, and any grouped information.

```jsx
// Basic
<Card padding="md">
  <p>UGC Content Strategy</p>
</Card>

// Hoverable / clickable
<Card hoverable onClick={() => navigate('/services/ugc')}>
  <Tag>UGC Content</Tag>
  <h3 style={{ marginTop: 12 }}>Creator campaigns at scale</h3>
</Card>

// Custom padding
<Card padding="lg">
  <h2>Our approach</h2>
</Card>
```

Notable variants/props:
- `padding`: none | sm (16px) | md (24px) | lg (32px)
- `hoverable`: brightens border and lifts background on hover
- `onClick`: makes card interactive (implies hoverable)
