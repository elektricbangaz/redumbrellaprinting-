import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Red Umbrella Printing",description:"Full-service printing in Jamaica."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}