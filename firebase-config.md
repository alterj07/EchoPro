# Firebase Configuration Guide

## Setup Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication in the Firebase console

### 2. Enable Authentication Methods
In Firebase Console > Authentication > Sign-in method:

#### Email/Password
- Enable Email/Password authentication

#### Google Sign-In
- Enable Google Sign-In
- Add your app's SHA-1 fingerprint (for Android)
- Download `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)

#### Apple Sign-In (iOS only)
- Enable Apple Sign-In
- Configure Apple Developer account settings

### 3. Download Configuration Files

#### Android
1. Download `google-services.json`
2. Place it in `android/app/`
3. Add to `android/build.gradle`:
   ```gradle
   classpath 'com.google.gms:google-services:4.3.15'
   ```
4. Add to `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

#### iOS
1. Download `GoogleService-Info.plist`
2. Add to iOS project in Xcode
3. Add to `ios/Podfile`:
   ```ruby
   pod 'Firebase/Auth'
   pod 'GoogleSignIn'
   ```

### 4. Update App.tsx
Replace `YOUR_WEB_CLIENT_ID` in `App.tsx` with your actual web client ID from Firebase console.

### 5. iOS Configuration

#### Add to Info.plist
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>REVERSED_CLIENT_ID</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>YOUR_REVERSED_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

#### Apple Sign-In (Optional)
Add to Info.plist:
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>appleid</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>YOUR_BUNDLE_ID</string>
    </array>
  </dict>
</array>
```

### 6. Android Configuration

#### Add to android/app/build.gradle
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-auth:20.5.0'
}
```

### 7. Install Pods (iOS)
```bash
cd ios && pod install && cd ..
```

### 8. Test Authentication
1. Run the app
2. Try signing in with email/password
3. Test Google Sign-In
4. Test Apple Sign-In (iOS only)

## Troubleshooting

### Common Issues
1. **SHA-1 fingerprint missing**: Add your app's SHA-1 to Firebase console
2. **Google Sign-In not working**: Check web client ID configuration
3. **Apple Sign-In issues**: Verify Apple Developer account settings
4. **Build errors**: Clean and rebuild the project

### Debug Commands
```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npx react-native run-android

# iOS
cd ios && xcodebuild clean && cd ..
npx react-native run-ios
```

## Security Notes
- Never commit API keys to version control
- Use environment variables for sensitive data
- Enable App Check for additional security
- Regularly rotate API keys 