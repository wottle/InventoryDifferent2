export default function ListNewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        body { background-color: #f9f9fe !important; }
        @media (prefers-color-scheme: dark) { body { background-color: #111318 !important; } }
      `}</style>
      <div className="-mx-4 -mt-4">
        {children}
      </div>
    </>
  );
}
