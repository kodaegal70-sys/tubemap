'use client';

import { useState } from 'react';

type Props = {
    src?: string;
    alt?: string;
    className?: string;
    style?: React.CSSProperties;
};

export default function PlaceImage({ src, alt = "", className, style }: Props) {
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!src || src === "" || error) {
        return (
            <div
                className={className}
                style={{
                    display: 'flex',
                    width: '100%',
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '40px',
                    backgroundColor: '#f0f0f0',
                    color: '#ccc',
                    ...style
                }}
            >
                {isLoading && !error ? "..." : "🍽️"}
            </div>
        );
    }

    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(src)}`;

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#f9f9f9', overflow: 'hidden' }}>
            {isLoading && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#f9f9f9', color: '#999', fontSize: '13px', zIndex: 1
                }}>
                    이미지 준비 중...
                </div>
            )}
            <img
                src={proxyUrl}
                alt={alt}
                className={className}
                referrerPolicy="no-referrer"
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: isLoading ? 0 : 1,
                    transition: 'opacity 0.5s ease',
                    ...style
                }}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setError(true);
                    setIsLoading(false);
                }}
            />
        </div>
    );
}
