export function Footer() {
    return (
        <footer className="py-6 md:py-0 bg-black text-white">
            <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4 text-center md:text-left">
                <p className="text-sm leading-loose text-gray-400">
                    Built for laughs. This app handles football banter, but cannot fix your favorite team&apos;s defense.
                    Expect VAR delays here too.
                </p>
                <p className="text-sm text-gray-400 font-medium" suppressHydrationWarning>
                    ⚽ Football Chaos © {new Date().getFullYear()}
                </p>
            </div>
        </footer>
    );
}
