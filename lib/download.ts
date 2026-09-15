import type { Job } from './model';

export function download(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; document.body.append(anchor);
  anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadManifest(job: Job) {
  download(JSON.stringify({
    preview: true,
    notice: 'Local illustrative metadata only. This file does not include media, hosted downloads, or a client delivery link.',
    jobId: job.id, property: job.address, city: job.city, client: job.client,
    services: job.services, fileCount: job.fileCount, attachedMetadata: job.files,
    humanReviewApproved: job.approved,
  }, null, 2), 'application/json', `${job.id}-preview-manifest.json`);
}
