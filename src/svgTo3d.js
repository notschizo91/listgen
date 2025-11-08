import jscadModeling from '@jscad/modeling';
import stlSerializer from '@jscad/stl-serializer';
import svgPathParser from 'svg-path-parser';
import { promises as fs } from 'fs';

const { extrudeLinear, extrudeRotate } = jscadModeling.extrusions;
const { geom2 } = jscadModeling.geometries;
const { union } = jscadModeling.booleans;
const { serialize } = stlSerializer;
const { parseSVG } = svgPathParser;

/**
 * Parse a single SVG path to points
 * @param {string} pathData - SVG path data (d attribute)
 * @returns {Array} - Array of point arrays
 */
function parsePathToPoints(pathData) {
  const commands = parseSVG(pathData);
  const points = [];
  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;

  commands.forEach(cmd => {
    switch (cmd.code) {
      case 'M': // Move to (absolute)
        currentX = cmd.x;
        currentY = cmd.y;
        startX = currentX;
        startY = currentY;
        points.push([currentX, currentY]);
        break;

      case 'm': // Move to (relative)
        currentX += cmd.x;
        currentY += cmd.y;
        startX = currentX;
        startY = currentY;
        points.push([currentX, currentY]);
        break;

      case 'L': // Line to (absolute)
        currentX = cmd.x;
        currentY = cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'l': // Line to (relative)
        currentX += cmd.x;
        currentY += cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'H': // Horizontal line (absolute)
        currentX = cmd.x;
        points.push([currentX, currentY]);
        break;

      case 'h': // Horizontal line (relative)
        currentX += cmd.x;
        points.push([currentX, currentY]);
        break;

      case 'V': // Vertical line (absolute)
        currentY = cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'v': // Vertical line (relative)
        currentY += cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'C': // Cubic bezier (absolute) - simplified to end point
        currentX = cmd.x;
        currentY = cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'c': // Cubic bezier (relative) - simplified to end point
        currentX += cmd.x;
        currentY += cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'S': // Smooth cubic bezier (absolute)
        currentX = cmd.x;
        currentY = cmd.y;
        points.push([currentX, currentY]);
        break;

      case 's': // Smooth cubic bezier (relative)
        currentX += cmd.x;
        currentY += cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'Q': // Quadratic bezier (absolute)
        currentX = cmd.x;
        currentY = cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'q': // Quadratic bezier (relative)
        currentX += cmd.x;
        currentY += cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'T': // Smooth quadratic bezier (absolute)
        currentX = cmd.x;
        currentY = cmd.y;
        points.push([currentX, currentY]);
        break;

      case 't': // Smooth quadratic bezier (relative)
        currentX += cmd.x;
        currentY += cmd.y;
        points.push([currentX, currentY]);
        break;

      case 'Z': // Close path
      case 'z':
        if (points.length > 0 && (points[0][0] !== currentX || points[0][1] !== currentY)) {
          points.push([startX, startY]);
        }
        break;
    }
  });

  return points;
}

/**
 * Extract all paths from SVG content
 * @param {string} svgContent - Full SVG content
 * @returns {Array} - Array of path data strings
 */
function extractSvgPaths(svgContent) {
  const pathRegex = /<path[^>]*d="([^"]*)"[^>]*>/g;
  const paths = [];
  let match;

  while ((match = pathRegex.exec(svgContent)) !== null) {
    paths.push(match[1]);
  }

  return paths;
}

/**
 * Convert SVG content to 2D geometry objects
 * @param {string} svgContent - SVG content as string
 * @returns {Array} - Array of JSCAD geom2 objects
 */
function svgToGeom2Array(svgContent) {
  const paths = extractSvgPaths(svgContent);

  if (paths.length === 0) {
    throw new Error('No path data found in SVG');
  }

  console.log(`Found ${paths.length} path(s) in SVG`);

  const geometries = [];

  for (let i = 0; i < paths.length; i++) {
    try {
      const points = parsePathToPoints(paths[i]);

      if (points.length < 3) {
        console.warn(`Path ${i + 1} has too few points (${points.length}), skipping`);
        continue;
      }

      // Remove duplicate consecutive points
      const uniquePoints = points.filter((point, idx) => {
        if (idx === 0) return true;
        const prev = points[idx - 1];
        return !(point[0] === prev[0] && point[1] === prev[1]);
      });

      if (uniquePoints.length >= 3) {
        geometries.push(geom2.fromPoints(uniquePoints));
      }
    } catch (error) {
      console.warn(`Failed to process path ${i + 1}: ${error.message}`);
    }
  }

  if (geometries.length === 0) {
    throw new Error('No valid geometries could be created from SVG paths');
  }

  return geometries;
}

/**
 * Extrude SVG to 3D and generate STL
 * @param {string} svgContent - SVG content as string
 * @param {object} options - Extrusion options
 * @returns {Promise<ArrayBuffer>} - STL file as ArrayBuffer
 */
export async function svgTo3D(svgContent, options = {}) {
  const {
    height = 5,           // Extrusion height in mm
    twistAngle = 0,       // Twist angle in degrees
    twistSteps = 1,       // Number of twist steps
    scale = 1,            // Scale factor
    mode = 'linear'       // 'linear' or 'rotate' (for lathe-like objects)
  } = options;

  try {
    console.log(`Extruding SVG with mode: ${mode}, height: ${height}mm, twist: ${twistAngle}°`);

    // Parse SVG to 2D geometries
    const shapes2D = svgToGeom2Array(svgContent);
    console.log(`Processing ${shapes2D.length} shape(s)`);

    // Extrude each 2D shape to 3D
    let shapes3D;

    if (mode === 'rotate') {
      // Lathe-like extrusion (revolve around Y axis)
      shapes3D = shapes2D.map(shape => extrudeRotate({ segments: 32 }, shape));
    } else {
      // Linear extrusion
      shapes3D = shapes2D.map(shape =>
        extrudeLinear({ height, twistAngle, twistSteps }, shape)
      );
    }

    // Union all shapes into one
    const finalShape = shapes3D.length > 1 ? union(...shapes3D) : shapes3D[0];

    // Serialize to STL format
    const rawData = serialize({ binary: true }, finalShape);

    console.log('3D extrusion complete');
    return rawData[0];
  } catch (error) {
    console.error('Error in svgTo3D:', error);
    throw new Error(`Failed to convert SVG to 3D: ${error.message}`);
  }
}

/**
 * Load SVG from file and convert to 3D
 * @param {string} inputPath - Path to SVG file
 * @param {object} options - Extrusion options
 * @returns {Promise<ArrayBuffer>} - STL data
 */
export async function svgFileToStl(inputPath, options = {}) {
  const svgContent = await fs.readFile(inputPath, 'utf-8');
  return svgTo3D(svgContent, options);
}

/**
 * Save STL content to a file
 * @param {ArrayBuffer} stlData - STL data as ArrayBuffer
 * @param {string} outputPath - Path to save the STL file
 */
export async function saveStl(stlData, outputPath) {
  await fs.writeFile(outputPath, Buffer.from(stlData));
  console.log(`STL saved to: ${outputPath}`);
}
