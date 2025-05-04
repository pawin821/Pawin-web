// app/layout.js
import { Inter } from 'next/font/google';
import PetNavbar from './componenets/navbar';
import { Toaster } from 'react-hot-toast';


const inter = Inter({ subsets: ['latin'] });


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
              <Toaster position="top-center" />

        <PetNavbar />
        <main>{children}</main>
      </body>
    </html>
  );
}