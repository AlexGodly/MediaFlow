# MediaFlow v261 React design system source

This is the maintainable React + TypeScript + Tailwind + Vite source for the v261 UI generation. The release ZIP is already prebuilt and deployable to GitHub Pages; Alex does **not** need to run npm, Vite or Tailwind.

The existing MediaFlow runtime remains the compatibility/data engine in v261 so all accumulated features and persistence formats continue working while the presentation layer moves to reusable React-era primitives. New v261 page chrome is React, and the v261 CSS/design tokens progressively redesign every legacy surface without rewriting hundreds of mature data behaviors in one risky migration.
