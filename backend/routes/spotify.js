const config = {
    clientId: 'YOUR_CLIENT_ID',
    redirectUrl: 'myapp://callback', // or http://localhost:8080/callback if testing in browser
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