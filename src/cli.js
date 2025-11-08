#!/usr/bin/env node

import { Command } from 'commander';
import { convertSvgToStl, convertImageToStl, batchConvert } from './index.js';
import { glob } from 'glob';
import path from 'path';

const program = new Command();

program
  .name('svg-extrude')
  .description('Convert SVG files to extruded 3D STL models')
  .version('1.0.0');

// Main extrude command
program
  .command('extrude <input>')
  .description('Extrude an SVG file to 3D STL')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-h, --height <mm>', 'Extrusion height in mm', '5')
  .option('-t, --twist <degrees>', 'Twist angle in degrees', '0')
  .option('-s, --scale <factor>', 'Scale factor', '1')
  .option('-m, --mode <type>', 'Extrusion mode: linear or rotate', 'linear')
  .option('--twist-steps <steps>', 'Number of twist interpolation steps', '1')
  .action(async (input, options) => {
    try {
      const extrusionOptions = {
        height: parseFloat(options.height),
        twistAngle: parseFloat(options.twist),
        scale: parseFloat(options.scale),
        mode: options.mode,
        twistSteps: parseInt(options.twistSteps)
      };

      const result = await convertSvgToStl(input, {
        outputDir: options.output,
        extrusionOptions
      });

      console.log(`\n✅ Success! STL file created: ${result.stl}`);
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// Image to STL command (full pipeline)
program
  .command('image <input>')
  .description('Convert image (PNG/JPG) to SVG and then to 3D STL')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-h, --height <mm>', 'Extrusion height in mm', '5')
  .option('-t, --twist <degrees>', 'Twist angle in degrees', '0')
  .option('-s, --scale <factor>', 'Scale factor', '1')
  .option('-m, --mode <type>', 'Extrusion mode: linear or rotate', 'linear')
  .option('--threshold <value>', 'Vectorization threshold (0-255)', '128')
  .option('--turd-size <value>', 'Suppress speckles (pixels)', '2')
  .option('--tolerance <value>', 'Curve optimization tolerance', '0.2')
  .option('--color-mode <mode>', 'Color mode: color, binary, grayscale', 'color')
  .option('--no-save-svg', 'Do not save intermediate SVG file')
  .action(async (input, options) => {
    try {
      const svgOptions = {
        threshold: parseInt(options.threshold),
        turdSize: parseInt(options.turdSize),
        optTolerance: parseFloat(options.tolerance),
        colorMode: options.colorMode
      };

      const extrusionOptions = {
        height: parseFloat(options.height),
        twistAngle: parseFloat(options.twist),
        scale: parseFloat(options.scale),
        mode: options.mode
      };

      const result = await convertImageToStl(input, {
        outputDir: options.output,
        svgOptions,
        extrusionOptions,
        saveSvgFile: options.saveSvg
      });

      console.log(`\n✅ Success!`);
      if (result.svg) console.log(`   SVG: ${result.svg}`);
      console.log(`   STL: ${result.stl}`);
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// Batch processing command
program
  .command('batch <pattern>')
  .description('Batch convert multiple files (supports glob patterns)')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-h, --height <mm>', 'Extrusion height in mm', '5')
  .option('-t, --twist <degrees>', 'Twist angle in degrees', '0')
  .option('-s, --scale <factor>', 'Scale factor', '1')
  .option('-m, --mode <type>', 'Extrusion mode: linear or rotate', 'linear')
  .option('--threshold <value>', 'Vectorization threshold (0-255)', '128')
  .option('--turd-size <value>', 'Suppress speckles (pixels)', '2')
  .option('--tolerance <value>', 'Curve optimization tolerance', '0.2')
  .action(async (pattern, options) => {
    try {
      const files = await glob(pattern);

      if (files.length === 0) {
        console.log(`No files found matching pattern: ${pattern}`);
        return;
      }

      console.log(`Found ${files.length} file(s) to process\n`);

      const svgOptions = {
        threshold: parseInt(options.threshold),
        turdSize: parseInt(options.turdSize),
        optTolerance: parseFloat(options.tolerance)
      };

      const extrusionOptions = {
        height: parseFloat(options.height),
        twistAngle: parseFloat(options.twist),
        scale: parseFloat(options.scale),
        mode: options.mode
      };

      const results = await batchConvert(files, {
        outputDir: options.output,
        svgOptions,
        extrusionOptions
      });

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      console.log(`\n✅ Batch complete: ${successful} successful, ${failed} failed`);

      if (failed > 0) {
        console.log('\nFailed files:');
        results.filter(r => !r.success).forEach(r => {
          console.log(`  - ${r.input}: ${r.error}`);
        });
      }
    } catch (error) {
      console.error(`\n❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

// Examples command
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(`
SVG Extrusion Tool - Examples

1. Basic SVG extrusion:
   npm run extrude -- examples/logo.svg

2. Custom height and twist:
   npm run extrude -- examples/logo.svg -h 10 -t 45

3. Rotate extrusion (lathe effect):
   npm run extrude -- examples/profile.svg -m rotate

4. Convert image to STL:
   npm run extrude -- image examples/logo.png -h 5

5. Batch process multiple SVG files:
   npm run extrude -- batch "examples/*.svg" -h 8

6. Advanced image conversion:
   npm run extrude -- image input.png \\
     --height 10 \\
     --threshold 128 \\
     --twist 30 \\
     --scale 2 \\
     --color-mode binary

Options explained:
  -h, --height      How tall the 3D object will be (mm)
  -t, --twist       Rotation from bottom to top (degrees)
  -s, --scale       Multiply all dimensions by this factor
  -m, --mode        'linear' for normal extrusion, 'rotate' for lathe-like
  --threshold       Black/white cutoff for images (0=black, 255=white)
  --turd-size       Remove small speckles (higher = more cleaning)
  --tolerance       Curve smoothing (higher = smoother curves)
    `);
  });

program.parse();
