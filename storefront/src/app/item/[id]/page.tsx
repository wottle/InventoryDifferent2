import ItemDetail from "../../../components/ItemDetail";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    const contactEmail = process.env.CONTACT_EMAIL || 'store@example.com';
    return <ItemDetail id={id} contactEmail={contactEmail} />;
}
