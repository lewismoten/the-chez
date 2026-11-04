// Gentle level guidance from the engine's counters and position; the native game keeps every rule.
import { CHAPTERS, type ChapterInfo } from './chapters';

export function roadMessage(chapter: ChapterInfo, found: number, nearGate = false): string {
  if (chapter.required === 0) return nearGate ? 'The finish is just ahead. Keep holding Right.' : chapter.mission;
  const remaining = Math.max(0, chapter.required - found);
  if (remaining === 0) return chapter.found ?? (chapter.required === 1 ? 'Tape found. Walk into the garage door.' : 'Both things fetched. Walk into the garage door.');
  if (nearGate) return `The garage wants ${remaining} more ${remaining === 1 ? 'thing' : 'things'}. ${chapter.help}`;
  return chapter.mission;
}

export function fillRoadAtlas(list: HTMLOListElement): void {
  for (const [index, chapter] of CHAPTERS.filter((entry) => !entry.continues).entries()) {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'road-number';
    number.textContent = String(index + 1).padStart(2, '0');
    number.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    const title = document.createElement('h3');
    title.textContent = chapter.name;
    const blurb = document.createElement('p');
    blurb.textContent = chapter.blurb;
    copy.append(title, blurb);
    item.append(number, copy);
    list.append(item);
  }
}
