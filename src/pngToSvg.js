import { vectorize, ColorMode, Hierarchical, PathSimplifyMode } from '@neplex/vectorizer';
import { promises as fs } from 'fs';

/**
 * Convert a PNG/image file to SVG using vectorization
 * @param {string} inputPath - Path to input image file
 * @param {object} options - Conversion options
 * @returns {Promise<string>} - SVG content as string
 */
export async function pngToSvg(inputPath, options = {}) {
  const {
    threshold = 128,
    turdSize = 2,
    optCurve = true,
    optTolerance = 0.2,
    colorMode = 'color', // 'color', 'binary', 'grayscale'
    ...otherOptions
  } = options;

  try {
    console.log('Converting image to SVG with @neplex/vectorizer');

    // Read the image file as a buffer
    const imageBuffer = await fs.readFile(inputPath);

    // Map our turdSize parameter to VTracer's filterSpeckle
    // Higher turdSize = more speckle filtering
    const filterSpeckle = Math.max(2, Math.round(turdSize / 2));

    // Map optTolerance to lengthThreshold
    // Higher tolerance = more smoothing
    const lengthThreshold = Math.round(optTolerance * 20);

    // Determine color mode
    let vTracerColorMode;
    switch (colorMode.toLowerCase()) {
      case 'binary':
        vTracerColorMode = ColorMode.Binary;
        break;
      case 'grayscale':
        vTracerColorMode = ColorMode.Color; // VTracer doesn't have explicit grayscale
        break;
      case 'color':
      default:
        vTracerColorMode = ColorMode.Color;
        break;
    }

    // Use VTracer for vectorization
    const svgContent = await vectorize(imageBuffer, {
      colorMode: vTracerColorMode,
      colorPrecision: 6,
      filterSpeckle: filterSpeckle,
      spliceThreshold: 45,
      cornerThreshold: 30,  // Lower = detect more corners (better for sharp shapes)
      hierarchical: Hierarchical.Stacked,
      mode: PathSimplifyMode.Polygon,  // Polygon mode preserves sharp corners
      layerDifference: 5,
      lengthThreshold: lengthThreshold,
      maxIterations: 10,
      pathPrecision: 8,
      ...otherOptions
    });

    console.log(`Vectorization complete (filterSpeckle=${filterSpeckle}, lengthThreshold=${lengthThreshold})`);
    console.log(`SVG output length: ${svgContent.length} characters`);

    return svgContent;
  } catch (error) {
    console.error('Error in pngToSvg:', error);
    throw new Error(`Failed to convert image to SVG: ${error.message}`);
  }
}

/**
 * Save SVG content to a file
 * @param {string} svgContent - SVG content as string
 * @param {string} outputPath - Path to save the SVG file
 */
export async function saveSvg(svgContent, outputPath) {
  await fs.writeFile(outputPath, svgContent, 'utf-8');
  console.log(`SVG saved to: ${outputPath}`);
}
