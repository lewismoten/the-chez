// Gentle road guidance from the engine's counters and position; the native game keeps every rule.
import { CHAPTERS, type ChapterInfo } from './chapters';

export function roadMessage(chapter: ChapterInfo, found: number, nearGate = false): string {
  const driving = chapter.mode === 'drive';
  const remaining = Math.max(0, chapter.required - found);
  const noun = driving ? 'cheer' : 'stripe';
  if (remaining === 0) return driving
    ? 'The crowd approves! Finish at HOME on the left.'
    : 'Your stripes are ready. Meet Doc Leo and THE\u00a0CHEZ on the right.';
  if (nearGate) return `Teddy needs ${remaining} more ${noun}${remaining === 1 ? '' : 's'}. ${chapter.help}`;
  return `Gather ${chapter.required} ${noun}s. ${chapter.mission}`;
}

export function fillRoadAtlas(list: HTMLOListElement): void {
  for (const [index, chapter] of CHAPTERS.entries()) {
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
