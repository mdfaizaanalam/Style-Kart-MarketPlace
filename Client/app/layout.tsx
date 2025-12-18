import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import AiChatBot from "../components/AiChatBot"; // adjust the path if needed

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  weight: ['100','200','300','400','500','600','700','800','900']
});

export const metadata: Metadata = {
  title: "Style Kart",
  description: "Shop At Discount",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta2/css/all.min.css"
          integrity="sha512-YWzhKL2whUzgiheMoBFwW8CKV4qpHQAEuvilg9FAn5VJUDwKZZxkJNuGM4XkWuk94WCrrwslk8yWNGmY1EduTA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={poppins.className}>
        {children}

        {/* Floating AI Chat support */}
        <AiChatBot />
      </body>
    </html>
  );
}