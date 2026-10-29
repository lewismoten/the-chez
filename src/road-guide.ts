// Gentle road guidance from the engine's counters and position; the native game keeps every rule.
import { CHAPTERS, type ChapterInfo } from './chapters';

export function roadMessage(chapter: ChapterInfo, found: number, nearGate = false, leafReady = false): string {
  const driving = chapter.mode === 'drive';
  const remaining = Math.max(0, chapter.required - found);
  const noun = driving ? 'cheer' : 'stripe';
  if (chapter.errand === 'leaf') {
    if (!leafReady) {
      if (nearGate) return 'The wooden gate needs Gwinn’s leaf. Ride the return stream on the LEFT; the leaf is above the hedge.';
      if (remaining === 0) return 'Stripes ready. Ride up, then LEFT for Gwinn’s leaf. Bring it RIGHT to the wooden gate.';
      return `Find ${chapter.required} stripes and Gwinn’s leaf. Ride up, then LEFT along the upper branch. Bring the leaf RIGHT to the wooden gate.`;
    }
    if (remaining > 0)
      return `Leaf rescued! Find ${remaining} more stripe${remaining === 1 ? '' : 's'} along the trail to the RIGHT, then reach THE\u00a0CHEZ.`;
  }
  const rescued = chapter.errand === 'leaf' ? 'Leaf rescued! ' : '';
  if (remaining === 0)
    return driving ? 'The crowd approves! Finish at HOME on the left.' : `${rescued}Your stripes are ready. Reach THE\u00a0CHEZ on the right.`;
  if (nearGate) return `${chapter.actor ?? 'Teddy'} needs ${remaining} more ${noun}${remaining === 1 ? '' : 's'}. ${chapter.help}`;
  return `${rescued}Gather ${chapter.required} ${noun}s. ${chapter.mission}`;
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
