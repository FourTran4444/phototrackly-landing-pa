export type Resource = {
  slug: string;
  title: string;
  description: string;
  intro: string;
  updated: string;
  sections: { heading: string; body: string; items: string[] }[];
  takeaway: string;
};
export const resources: Resource[] = [
  {
    slug: 'shoot-to-delivery-checklist',
    title: 'Property media shoot-to-delivery checklist',
    description: 'A practical checklist for coordinating a real estate media job from client brief and shoot through editing, approval and delivery.',
    intro: 'Use this checklist when one property job includes several services and people. Give each stage a named owner, an expected output and a clear handoff. Adapt the sequence to your studio and your client agreement.',
    updated: 'September 2026',
    sections: [
      { heading: '1. Confirm the request', body: 'Before booking, make one job record that everyone can identify.', items: ['Record client, property address, contact and requested delivery date.', 'List each ordered service and add-on separately: photography, video, drone, floor plan or tour.', 'Collect access instructions, property readiness notes and usage requirements.', 'Confirm what is included and what still needs an answer from the client.'] },
      { heading: '2. Plan the shoot', body: 'The appointment should carry the complete brief, not just a time slot.', items: ['Confirm date, time, local time zone, site contact and access arrangements.', 'Assign a photographer and acknowledge the brief.', 'Check equipment or specialist needs for each service.', 'Record changes in the job so the team knows which instructions are current.'] },
      { heading: '3. Receive and produce', body: 'Make the source-to-editor handoff explicit.', items: ['Confirm which source files arrived for each service.', 'Name the editor or production owner and the expected deliverables.', 'Flag missing inputs before work is marked ready for review.', 'Track editing progress and note any deadline or scope change.'] },
      { heading: '4. Review and deliver', body: 'A completed edit and an approved client handoff are different states.', items: ['Check required files, format and coverage against the order.', 'Record revisions with an owner and a decision on each item.', 'Mark approved items and confirm the final package is complete.', 'Send the agreed handoff and record when it was delivered.'] },
    ],
    takeaway: 'For every open job, the coordinator should be able to answer: who owns the next action, what is missing, and what is safe to deliver?',
  },
  {
    slug: 'photographer-handoff-template',
    title: 'Property photographer handoff template',
    description: 'A copyable photographer brief covering property access, schedule, ordered services, capture notes and source-file handoff.',
    intro: 'A photographer should not have to reconstruct a shoot from scattered messages. Copy these fields into your job record and fill them before assignment.',
    updated: 'September 2026',
    sections: [
      { heading: 'Job and appointment', body: 'Identify the assignment unambiguously.', items: ['Job reference: [internal ID] · Client: [name] · Property: [address].', 'Shoot: [date, local time and time zone] · On-site contact: [name and phone].', 'Assigned photographer: [name] · Coordinator: [name].', 'Access: [entry method, parking, restrictions and contingencies].'] },
      { heading: 'Services and capture instructions', body: 'State what the client ordered and what the team should capture.', items: ['Services: [photos / video / drone / floor plan / other] and quantities if agreed.', 'Property priorities: [rooms, exterior angles, special features].', 'Site readiness: [staging, occupants, pets, weather considerations].', 'Specific exclusions or permissions: [areas to avoid, drone clearance confirmed by the operator].'] },
      { heading: 'Source-file handoff', body: 'Give production a reliable starting point after the shoot.', items: ['Upload destination: [approved folder or job record] · File naming: [team convention].', 'Expected source sets: [one entry for each ordered service].', 'Notify production by: [time and channel] · Name the editor or coordinator who receives the files.', 'Flag missing coverage or on-site changes immediately with a short note.'] },
    ],
    takeaway: 'Before sending the brief, ask the assigned photographer to confirm the appointment, access, ordered services and where source files will go.',
  },
  {
    slug: 'media-editing-review-checklist',
    title: 'Real estate media editing and review checklist',
    description: 'A practical human review checklist for property photography, video and other media before client delivery.',
    intro: 'Use this as a shared review record after editing. The checks should reflect the services sold and the client agreement; a quality decision still belongs to your team.',
    updated: 'September 2026',
    sections: [
      { heading: 'Match the order', body: 'Start with the original scope rather than the folder contents alone.', items: ['Confirm every ordered service has its expected deliverable.', 'Check that filenames and property identifiers point to the correct job.', 'Identify missing source material or unresolved coverage gaps.', 'Verify that optional add-ons have a clear status.'] },
      { heading: 'Review the media', body: 'Use a human reviewer and the standards your studio has agreed with the client.', items: ['Check representative images for exposure, color, alignment and visible artifacts.', 'Review video playback, audio where relevant, captions and export format.', 'Inspect floor plan labels and dimensions where that service was ordered.', 'Check that selected images and media reflect agreed coverage and usage constraints.'] },
      { heading: 'Close revisions', body: 'Make each change request traceable.', items: ['Write the issue on the specific deliverable and assign an owner.', 'Record whether the change needs a new export, a client decision or another shoot.', 'Recheck the revised file before marking it approved.', 'Confirm the final package contains only approved versions.'] },
      { heading: 'Prepare delivery', body: 'Perform one last handoff check.', items: ['Open the delivery link with the same access level the client will have.', 'Verify the package, file formats and agreed instructions.', 'Record the reviewer, approval status and delivery time.'] },
    ],
    takeaway: 'Do not treat an uploaded file as approved. Keep “received,” “edited,” “needs revision,” and “approved” distinct.',
  },
  {
    slug: 'property-job-status-board-template',
    title: 'Property media job status board template',
    description: 'Set up a simple status board for property photography jobs with an owner, next action, blockers and delivery readiness.',
    intro: 'A useful board answers what needs attention without asking the owner to remember every shoot. Start with one row per property job, then adapt the stages to your team.',
    updated: 'September 2026',
    sections: [
      { heading: 'Columns to track', body: 'Keep the board compact enough for a daily review.', items: ['Job reference and property address: use a stable identifier.', 'Client, ordered services and requested delivery date.', 'Current stage, current owner and the next action.', 'Blocker or missing input, with the person who can resolve it.', 'Last update time and delivery readiness.'] },
      { heading: 'Suggested stages', body: 'These are examples, not universal rules.', items: ['Brief incomplete → ready to schedule → scheduled.', 'Shot → waiting for files → editing.', 'Ready for review → revision needed → approved.', 'Ready for delivery → delivered.'] },
      { heading: 'Daily operating rhythm', body: 'Use a short review to move work forward.', items: ['Look first at overdue work and jobs with no named next owner.', 'Ask whether a blocked job needs information, a decision or a new date.', 'Check whether approved deliverables match everything ordered.', 'Update the record where the team actually works, then notify the next owner.'] },
    ],
    takeaway: 'If a status says “in progress” but does not identify the owner and next action, the board is missing the part that helps the team.',
  },
];
export const resourceSlugs = resources.map(item => item.slug);
export const getResource = (slug: string) => resources.find(item => item.slug === slug);
