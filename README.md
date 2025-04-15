This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

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

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# mirae-client

## TODO
0. recorder - progressform - figure out how to make sure matched students and matched objectives are linked - either set student as single for all sessions rather than array, or set nested matched objectives within each student. 
1. Update how subject-areas for student is extracted and instead do it through objectives table
- To streamline the ObjectivesProgressForm and so it can be abstracted.
- Also current workflow in manual log form, is inefficient. should fetch data in objectives based format. 
- Down the line, must change database design to better handle these relationships
2. IEP parser needs to populate necessary objective data points. also needs to allow edits post parsing.
3. Test the transcript -> LLM/NLP -> objectivesProgressForm logic
4. Store all student data (raw inputs, trends in progress etc.) to generate LLM summaries
5. Objectives should have measurable progress indicator - math based + LLM based?
6. Notifications and time-based feedback - need to integrate notifications settings in objective creation
7. Style + isMobile
8. clean up state management

not core but nice to haves:
1. Set up separate route for student page, and objective page. 
2. memoize and try to minimize data refetching (especially reports)
