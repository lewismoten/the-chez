// A persistent music preference that leaves barks, effects, and the native game's rules alone.
import type { AudioEngine } from '@lewismoten/gamemaker-sandbox-engine';
type MusicAudio = Pick<AudioEngine, 'playSong' | 'stopSong' | 'resume'>;
type SessionMusic = { musicOn: boolean };
type Playing = { audio: MusicAudio; song?: Uint8Array; play: MusicAudio['playSong']; session?: SessionMusic; focus: () => void };

export function createMusicControl(button: HTMLButtonElement) {
  let enabled = true;
  try { enabled = localStorage.getItem('the-chez:music') !== 'off'; } catch { /* Keep an in-memory preference if storage is unavailable. */ }
  let active: Playing | undefined;
  const paint = () => {
    button.textContent = `Music ${enabled ? 'on' : 'off'}`;
    button.setAttribute('aria-pressed', String(enabled));
    button.setAttribute('aria-label', `Music ${enabled ? 'on' : 'off'}`);
    button.title = `Turn music ${enabled ? 'off' : 'on'}`;
  };
  paint();
  button.addEventListener('click', () => {
    enabled = !enabled;
    try { localStorage.setItem('the-chez:music', enabled ? 'on' : 'off'); } catch { /* The live control still works. */ }
    paint();
    const own = active;
    if (!own) return;
    if (own.session) own.session.musicOn = true;
    if (!enabled) own.audio.stopSong();
    else void own.audio.resume().then(() => { if (active === own && enabled) void own.audio.playSong(own.song); });
    own.focus();
  });
  return (audio: MusicAudio, focus: () => void) => {
    const own: Playing = { audio, play: audio.playSong.bind(audio), focus };
    // Keep the latest request while muted, including scene changes and ending music.
    // The public engine API stops pending song loads too; effect playback is untouched.
    audio.playSong = async (bytes) => {
      own.song = bytes;
      if (!enabled) { audio.stopSong(); return false; }
      return own.play(bytes);
    };
    active = own;
    return {
      track: (bytes: Uint8Array | undefined) => { own.song = bytes; },
      session: (session: SessionMusic) => { own.session = session; },
      release: () => { if (active === own) active = undefined; },
    };
  };
}
