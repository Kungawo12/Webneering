Button — interactive action element for House of UGC interfaces.

Use Button for all user-triggered actions: form submissions, navigation, CTAs, destructive confirmations.

```jsx
// Primary CTA
<Button variant="primary" size="lg">Start a project</Button>

// Secondary / bordered
<Button variant="secondary">View case studies</Button>

// Ghost / text-level
<Button variant="ghost">Learn more →</Button>

// Destructive
<Button variant="destructive">Remove client</Button>

// Disabled
<Button variant="primary" disabled>Processing…</Button>

// Full width with icon
<Button variant="primary" fullWidth rightIcon={<ArrowRight size={16} />}>
  Send brief
</Button>
```

Notable variants/props:
- `variant`: primary (white fill) | secondary (bordered) | ghost (transparent) | destructive (red tint)
- `size`: sm (32px) | md (38px) | lg (44px)
- `disabled`: dims and prevents interaction
- `leftIcon` / `rightIcon`: any React node rendered flush with label
- `fullWidth`: stretches to 100% of container
