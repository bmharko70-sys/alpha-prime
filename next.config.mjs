/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "img-src 'self' data: https: blob:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "font-src 'self' data:",
              "connect-src 'self' https://en.wikipedia.org https://*.wikipedia.org https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org https://pubchem.ncbi.nlm.nih.gov https://www.wikidata.org https://api.groq.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
