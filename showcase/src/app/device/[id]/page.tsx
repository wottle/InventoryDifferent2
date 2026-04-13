import { notFound } from 'next/navigation';
import { getClient } from '@/lib/apollo-rsc';
import { GET_SHOWCASE_DEVICE } from '@/lib/queries';
import { pickThumbnail } from '@/lib/image-utils';

// --- Types ---

interface DeviceImage {
  id: string;
  path: string;
  thumbnailPath: string | null;
  caption: string | null;
  isThumbnail: boolean;
  thumbnailMode: string | null;
}

interface MaintenanceTask {
  id: string;
  label: string;
  dateCompleted: string | null;
  notes: string | null;
}

interface DeviceNote {
  id: string;
  content: string;
  date: string;
}

interface DeviceDetail {
  id: number;
  name: string;
  additionalName: string | null;
  manufacturer: string | null;
  releaseYear: number | null;
  modelNumber: string | null;
  serialNumber: string | null;
  condition: string | null;
  functionalStatus: string | null;
  hasOriginalBox: boolean;
  isWifiEnabled: boolean;
  isPramBatteryRemoved: boolean;
  info: string | null;
  cpu: string | null;
  ram: string | null;
  storage: string | null;
  graphics: string | null;
  operatingSystem: string | null;
  externalUrl: string | null;
  rarity: string | null;
  location: { id: number; name: string } | null;
  dateAcquired: string | null;
  category: { name: string; type: string } | null;
  images: DeviceImage[];
  maintenanceTasks: MaintenanceTask[];
  notes: DeviceNote[];
}

// --- Helpers ---

function rarityBadge(rarity: string | null): { label: string; className: string } | null {
  if (!rarity) return null;
  switch (rarity) {
    case 'RARE':
      return { label: 'Rare', className: 'bg-tertiary-container text-on-tertiary-container' };
    case 'VERY_RARE':
      return { label: 'Very Rare', className: 'bg-tertiary-container text-on-tertiary-container' };
    case 'UNIQUE':
      return { label: 'Unique', className: 'bg-tertiary-container text-on-tertiary-container' };
    default:
      return null;
  }
}

function functionalStatusBadge(status: string | null): { label: string; className: string } | null {
  if (!status) return null;
  switch (status) {
    case 'YES':
      return { label: 'Fully Operational', className: 'text-green-700 bg-green-50' };
    case 'PARTIAL':
      return { label: 'Partial', className: 'text-yellow-700 bg-yellow-50' };
    case 'NO':
      return { label: 'Non-functional', className: 'text-red-700 bg-red-50' };
    default:
      return null;
  }
}

function functionalStatusLabel(status: string | null): string {
  switch (status) {
    case 'YES': return 'Fully Operational';
    case 'PARTIAL': return 'Partial Functionality';
    case 'NO': return 'Non-functional';
    default: return 'Unknown';
  }
}

function taskYear(dateCompleted: string | null): string {
  if (!dateCompleted) return '—';
  const d = new Date(dateCompleted);
  if (isNaN(d.getTime())) return '—';
  return String(d.getFullYear());
}

function formatNoteDate(date: string): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// --- Page Component ---

export default async function DeviceDetailPage({ params }: { params: { id: string } }) {
  const deviceId = parseInt(params.id, 10);
  if (isNaN(deviceId)) notFound();

  let device: DeviceDetail | null = null;

  try {
    const { data } = await getClient().query<{ device: DeviceDetail | null }>({
      query: GET_SHOWCASE_DEVICE,
      variables: { id: deviceId },
    });
    device = data?.device ?? null;
  } catch {
    // Fall through to notFound
  }

  if (!device) notFound();

  const heroImagePath = pickThumbnail(device.images);

  const rarity = rarityBadge(device.rarity);
  const funcBadge = functionalStatusBadge(device.functionalStatus);

  // Split info into two halves for the narrative section
  const infoText = device.info ?? '';
  const midpoint = Math.ceil(infoText.length / 2);
  const lastSpaceBefore = infoText.lastIndexOf(' ', midpoint);
  const splitIndex = lastSpaceBefore > 0 ? lastSpaceBefore : midpoint;
  const infoLeft = infoText.slice(0, splitIndex).trim();
  const infoRight = infoText.slice(splitIndex).trim();

  // Spec cards
  const hardwareNotes: string[] = [];
  if (device.hasOriginalBox) hardwareNotes.push('Original box included');
  if (device.isPramBatteryRemoved) hardwareNotes.push('PRAM battery removed');
  if (device.isWifiEnabled) hardwareNotes.push('Wi-Fi enabled');

  interface SpecCard {
    label: string;
    value: string;
    wide?: boolean;
  }
  const specCards: SpecCard[] = [];
  if (device.cpu) specCards.push({ label: 'Processor', value: device.cpu });
  if (device.ram) specCards.push({ label: 'Memory', value: device.ram });
  if (device.storage) specCards.push({ label: 'Storage', value: device.storage });
  if (device.graphics) specCards.push({ label: 'Graphics', value: device.graphics, wide: true });
  if (device.operatingSystem) specCards.push({ label: 'Operating System', value: device.operatingSystem });
  if (device.condition) specCards.push({ label: 'Condition', value: device.condition });
  if (hardwareNotes.length > 0) specCards.push({ label: 'Hardware Notes', value: hardwareNotes.join(' · ') });

  // Most recent maintenance task index (by dateCompleted, then by array order)
  const sortedTasks = [...device.maintenanceTasks].sort((a, b) => {
    if (!a.dateCompleted && !b.dateCompleted) return 0;
    if (!a.dateCompleted) return 1;
    if (!b.dateCompleted) return -1;
    return new Date(b.dateCompleted).getTime() - new Date(a.dateCompleted).getTime();
  });

  return (
    <main>
      {/* Section 1: Hero */}
      <section className="min-h-screen flex flex-col md:flex-row items-stretch">
        {/* Left: Image */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-screen relative overflow-hidden">
          {heroImagePath ? (
            <img
              src={heroImagePath}
              alt={device.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-container-high" />
          )}
        </div>

        {/* Right: Info */}
        <div className="w-full md:w-1/2 p-12 md:p-24 bg-surface flex flex-col justify-center">
          <p className="text-primary uppercase tracking-[0.2em] text-sm font-semibold mb-6">
            Archive No. {device.id}
          </p>
          <h1 className="text-[4rem] md:text-[6rem] font-black tracking-tighter leading-none text-on-surface mb-8">
            {device.name}
          </h1>
          {(device.additionalName || device.info) && (
            <p className="text-xl text-on-surface-variant font-light leading-relaxed max-w-lg mb-10">
              {device.additionalName
                ? device.additionalName
                : device.info!.slice(0, 200)}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            {device.condition && (
              <span className="px-4 py-1 rounded bg-surface-container-high text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                {device.condition}
              </span>
            )}
            {device.releaseYear && (
              <span className="px-4 py-1 rounded bg-surface-container-high text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                Circa {device.releaseYear}
              </span>
            )}
            {rarity && (
              <span className={`px-4 py-1 rounded text-xs font-bold uppercase tracking-widest ${rarity.className}`}>
                {rarity.label}
              </span>
            )}
            {device.hasOriginalBox && (
              <span className="px-4 py-1 rounded bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                Original Box
              </span>
            )}
            {funcBadge && (
              <span className={`px-4 py-1 rounded text-xs font-bold uppercase tracking-widest ${funcBadge.className}`}>
                {funcBadge.label}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: The Story */}
      {device.info && (
        <section className="py-32 px-12 md:px-24 bg-surface-container-lowest">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-12">
              The Story
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16">
              {device.name}
              {device.additionalName ? ` ${device.additionalName}` : ''}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {/* Left column */}
              <div className="text-on-surface-variant text-lg leading-loose space-y-8">
                <p>{infoLeft || infoText}</p>
              </div>
              {/* Right column */}
              <div className="text-on-surface-variant text-lg leading-loose space-y-8">
                {infoRight && <p>{infoRight}</p>}

                {/* Notes */}
                {device.notes.slice(0, 2).map((note) => (
                  <div key={note.id} className="text-sm italic text-on-surface-variant/80">
                    <span className="font-semibold not-italic text-on-surface-variant/60 mr-2">
                      {formatNoteDate(note.date)}
                    </span>
                    {note.content}
                  </div>
                ))}

                {/* Archival status footer */}
                <div className="pt-8 border-t border-outline-variant/30">
                  <p className="text-sm italic font-medium">
                    Archival Status: {functionalStatusLabel(device.functionalStatus)}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Technical Blueprint */}
      {specCards.length > 0 && (
        <section className="py-32 px-12 md:px-24 bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">
                  Specifications
                </p>
                <h2 className="text-5xl font-black tracking-tighter">Technical Blueprint</h2>
              </div>
              <div className="h-[1px] flex-grow bg-outline-variant/20 mx-12 hidden md:block" />
              {device.modelNumber && (
                <p className="text-on-surface-variant uppercase text-xs tracking-widest font-bold">
                  Ref: {device.modelNumber}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {specCards.map((card) => (
                <div
                  key={card.label}
                  className={`bg-surface-container-low p-10 rounded-xl hover:bg-surface-container-lowest transition-colors duration-500${card.wide ? ' md:col-span-2' : ''}`}
                >
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant/60 font-bold mb-6">
                    {card.label}
                  </p>
                  <p className="text-2xl font-black text-primary leading-tight">{card.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Section 4: Gallery */}
      {device.images.length > 0 && (
        <section className="py-32 bg-surface-container-low">
          <div className="px-12 md:px-24 mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">Gallery</p>
            <h2 className="text-5xl font-black tracking-tighter">Detailed Observations</h2>
          </div>
          <div className="flex overflow-x-auto pb-12 px-12 md:px-24 gap-8">
            {device.images.map((image) => (
              <div key={image.id} className="flex-none w-80 md:w-[30rem]">
                <div className="aspect-[4/5] bg-surface rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-500">
                  <img
                    src={image.path}
                    alt={image.caption ?? device.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {image.caption && (
                  <div className="mt-6">
                    <p className="text-sm font-bold text-on-surface">{image.caption}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 5: Restoration Log */}
      {device.maintenanceTasks.length > 0 && (
        <section className="py-32 px-12 md:px-24 bg-surface-container-lowest">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-24">
            <div className="md:w-1/3">
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-bold mb-4">
                Restoration Log
              </p>
              <h2 className="text-5xl font-black tracking-tighter mb-8 leading-tight">
                Work Done
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                Every repair, recap, and restoration performed on this machine — documented
                as the work was completed.
              </p>
            </div>
            <div className="md:w-2/3 space-y-4">
              {sortedTasks.map((task, index) => {
                const isFirst = index === 0;
                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-8 p-8 bg-surface-container-low rounded-xl border-l-4 ${
                      isFirst ? 'border-primary' : 'border-outline-variant/30'
                    }`}
                  >
                    <div
                      className={`font-black text-2xl shrink-0 ${
                        isFirst ? 'text-primary' : 'text-on-surface-variant/40'
                      }`}
                    >
                      {taskYear(task.dateCompleted)}
                    </div>
                    <div>
                      <h4 className="font-bold text-on-surface">{task.label}</h4>
                      {task.notes && (
                        <p className="text-sm text-on-surface-variant mt-2">{task.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto bg-on-surface text-surface rounded-[2rem] overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '40px 40px',
            }}
          />
          <div className="relative z-10 px-12 py-20 text-center">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8">
              Explore the Full Archive
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/timeline"
                className="px-8 py-4 bg-surface text-on-surface rounded-full font-bold text-sm hover:opacity-90 transition-all"
              >
                Browse Timeline
              </a>
              <a
                href="/journeys"
                className="px-8 py-4 border border-surface/30 text-surface rounded-full font-bold text-sm hover:bg-surface/10 transition-all"
              >
                All Journeys
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
