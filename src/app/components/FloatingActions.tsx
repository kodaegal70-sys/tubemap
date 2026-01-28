'use client';

type Props = {
    onMyLocation: () => void;
};

export default function FloatingActions({ onMyLocation }: Props) {
    return (
        <div style={{
            position: 'absolute',
            bottom: '140px', // 바텀시트 peek 위쪽
            right: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 900
        }}>
            <button
                onClick={onMyLocation}
                style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'white',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}
            >
                🎯
            </button>
        </div>
    );
}
