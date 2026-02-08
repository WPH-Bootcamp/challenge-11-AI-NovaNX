[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/3LBkOAqm)
# Challenge 11: Music Player Motion Component

Halo team! Selamat datang di challenge ke-11. Kali ini kita akan belajar membuat komponen music player dengan animasi yang smooth dan interaktif menggunakan Motion (Framer Motion) dan React.

## Tentang Challenge Ini

Challenge ini dirancang untuk mengasah kemampuanmu dalam:
- Mengimplementasikan animasi yang kompleks dengan Motion
- Mengelola state untuk berbagai kondisi komponen
- Membuat transisi yang smooth antar state
- Mengoptimalkan performa animasi
- Menerapkan design system yang konsisten

Jangan terburu-buru, ambil waktu untuk memahami setiap requirement dan implementasikan dengan teliti. Quality over speed, ya!

## Design Reference

Desain lengkap untuk music player ini bisa kamu lihat di Figma:
[Music Player Controls - Figma](https://www.figma.com/design/2VCdszrh6dTWmqcSw5IjAw/Music-Player-Controls?node-id=17488-16700&t=6NmLM1z6n5zUTLW9-1)

Pastikan kamu sudah membuka dan mempelajari desainnya sebelum mulai coding. Perhatikan detail-detail kecil seperti spacing, warna, dan interaksi yang ada di desain.

## Setup yang Sudah Dikonfigurasi

### Design System

Semua warna, spacing, dan design tokens sudah diimplementasikan di `globals.css`. Kamu bisa menggunakan custom properties yang sudah disediakan atau menambahkan yang baru sesuai kebutuhan dari Figma.

### Typography

Extended typography classes tersedia di `tailwind.config.ts`. Contohnya, kamu bisa menggunakan `display-2xl-bold` sebagai alternatif dari `display-2xl font-bold`.

### Spacing System

Custom spacing unit sudah diset ke 1px ratio (1:1) bukan default Tailwind yang 4px (1:4). Ini berarti:
- `p-1` = 1px (bukan 4px)
- `p-4` = 4px (bukan 16px)
- `p-16` = 16px (bukan 64px)

Perhatikan ini saat menggunakan spacing classes di Tailwind!

## Requirements Animasi

### Player States

Music player harus memiliki tiga state yang berbeda:

1. **Playing** - State ketika musik sedang diputar
2. **Paused** - State ketika musik di-pause
3. **Loading** - State transisi antara playing dan paused

### Container Animations

#### Background & Shadow Transitions

Animasikan background color dan box shadow container berdasarkan state:
- Duration: 300ms
- Easing: Default ease
- Terapkan shadow yang berbeda untuk playing (purple glow) vs paused states

### Album Artwork Animations

#### Rotation Animation (Playing State)

- Transform: Rotasi 360 derajat secara kontinyu
- Duration: 20 detik per putaran penuh
- Easing: Linear
- Behavior: Infinite loop, hanya ketika playing

#### Scale Transitions

Animasikan perubahan scale antar state:
- Playing: `scale(1)`
- Paused: `scale(0.95)`
- Loading: `scale(0.9)`
- Duration: 300ms
- Easing: Spring animation direkomendasikan

### Equalizer Bars Animation

#### Individual Bar Animation (Playing State)

Setiap bar harus animasi secara independen:
- Property: Height (dari 20% ke 100%)
- Duration: 500ms per cycle
- Direction: Alternate (bolak-balik)
- Repeat: Infinite
- Easing: ease-in-out

#### Stagger Effect

Buat efek wave dengan stagger animations:
- Delay: 100ms
- Contoh: Bar 1 (0ms), Bar 2 (100ms), Bar 3 (200ms), dst.

#### State Transitions

- Paused: Semua bars di 20% height
- Loading: Semua bars di 50% height dengan opacity 0.5
- Transition Duration: 300ms

### Progress Bar Animation

#### Fill Animation

- Transisi width yang smooth saat lagu berjalan
- Duration: 300ms untuk state changes
- Perubahan warna berdasarkan playing/paused state

### Control Button Interactions

#### Play/Pause Button

- Hover: Scale ke 1.05
- Active (tap): Scale ke 0.95
- Transition: Spring animation
- Loading State: Disabled dengan gray background

#### Skip & Control Buttons

- Hover: Color transition ke white
- Active State: Visual feedback saat di-press

### State Change Sequence

Saat toggle antara playing dan paused:
1. Button masuk ke loading state
2. Tunggu 500ms (simulasi async operation)
3. Transisi ke state baru
4. Update semua elemen yang teranimasi sesuai state baru

### Volume Slider

#### Hover Effects

- Fill color transition dari neutral ke purple saat hover
- Duration: 200ms

## Tips Implementasi

### Menggunakan Motion Variants

Pertimbangkan menggunakan variant system dari Motion untuk React untuk mengelola tiga state (playing, paused, loading) dengan efisien:

```typescript
const variants = {
  playing: {
    /* playing animations */
  },
  paused: {
    /* paused animations */
  },
  loading: {
    /* loading animations */
  },
};
```

### Animation Orchestration

- Gunakan `AnimatePresence` untuk transisi yang smooth
- Terapkan delay values individual untuk equalizer bars untuk membuat stagger effect
- Terapkan transition props untuk timing yang konsisten

### Performance Considerations

- Gunakan `transform` dan `opacity` untuk animasi (GPU-accelerated)
- Hindari animasi `width`/`height` jika memungkinkan (gunakan `scale` sebagai gantinya)
- Pertimbangkan `will-change` untuk elemen yang sering di-animasi

## Kriteria Evaluasi

Implementasimu akan dievaluasi berdasarkan:

1. **Functionality** - Semua tiga state bekerja dengan benar
2. **Animation Quality** - Animasi yang smooth, performant, dan sesuai spesifikasi
3. **Code Quality** - Kode React yang bersih dan maintainable
4. **Attention to Detail** - Implementasi timing, easing, dan stagger effects yang presisi

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Install required libraries:
```bash
npm install motion lucide-react
```

3. Run development server:
```bash
npm run dev
```

4. Mulai implementasi di `src/components/MusicPlayer.tsx`

5. Test semua state dan transisi dengan teliti

## Struktur File

```
src/
  app/
    page.tsx          # Halaman utama yang render MusicPlayer
    globals.css       # Design system tokens
  components/
    MusicPlayer.tsx   # Komponen utama yang perlu kamu implementasikan
```

## Resources yang Bisa Membantu

- [Motion Documentation](https://motion.dev/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Catatan Penting

- Pastikan semua animasi smooth dan tidak ada jank
- Perhatikan detail timing dan easing untuk setiap animasi
- Test di berbagai ukuran layar jika diperlukan
- Jangan lupa handle edge cases (misalnya rapid clicking pada play/pause button)

## Final Words

Ini adalah challenge yang cukup menantang, tapi jangan khawatir. Ambil langkah demi langkah, mulai dari struktur dasar, lalu tambahkan animasi satu per satu. Jangan lupa untuk test setiap fitur yang kamu implementasikan.

Jika ada yang kurang jelas, jangan ragu untuk bertanya. Good luck dengan implementasimu! Semangat - Mentor Henry Rivardo
