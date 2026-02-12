import { MusicPlayer } from "@/components/MusicPlayer";

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black p-16 sm:p-24">
      <MusicPlayer />
    </div>
  );
}
