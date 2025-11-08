import { test } from 'node:test';
import assert from 'node:assert';
import { svgTo3D } from '../src/svgTo3d.js';
import { promises as fs } from 'fs';
import path from 'path';

test('SVG extrusion - simple square', async () => {
  const simpleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10 10 L 90 10 L 90 90 L 10 90 Z" fill="black"/>
</svg>`;

  const stlData = await svgTo3D(simpleSvg, { height: 5 });

  assert.ok(stlData, 'STL data should be generated');
  assert.ok(stlData.byteLength > 0, 'STL data should have content');
  assert.ok(stlData.byteLength > 84, 'STL file should have header + triangles');
});

test('SVG extrusion - with twist', async () => {
  const simpleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 30 30 L 70 30 L 70 70 L 30 70 Z" fill="black"/>
</svg>`;

  const stlData = await svgTo3D(simpleSvg, {
    height: 10,
    twistAngle: 45
  });

  assert.ok(stlData, 'STL data should be generated with twist');
  assert.ok(stlData.byteLength > 84, 'STL should contain geometry');
});

test('SVG extrusion - multiple paths', async () => {
  const multiPathSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10 10 L 40 10 L 40 40 L 10 40 Z" fill="black"/>
  <path d="M 60 60 L 90 60 L 90 90 L 60 90 Z" fill="black"/>
</svg>`;

  const stlData = await svgTo3D(multiPathSvg, { height: 5 });

  assert.ok(stlData, 'STL data should be generated from multiple paths');
  assert.ok(stlData.byteLength > 84, 'STL should contain combined geometry');
});

test('SVG extrusion - handles relative path commands', async () => {
  const relativeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10 10 l 30 0 l 0 30 l -30 0 z" fill="black"/>
</svg>`;

  const stlData = await svgTo3D(relativeSvg, { height: 5 });

  assert.ok(stlData, 'STL should handle relative path commands');
  assert.ok(stlData.byteLength > 84, 'STL should contain valid geometry');
});

test('SVG extrusion - rotate mode', async () => {
  const profileSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 50 20 L 70 30 L 70 70 L 50 80 L 50 20 Z" fill="black"/>
</svg>`;

  const stlData = await svgTo3D(profileSvg, {
    mode: 'rotate'
  });

  assert.ok(stlData, 'STL should be generated in rotate mode');
  assert.ok(stlData.byteLength > 84, 'Rotated STL should contain geometry');
});

test('SVG extrusion - error on empty SVG', async () => {
  const emptySvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
</svg>`;

  await assert.rejects(
    async () => await svgTo3D(emptySvg, { height: 5 }),
    /No path data found/,
    'Should throw error for SVG without paths'
  );
});

test('SVG extrusion - error on invalid path', async () => {
  const invalidSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
  <path d="M 10 10" fill="black"/>
</svg>`;

  await assert.rejects(
    async () => await svgTo3D(invalidSvg, { height: 5 }),
    /No valid geometries/,
    'Should throw error for invalid path with too few points'
  );
});
