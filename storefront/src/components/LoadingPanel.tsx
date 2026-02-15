export function LoadingPanel({ title, subtitle }: { title?: string; subtitle?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            <div className="logo-spinner mb-4" />
            {title && <p className="text-[var(--foreground)] font-medium">{title}</p>}
            {subtitle && <p className="text-sm text-[var(--muted-foreground)] mt-1">{subtitle}</p>}
        </div>
    );
}
