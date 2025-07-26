# Assets Setup Guide

## Current Status
The assets directory has been created but contains placeholder files only. This resolves the webpack build failures but proper assets should be added for production.

## Required Assets for Production

### App Icon (`icon.png`)
- **Size**: 1024x1024 pixels
- **Format**: PNG with transparency
- **Purpose**: Main app icon for all platforms

### Favicon (`favicon.png`) 
- **Size**: 32x32 or 16x16 pixels
- **Format**: PNG
- **Purpose**: Web browser favicon

### Splash Screen (`splash.png`)
- **Size**: 1242x2436 pixels (or other standard splash sizes)
- **Format**: PNG with transparency
- **Purpose**: Loading screen when app starts

### Android Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024x1024 pixels  
- **Format**: PNG with transparency
- **Purpose**: Android adaptive icon foreground

## How to Add Assets

1. Create or obtain the required asset files
2. Place them in the `frontend/assets/` directory
3. Update `app.json` to reference the assets:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#2e7d32"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#2e7d32"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## Temporary Workaround

Currently, the app.json has been configured to work without asset files by:
- Removing icon references
- Using solid colors for splash screen and adaptive icon backgrounds  
- Removing favicon reference for web builds

This allows the app to build and run while proper assets are being created.

## Design Guidelines

### Brand Colors
- **Primary Green**: #2e7d32
- **Light Green**: #66bb6a  
- **Background**: #f9f9f9
- **White**: #ffffff

### Icon Design
- Use the Splitwiser green color scheme
- Include a recognizable symbol for bill splitting (e.g., dollar sign, split arrows)
- Ensure good contrast and visibility at small sizes
- Follow platform-specific design guidelines

## Tools for Asset Creation

### Free Tools
- **GIMP**: Free image editor
- **Canva**: Online design tool with templates
- **Figma**: Free design tool with app icon templates

### Online Generators
- **App Icon Generator**: Generate all required sizes from one image
- **Favicon Generator**: Create favicons from images
- **Expo Asset Generator**: Built-in Expo tools

## Testing Assets

After adding assets:
1. Run `npx expo start` to test locally
2. Check that icons appear correctly in Expo Go
3. Test web build to ensure favicon works
4. Verify splash screen displays properly

## Future Considerations

- Add app store screenshots
- Create promotional graphics
- Design notification icons
- Consider animated splash screens
- Add dark mode variants if supporting dark theme

---

**Status**: Assets directory created, build errors resolved  
**Next Step**: Add proper production assets when design is finalized
