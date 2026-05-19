export function Footer() {
    return (
        <footer className="border-t py-6 md:py-0 bg-muted/40">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 text-center md:text-left">
                <p className="text-sm leading-loose text-muted-foreground">
                    Built for laughs. This app handles football banter, but cannot fix your favorite team&apos;s defense.
                    Expect VAR delays here too.
                </p>
                <p className="text-sm text-muted-foreground font-medium" suppressHydrationWarning>
                    ⚽ Football Chaos © {new Date().getFullYear()}
                </p>
            </div>
        </footer>
    );
}
