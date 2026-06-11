"use client";

import React from "react";
import Image from "next/image";

interface FlagProps {
    emoji: string;
    className?: string;
    size?: number;
}

/**
 * A robust Flag component that works on Windows/Chrome.
 * Converts country flag emojis into images from FlagCDN.
 * Fallback to raw emoji for non-flag characters (like 🛡️, 🚩, ⚽).
 */
export function Flag({ emoji, className, size = 24 }: FlagProps) {
    if (!emoji) return null;

    // Convert emoji to ISO code
    // Flag emojis are regional indicator symbols from U+1F1E6 to U+1F1FF
    const code = [...emoji]
        .map(char => {
            const cp = char.codePointAt(0);
            return cp && cp >= 127462 && cp <= 127487
                ? String.fromCharCode(cp - 127397)
                : "";
        })
        .join("")
        .toLowerCase();

    // If it's a valid 2-letter ISO code, use FlagCDN
    // Note: England (GB-ENG), Scotland (GB-SCT), Wales (GB-WLS) use different emoji structures (tags),
    // but the teams_meta.json seems to use standard regional indicators for them too, or custom icons.
    // For now, handling 2-letter standard flags.
    if (code.length === 2) {
        return (
            <div className={`inline-flex items-center justify-center ${className || ""}`} style={{ width: size * 1.5, height: size }}>
                <Image
                    src={`https://flagcdn.com/w80/${code}.png`}
                    alt={emoji}
                    width={80}
                    height={60}
                    className="w-full h-full object-contain"
                />
            </div>
        );
    }

    // Special handling for UK countries if needed (they use U+1F3F4 U+E0067...)
    // But our teams_meta.json likely uses standard emojis or 🚩.

    return <span className={className}>{emoji}</span>;
}
