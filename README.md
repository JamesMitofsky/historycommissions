This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Editing Content (Decap CMS)

To edit posts locally without deploying, run the Decap proxy alongside the dev server:

```bash
# Terminal 1
npx decap-server

# Terminal 2
npm run dev
```

Then open [http://localhost:3000/admin/index.html](http://localhost:3000/admin/index.html), click "Use Local Backend", and you can create and edit posts without any authentication. Changes write directly to `content/posts/` on your filesystem.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Netlify

This project deploys to Netlify. Pushes to `main` trigger a production build automatically.

Editors log in at `/admin` with email/password via Netlify Identity — no GitHub account required.
## TODOs
- [ ] Add commissions collection back to Decap CMS
- [ ] Add TODO.md with commission schema details
- [ ] Markdown will be deprecated in a year or so in favor of rich text