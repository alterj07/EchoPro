const config = {
    clientId: process.env.SPOTIFY_CLIENT_ID || 'YOUR_CLIENT_ID',
    redirectUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/callback` : 'https://echo-pro.vercel.app/callback',
    scopes: [
      'user-read-email',
      'playlist-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
      'streaming'
    ],
    serviceConfiguration: {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token'
    }
};