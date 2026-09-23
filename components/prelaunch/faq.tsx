'use client';
import { track } from '@/lib/analytics';
const questions = [
  ['Is PhotoTrackly available now?', 'It is in development. Joining early access registers your interest and helps us learn how property media teams work. It does not create an account or guarantee immediate access.'],
  ['Do I have to pay or book a sales call?', 'No. Registration is free and does not require a meeting. We may invite you to an optional conversation about your workflow.'],
  ['What will the first release include?', 'We are prioritizing jobs and customer details, configurable services, scheduling, manual assignments, materials, production progress, review and client delivery. Plans may change as we learn from teams.'],
  ['Will PhotoTrackly use AI to assign photographers?', 'Rules-based and AI-assisted assignment are later directions. The first release focuses on a reliable operational foundation and manual assignment.'],
];
export default function FAQ() {
  return <section className="rf-section rf-faq" id="faq"><div className="rf-wrap rf-faq-grid"><div><p className="rf-eyebrow">GOOD TO KNOW</p><h2>About early access.</h2></div><div>{questions.map(([question,answer],i) => <details key={question} open={i === 0} onToggle={e => { if (e.currentTarget.open) track('faq_open', { category: String(i + 1) }); }}><summary>{question}</summary><p>{answer}</p></details>)}</div></div></section>;
}
