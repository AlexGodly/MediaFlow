# MediaFlow v260 React design system source

This is the maintainable React + TypeScript + Tailwind + Vite source for the v260 UI generation. The release ZIP is already prebuilt and deployable to GitHub Pages; Alex does **not** need to run npm, Vite or Tailwind.

The existing MediaFlow runtime remains the compatibility/data engine in v260 so all accumulated features and persistence formats continue working while the presentation layer moves to reusable React-era primitives. New v260 page chrome is React, and the v260 CSS/design tokens progressively redesign every legacy surface without rewriting hundreds of mature data behaviors in one risky migration.
