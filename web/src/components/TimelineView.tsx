import Link from "next/link";
import { API_BASE_URL } from "../lib/config";
import { useT, useLocale } from "../i18n/context";

interface TimelineDevice {
  id: number;
  name: string;
  additionalName: string | null;
  manufacturer: string | null;
  releaseYear: number;
  images: { path: string; thumbnailPath?: string | null; isThumbnail: boolean }[];
  category: { name: string };
}

interface TimelineEvent {
  id: number;
  year: number;
  title: string;
  description: string;
  titleDe?: string | null;
  descriptionDe?: string | null;
  titleFr?: string | null;
  descriptionFr?: string | null;
  type: string;
}

interface TimelineRow {
  year: number;
  devices: TimelineDevice[];
  events: TimelineEvent[];
}

function buildRows(devices: TimelineDevice[], events: TimelineEvent[]): TimelineRow[] {
  const map = new Map<number, TimelineRow>();
  for (const ev of events) {
    if (!map.has(ev.year)) map.set(ev.year, { year: ev.year, devices: [], events: [] });
    map.get(ev.year)!.events.push(ev);
  }
  for (const d of devices) {
    if (!map.has(d.releaseYear)) map.set(d.releaseYear, { year: d.releaseYear, devices: [], events: [] });
    map.get(d.releaseYear)!.devices.push(d);
  }
  return Array.from(map.values()).sort((a, b) => a.year - b.year);
}

function eventDotColor(type: string) {
  switch (type) {
    case "apple": return "bg-blue-500";
    case "tech": return "bg-orange-500";
    default: return "bg-orange-500";
  }
}

export default function TimelineView({
  devices,
  events,
}: {
  devices: TimelineDevice[];
  events: TimelineEvent[];
}) {
  const t = useT();
  const locale = useLocale();
  const rows = buildRows(devices, events);

  function localizedEvent(event: TimelineEvent): { title: string; description: string } {
    if (locale === "de") {
      return {
        title: event.titleDe ?? event.title,
        description: event.descriptionDe ?? event.description,
      };
    }
    if (locale === "fr") {
      return {
        title: event.titleFr ?? event.title,
        description: event.descriptionFr ?? event.description,
      };
    }
    return { title: event.title, description: event.description };
  }

  if (rows.length === 0) {
    return (
      <div className="p-4 text-sm text-[var(--muted-foreground)]">
        {t.pages.timeline.noData}
      </div>
    );
  }

  return (
    <div className="relative pb-8">
      {/* Legend */}
      <div className="mb-6 flex flex-wrap gap-4 text-xs text-[var(--muted-foreground)]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-500" /> {t.pages.timeline.legendApple}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500" /> {t.pages.timeline.legendTech}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded border border-[var(--border)] bg-[var(--card)]" /> {t.pages.timeline.legendCollection}
        </span>
      </div>

      {/* Center vertical line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)] -translate-x-1/2 pointer-events-none" />

      <div className="space-y-6">
        {rows.map((row) => (
          <div key={row.year} className="relative grid grid-cols-[1fr_48px_1fr] items-start gap-x-2">
            {/* LEFT — collection devices */}
            <div className="flex flex-col items-end gap-2 pr-2">
              {row.devices.map((device) => {
                const thumbImage = device.images.find((i) => i.isThumbnail) ?? device.images[0];
                const thumbUrl = thumbImage
                  ? `${API_BASE_URL}${thumbImage.thumbnailPath ?? thumbImage.path}`
                  : null;
                return (
                  <Link
                    key={device.id}
                    href={`/devices/${device.id}`}
                    className="card-retro border border-[var(--border)] bg-[var(--card)] rounded p-2 w-full max-w-[220px] group hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-end gap-2">
                      <div className="flex flex-col items-end min-w-0">
                        <span className="text-xs font-semibold text-[var(--foreground)] group-hover:text-[var(--apple-blue)] truncate max-w-[140px]">
                          {device.name}
                          {device.additionalName && (
                            <span className="text-[var(--muted-foreground)] font-normal"> ({device.additionalName})</span>
                          )}
                        </span>
                        <span className="text-[11px] text-[var(--muted-foreground)] truncate max-w-[140px]">
                          {device.manufacturer ? `${device.manufacturer} · ` : ""}{device.category.name}
                        </span>
                      </div>
                      <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-[var(--muted)]">
                        {thumbUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumbUrl}
                            alt={device.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-[8px]">
                            NO IMG
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* CENTER — year badge + dot */}
            <div className="flex flex-col items-center gap-1 relative z-10">
              <div className="bg-[var(--card)] border border-[var(--border)] card-retro rounded px-1.5 py-0.5 text-[10px] font-mono font-bold text-[var(--foreground)] whitespace-nowrap shadow-sm">
                {row.year}
              </div>
              <div className="w-2 h-2 rounded-full bg-[var(--foreground)] mt-0.5 ring-2 ring-[var(--background)]" />
            </div>

            {/* RIGHT — historical events */}
            <div className="flex flex-col items-start gap-2 pl-2">
              {row.events.map((event) => {
                const { title, description } = localizedEvent(event);
                return (
                  <div
                    key={event.id}
                    className="rounded border border-[var(--border)] bg-[var(--muted)] p-2 w-full max-w-[280px] opacity-80"
                  >
                    <div className="flex items-start gap-1.5">
                      <div className={`w-2 h-2 mt-1 rounded-full flex-shrink-0 ${eventDotColor(event.type)}`} />
                      <div>
                        <div className="text-xs font-medium text-[var(--foreground)] leading-snug">{title}</div>
                        <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5 leading-snug">{description}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
