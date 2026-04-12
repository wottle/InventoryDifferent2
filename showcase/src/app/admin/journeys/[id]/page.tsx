export default function JourneyEditorPage({ params }: { params: { id: string } }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-8">
      <h1 className="text-2xl font-bold mb-2">Journey Editor</h1>
      <p className="text-on-surface-variant">Editor for journey {params.id} — coming soon.</p>
    </div>
  );
}
