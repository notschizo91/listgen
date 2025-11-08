import { pngToSvg, saveSvg } from './pngToSvg.js';
import { svgTo3D, svgFileToStl, saveStl } from './svgTo3d.js';
import path from 'path';
import { promises as fs } from 'fs';

/**
 * Convert SVG file directly to STL
 * @param {string} inputPath - Path to input SVG file
 * @param {object} options - Extrusion options
 * @returns {Promise<object>} - Paths to generated files
 */
export async function convertSvgToStl(inputPath, options = {}) {
  const {
    outputDir = './output',
    extrusionOptions = {}
  } = options;

  console.log('Starting SVG to STL conversion...');
  console.log(`Input: ${inputPath}`);

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Convert SVG to 3D
  console.log('\n[1/2] Extruding SVG to 3D...');
  const stlData = await svgFileToStl(inputPath, extrusionOptions);

  // Save STL
  console.log('\n[2/2] Saving STL file...');
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const stlPath = path.join(outputDir, `${baseName}.stl`);
  await saveStl(stlData, stlPath);

  console.log('\n✓ Conversion complete!');
  return { stl: stlPath };
}

/**
 * Complete pipeline: PNG/Image → SVG → 3D STL
 * @param {string} inputPath - Path to input image file
 * @param {object} options - Pipeline options
 * @returns {Promise<object>} - Paths to generated files
 */
export async function convertImageToStl(inputPath, options = {}) {
  const {
    outputDir = './output',
    svgOptions = {},
    extrusionOptions = {},
    saveSvgFile = true
  } = options;

  console.log('Starting Image to STL conversion pipeline...');
  console.log(`Input: ${inputPath}`);

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Step 1: Image to SVG
  console.log('\n[1/3] Converting image to SVG...');
  const svgContent = await pngToSvg(inputPath, svgOptions);

  const baseName = path.basename(inputPath, path.extname(inputPath));
  const svgPath = path.join(outputDir, `${baseName}.svg`);

  if (saveSvgFile) {
    await saveSvg(svgContent, svgPath);
  }

  // Step 2: SVG to 3D
  console.log('\n[2/3] Extruding SVG to 3D...');
  const stlData = await svgTo3D(svgContent, extrusionOptions);

  // Step 3: Save STL
  console.log('\n[3/3] Saving STL file...');
  const stlPath = path.join(outputDir, `${baseName}.stl`);
  await saveStl(stlData, stlPath);

  console.log('\n✓ Conversion complete!');
  return {
    svg: saveSvgFile ? svgPath : null,
    stl: stlPath
  };
}

/**
 * Batch convert multiple files
 * @param {string[]} inputPaths - Array of input file paths
 * @param {object} options - Pipeline options
 * @returns {Promise<Array>} - Array of results
 */
export async function batchConvert(inputPaths, options = {}) {
  const results = [];

  for (const inputPath of inputPaths) {
    try {
      const ext = path.extname(inputPath).toLowerCase();
      let result;

      if (ext === '.svg') {
        result = await convertSvgToStl(inputPath, options);
      } else {
        result = await convertImageToStl(inputPath, options);
      }

      results.push({ success: true, input: inputPath, ...result });
    } catch (error) {
      console.error(`Failed to convert ${inputPath}:`, error.message);
      results.push({ success: false, input: inputPath, error: error.message });
    }
  }

  const successful = results.filter(r => r.success).length;
  console.log(`\n✓ Batch conversion complete: ${successful}/${results.length} successful`);

  return results;
}

// Export all functions
export { pngToSvg, saveSvg, svgTo3D, svgFileToStl, saveStl };
