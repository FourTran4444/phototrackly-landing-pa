'use client';
import { track } from '@/lib/analytics';
import { Glyph, Kicker } from './primitives';
export const QUESTIONS = [
  ['Is PhotoTrackly available now?', 'Not yet. PhotoTrackly is in development. Joining early access registers your interest and helps us understand your team’s workflow. It does not create a product account or guarantee immediate access. The examples on this page are illustrative concepts, not live product screenshots.'],
  ['Does joining early access cost anything?', 'No. Registration is free, with no payment details and no mandatory sales call. Product pricing and launch timing have not been finalized. Registering your interest does not commit you to a paid plan.'],
  ['What are the priorities for the first release?', 'The initial focus is one shared property job: orders and configurable services, scheduling, manual photographer assignments, files and production handoffs, review, and approved-media delivery. We’re learning from owners and coordinators as we refine the scope; planned features may change.'],
  ['Will AI assign photographers automatically?', 'Manual assignment is an initial priority, so coordinators stay in control. Rules-based or AI-assisted assignment is a later direction to explore, not a promised first-release feature.'],
  ['Who are you inviting to help shape the product?', 'Owners and operations coordinators at growing real estate photography and property media businesses, especially in the United States and Australia. If your team coordinates multiple shoots, people, and production handoffs across separate tools, we’d like to understand where the work gets stuck.'],
];
export default function FAQ() {
  return <section className="pl-section pl-faq" id="questions"><div className="pl-wrap pl-faq-grid"><div><Kicker>GOOD TO KNOW</Kicker><h2>A few answers.<br /><em>No fine-print surprises.</em></h2><p>We’re building thoughtfully, and we want to be clear about where things stand.</p></div><div>{QUESTIONS.map(([q, a], i) => <details key={q} name="early-access-faq" onToggle={event => { if (event.currentTarget.open) track('faq_open', { question: String(i + 1) }); }}><summary>{q}<span><Glyph name="plus" /></span></summary><p>{a}</p></details>)}</div></div></section>;
}
