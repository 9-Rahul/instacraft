import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Breadcrumb from '@/components/layout/Breadcrumb';
import WhatsAppCTA from '@/components/common/WhatsAppCTA';
import '../globals.css';
import { getSiteContent, getCategories } from '@/lib/api-server';

export default async function StoreLayout({ children }) {
  const [content, categories] = await Promise.all([
    getSiteContent().catch(() => null),
    getCategories().catch(() => [])
  ]);

  return (
    <>
      <Navbar staticContent={content} staticCategories={categories} />
      <Breadcrumb />
      <main className="store-main" id="main-content">
        {children}
      </main>
      <Footer staticContent={content} staticCategories={categories} />
      <WhatsAppCTA />
    </>
  );
}
