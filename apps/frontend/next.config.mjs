const backendApiBaseUrl =
  (process.env.BACKEND_API_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const backendWsBaseUrl =
  (process.env.NEXT_PUBLIC_WS_URL || backendApiBaseUrl.replace(/^http/i, 'ws')).replace(/\/$/, '');

const nextConfig = {
  devIndicators: false,
  env: {
    NEXT_PUBLIC_WS_URL: backendWsBaseUrl,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendApiBaseUrl}/uni/:path*`,
      },
    ];
  },
};

export default nextConfig;
