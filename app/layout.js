import './globals.css';

export const metadata = {
  title: 'StudyMate AI – Your AI-Powered Study Assistant',
  description: 'Summarize notes, get simple explanations, and generate exam questions instantly with AI. Study smarter, not harder.',
  keywords: 'AI study assistant, note summarizer, exam questions generator, study helper, StudyMate AI',
  openGraph: {
    title: 'StudyMate AI – Study Smarter with AI',
    description: 'Your personal AI tutor that summarizes notes, explains topics simply, and generates practice questions.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
