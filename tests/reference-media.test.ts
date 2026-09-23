import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

test('five source photographs are byte-identical local copies of the approved reference assets', () => {
  const manifest = JSON.parse(readFileSync(new URL('../reference-media.json', import.meta.url), 'utf8'));
  assert.equal(manifest.images.length, 5);
  for (const image of manifest.images) {
    const bytes = readFileSync(new URL('../' + image.file, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), image.sha256);
    assert.equal(bytes.length, image.bytes);
    assert.equal(bytes.subarray(0,4).toString(), 'RIFF');
    assert.equal(bytes.subarray(8,12).toString(), 'WEBP');
    assert.ok(image.source.startsWith('https://phototrackly-operations.tranvantubk.chatgpt.site/'));
    assert.ok(image.alt.length > 10);
  }
});
