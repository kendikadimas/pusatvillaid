import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 32,
  height: 32,
};

export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#3B82F6',
          borderRadius: '20%',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 32 32"
          fill="white"
        >
          <path d="M16 7.5L7.5 14.5h3.5v9h10v-9h3.5zM18 21.5h-4v-7.5h4z"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}