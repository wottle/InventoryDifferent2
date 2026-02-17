import ShopHome from "../components/ShopHome";

// Force dynamic rendering so CONTACT_EMAIL is read at runtime
export const dynamic = 'force-dynamic';

export default function Page() {
  const contactEmail = process.env.CONTACT_EMAIL || 'store@example.com';
  return <ShopHome contactEmail={contactEmail} />;
}
