import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-surface flex items-center justify-center px-8">
      <div className="max-w-lg text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-primary font-bold mb-4">404</p>
        <h1 className="text-6xl font-black tracking-tighter text-on-surface mb-6">
          Page Not Found
        </h1>
        <p className="text-lg text-on-surface-variant leading-relaxed mb-10">
          This artifact has wandered off the shelf. Let&apos;s get you back to the collection.
        </p>
        <Link
          href="/"
          className="inline-block bg-primary text-on-primary px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-all"
        >
          Return Home
        </Link>
      </div>
    </main>
  );
}
