'use client';
import { useState } from 'react';
import { track } from '@/lib/analytics';
import { Concept, Glyph, Kicker } from './primitives';
import { Media } from './media';

const columns = ['Scheduled', 'In production', 'Ready for review'];
const jobs = [
  { address: '18 Maple Avenue', services: 'Photography · Floor plan', owner: 'Sam · Photographer', initials: 'SA', next: 'Complete the Tuesday shoot', stage: 0, image: 'interior' as const },
  { address: '6 Wattle Crescent', services: 'Photography · Drone', owner: 'Taylor · Photographer', initials: 'TA', next: 'Check property access notes', stage: 0, image: 'exterior' as const },
  { address: '42 Bay Street', services: 'Photography · Drone · Floor plan', owner: 'Jamie · Editor', initials: 'JA', next: 'Finish the photo edits', stage: 1, image: 'exterior' as const },
  { address: '12 Cedar Place', services: 'Photography', owner: 'Morgan · Editor', initials: 'MO', next: 'Apply the review notes', stage: 1, image: 'interior' as const },
  { address: '9 Olive Lane', services: 'Photography · Drone', owner: 'Alex · Coordinator', initials: 'AL', next: 'Review the edited photo set', stage: 2, image: 'twilight' as const },
  { address: '24 Ocean Drive', services: 'Photography · Floor plan', owner: 'Alex · Coordinator', initials: 'AL', next: 'Approve or request changes', stage: 2, image: 'interior' as const },
];
export default function ProductionBoard() {
  const [filter, setFilter] = useState(-1);
  return <section className="pl-section pl-board-section"><div className="pl-wrap"><div className="pl-section-heading"><div><Kicker light>THE COORDINATOR’S VIEW</Kicker><h2>See what’s moving.<br /><em>Spot what needs you.</em></h2></div><p>For the owner, the bigger picture. For the coordinator, a clear next step—without asking everyone for an update.</p></div><div className="pl-board"><div className="pl-board-header"><div><span className="pl-board-mark"><Glyph name="folder" /></span><div><h3>Production overview</h3><p>Sample studio · All jobs and counts are illustrative</p></div></div><Concept>Board concept</Concept></div><div className="pl-board-filters" role="group" aria-label="Filter illustrative production board">{['All jobs', ...columns].map((name, i) => <button type="button" key={name} aria-pressed={filter === i - 1} onClick={() => { setFilter(i - 1); track('board_filter', { category: name }); }}>{name}<span>{i === 0 ? jobs.length : jobs.filter(job => job.stage === i - 1).length}</span></button>)}</div><p className="pl-sr-only" role="status">Showing {filter === -1 ? 6 : 2} illustrative jobs.</p><div className={`pl-board-columns${filter !== -1 ? ' pl-board-filtered' : ''}`}>{columns.map((name, i) => (filter === -1 || filter === i) && <section className={`pl-board-column pl-board-column-${i}`} key={name} aria-label={`${name} illustrative jobs`}><div className="pl-column-title"><span /><h4>{name}</h4><span className="pl-column-count">2</span></div><div className="pl-board-cards">{jobs.filter(job => job.stage === i).map((job, j) => <article className="pl-board-card" key={job.address}>{j === 0 && <div className="pl-board-card-photo"><Media name={job.image} alt={`Illustrative property photograph for the fictional ${job.address} job`} sizes="(max-width: 760px) 90vw, 30vw" /></div>}<div className="pl-board-card-body"><h4>{job.address}</h4><p>{job.services}</p><div className="pl-board-owner"><span className="pl-person">{job.initials}</span>{job.owner}</div><div className="pl-board-next"><Glyph name="arrow" /><span>{job.next}</span></div></div></article>)}</div></section>)}</div><div className="pl-board-note"><Glyph name="review" />A planned view of job status and ownership—not live production data.</div></div></div></section>;
}
