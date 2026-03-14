# Top Kafa - Play Store Listing

## App Information

**Package Name:** com.topkafa.game
**App Name:** Top Kafa - Arcade Soccer
**Short Description:** Fun arcade soccer with big-head characters!
**Category:** Games > Sports

---

## Store Listing (English)

### Title
Top Kafa - Arcade Soccer

### Short Description (80 characters max)
Fun arcade soccer with big-head cartoon characters! Play 1v1 & score goals! ⚽

### Full Description
🎮 **TOP KAFA - The Ultimate Big Head Soccer Game!**

Experience the most fun and addictive arcade soccer game! Top Kafa brings you intense 1v1 soccer action with adorable big-head cartoon characters.

⚽ **GAME FEATURES:**
• Fast-paced 1v1 soccer matches
• Play against friends or challenging AI
• Multiple difficulty levels (Easy, Medium, Hard)
• Tournament mode - Best of 3, 5, or 7
• Power-ups: Speed Boost, Power Kick, Shield
• Combo system for amazing plays
• Beautiful pixel-art inspired graphics
• Catchy arcade soundtrack

🎯 **GAME MODES:**
• VS Player - Challenge your friends locally!
• VS AI - Test your skills against smart computer opponents
• Tournament - Compete in exciting tournament brackets

🏆 **HOW TO PLAY:**
• Player 1: WASD to move, SPACE to kick/slide
• Player 2: Arrow keys to move, SHIFT to kick/slide
• Score more goals than your opponent to win!

📱 **OPTIMIZED FOR:**
• Smooth gameplay on all devices
• Touch-friendly controls
• Offline play supported

Download now and become the Top Kafa champion! ⚽🏆

---

## Store Listing (Turkish)

### Başlık
Top Kafa - Arcade Futbol

### Kısa Açıklama (80 karakter max)
Büyük kafalı karakterlerle eğlenceli arcade futbol! 1v1 oyna ve gol at! ⚽

### Tam Açıklama
🎮 **TOP KAFA - En Eğlenceli Kafa Topu Oyunu!**

En eğlenceli ve bağımlılık yapıcı arcade futbol oyununu deneyimle! Top Kafa, sevimli büyük kafalı çizgi film karakterleriyle yoğun 1v1 futbol aksiyonu sunuyor.

⚽ **OYUN ÖZELLİKLERİ:**
• Hızlı tempolu 1v1 futbol maçları
• Arkadaşlarınla veya yapay zeka ile oyna
• Birden fazla zorluk seviyesi (Kolay, Orta, Zor)
• Turnuva modu - 3, 5 veya 7 maçın en iyisi
• Güçlendirmeler: Hız Artışı, Güçlü Şut, Kalkan
• Muhteşem oyunlar için kombo sistemi
• Güzel piksel-art tarzı grafikler
• Akılda kalan arcade müzikleri

🎯 **OYUN MODLARI:**
• Oyuncuya Karşı - Arkadaşlarına meydan oku!
• Yapay Zekaya Karşı - Akıllı bilgisayar rakiplerine karşı yeteneklerini test et
• Turnuva - Heyecan verici turnuva gruplarında yarış

🏆 **NASIL OYNANIR:**
• Oyuncu 1: WASD hareket, SPACE şut/kayma
• Oyuncu 2: Ok tuşları hareket, SHIFT şut/kayma
• Kazanmak için rakibinden daha fazla gol at!

📱 **OPTİMİZE EDİLMİŞ:**
• Tüm cihazlarda akıcı oynanış
• Dokunmatik uyumlu kontroller
• Çevrimdışı oyun desteği

Şimdi indir ve Top Kafa şampiyonu ol! ⚽🏆

---

## Required Assets

### App Icon
- 512x512 PNG (High-res icon)
- Use the game logo with soccer ball theme

### Feature Graphic
- 1024x500 PNG
- Show gameplay with both characters and ball

### Screenshots (Minimum 2, Maximum 8)
1. **Gameplay** - 1152x768 - Active match with both players
2. **Main Menu** - 1152x768 - Title screen with options
3. **Goal Celebration** - 1152x768 - Goal scored moment
4. **Tournament Mode** - 1152x768 - Tournament bracket
5. **Power-ups** - 1152x768 - Player with active power-up

### Promo Video (Optional)
- 30 seconds to 2 minutes
- Show gameplay highlights
- Include tournament mode

---

## Content Rating

**IARC Rating:** Everyone / PEGI 3
- No violence
- No in-app purchases (if no monetization)
- Contains ads

---

## Technical Requirements

### TWA (Trusted Web Activity) Setup

1. Generate signing key:
```bash
keytool -genkey -v -keystore topkafa-release-key.keystore -alias topkafa -keyalg RSA -keysize 2048 -validity 10000
```

2. Get SHA-256 fingerprint:
```bash
keytool -list -v -keystore topkafa-release-key.keystore -alias topkafa
```

3. Update `assetlinks.json` with your SHA-256 fingerprint

4. Build TWA using Bubblewrap:
```bash
npx @aspect/aspect-aspect init
npx @aspect/aspect-aspect build
```

### Alternative: PWABuilder

1. Visit https://www.pwabuilder.com/
2. Enter your deployed URL
3. Generate Android package
4. Download and sign the APK

---

## Privacy Policy URL

Required for Play Store. Create at:
`https://yourdomain.com/privacy-policy`

---

## Checklist Before Submission

- [ ] App icon (512x512) created
- [ ] Feature graphic (1024x500) created
- [ ] At least 2 screenshots captured
- [ ] Privacy policy page live
- [ ] assetlinks.json configured with correct SHA-256
- [ ] Service Worker functioning
- [ ] Manifest.json complete
- [ ] Tested on Android device
- [ ] Content rating questionnaire completed
