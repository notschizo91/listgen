# SVG Extrusion Tool

Convert SVG files into extruded 3D objects ready for 3D printing! This tool integrates advanced vectorization from [@neplex/vectorizer](https://www.npmjs.com/package/@neplex/vectorizer) with powerful 3D extrusion using [JSCAD](https://openjscad.xyz/).

## Features

- 🎨 **SVG → 3D**: Direct conversion of SVG files to STL models
- 🖼️ **Image → 3D**: Full pipeline from PNG/JPG to STL via vectorization
- 🔧 **Customizable Extrusion**: Control height, twist, scale, and mode
- 🌀 **Multiple Extrusion Modes**: Linear extrusion or rotate (lathe) mode
- 📦 **Batch Processing**: Convert multiple files at once
- 🎯 **Multi-Path Support**: Handles SVGs with multiple paths
- 🔄 **Enhanced Path Parsing**: Supports all major SVG path commands

## Installation

```bash
npm install
```

## Quick Start

### 🌐 Web Interface (Recommended)

The easiest way to use the SVG Extrusion Tool is through the web interface:

```bash
npm install
npm run server
```

Then open `http://localhost:3000` in your browser!

**Features:**
- 📤 Drag & drop SVG or image files
- 🎛️ Real-time parameter adjustment (height, twist, scale, mode)
- 👁️ Live preview for images
- 📥 One-click STL download
- 📊 Conversion counter

### 💻 Command Line Interface

#### 1. Extrude an SVG file

```bash
npm run extrude -- examples/star.svg
```

This creates `output/star.stl` with default settings (5mm height).

#### 2. Custom parameters

```bash
npm run extrude -- examples/gear.svg -h 10 -t 45 -s 2
```

- Height: 10mm
- Twist: 45 degrees
- Scale: 2x

#### 3. Convert an image to 3D

```bash
npm run extrude -- image examples/logo.png -h 8
```

This vectorizes the image first, then extrudes it.

## Usage

### Basic SVG Extrusion

```bash
npm run extrude -- <svg-file> [options]
```

**Options:**
- `-o, --output <dir>` - Output directory (default: `./output`)
- `-h, --height <mm>` - Extrusion height in millimeters (default: `5`)
- `-t, --twist <degrees>` - Twist angle from bottom to top (default: `0`)
- `-s, --scale <factor>` - Scale factor for dimensions (default: `1`)
- `-m, --mode <type>` - Extrusion mode: `linear` or `rotate` (default: `linear`)
- `--twist-steps <steps>` - Number of twist interpolation steps (default: `1`)

**Examples:**

```bash
# Basic extrusion
npm run extrude -- examples/hexagon.svg

# Tall extrusion with twist
npm run extrude -- examples/star.svg -h 15 -t 90

# Rotate mode (lathe effect)
npm run extrude -- examples/circle-profile.svg -m rotate

# Scaled and twisted
npm run extrude -- examples/gear.svg -h 8 -t 30 -s 1.5
```

### Image to STL Pipeline

```bash
npm run extrude -- image <image-file> [options]
```

**Additional Options:**
- `--threshold <value>` - Black/white threshold 0-255 (default: `128`)
- `--turd-size <value>` - Suppress speckles in pixels (default: `2`)
- `--tolerance <value>` - Curve optimization tolerance (default: `0.2`)
- `--color-mode <mode>` - Color mode: `color`, `binary`, or `grayscale` (default: `color`)
- `--no-save-svg` - Skip saving the intermediate SVG file

**Examples:**

```bash
# Basic image conversion
npm run extrude -- image photo.png

# High contrast with more detail
npm run extrude -- image logo.png --threshold 200 --turd-size 1

# Custom extrusion parameters
npm run extrude -- image icon.png -h 10 --threshold 128 --color-mode binary
```

### Batch Processing

```bash
npm run extrude -- batch "<pattern>" [options]
```

**Examples:**

```bash
# Process all SVG files in examples/
npm run extrude -- batch "examples/*.svg" -h 8

# Process all PNG files
npm run extrude -- batch "images/*.png" --threshold 150

# Custom output directory
npm run extrude -- batch "designs/*.svg" -o ./3d-models -h 12
```

## Extrusion Modes

### Linear Mode (Default)

Standard extrusion - takes a 2D shape and extrudes it along the Z-axis.

```bash
npm run extrude -- examples/star.svg -h 10
```

Perfect for: logos, text, icons, decorative shapes

### Rotate Mode (Lathe)

Revolves the 2D profile around the Y-axis to create cylindrical objects.

```bash
npm run extrude -- examples/circle-profile.svg -m rotate
```

Perfect for: vases, bowls, chess pieces, cylindrical parts

## SVG Path Support

The tool supports the following SVG path commands:

- **M/m** - Move to (absolute/relative)
- **L/l** - Line to (absolute/relative)
- **H/h** - Horizontal line (absolute/relative)
- **V/v** - Vertical line (absolute/relative)
- **C/c** - Cubic Bézier curve (absolute/relative)
- **S/s** - Smooth cubic Bézier (absolute/relative)
- **Q/q** - Quadratic Bézier (absolute/relative)
- **T/t** - Smooth quadratic Bézier (absolute/relative)
- **Z/z** - Close path

**Note:** Bézier curves are currently simplified to their endpoints for faster processing.

## Project Structure

```
svg-extrusion-tool/
├── src/
│   ├── index.js          # Main API
│   ├── cli.js            # Command-line interface
│   ├── svgTo3d.js        # SVG → 3D extrusion engine
│   └── pngToSvg.js       # Image → SVG vectorization
├── server/
│   ├── app.js            # Express web server
│   └── public/           # Web interface files
│       ├── index.html    # Main UI
│       ├── app.js        # Frontend JavaScript
│       └── style.css     # Styling
├── examples/             # Example SVG files
│   ├── star.svg          # Simple star shape
│   ├── heart.svg         # Heart shape
│   ├── hexagon.svg       # Regular hexagon
│   ├── gear.svg          # Gear with center hole
│   └── circle-profile.svg # Profile for rotate mode
├── output/               # Generated STL files
├── uploads/              # Temporary upload directory
├── deploy-to-server.sh   # Automated deployment script
├── Dockerfile            # Docker configuration
├── docker-compose.yml    # Docker Compose setup
├── package.json
└── README.md
```

## Deployment

### Quick Deploy to Server

Use the automated deployment script:

```bash
# Copy to your server
scp deploy-to-server.sh root@your-server:/tmp/

# SSH and run
ssh root@your-server
chmod +x /tmp/deploy-to-server.sh
/tmp/deploy-to-server.sh
```

This will:
- Install Node.js if needed
- Clone and install the app to `/opt/svg-extrusion-tool`
- Start the web server with PM2
- Configure firewall
- Create global `svg-extrude` command

### Update Deployed Server

```bash
cd /opt/svg-extrusion-tool
git pull origin claude/integrate-vectorizer-011CUvm5GAhiYTY2nZYPL49R
npm install --production
pm2 restart svg-extrusion-tool
```

Or use the one-liner:

```bash
cd /opt/svg-extrusion-tool && git pull origin claude/integrate-vectorizer-011CUvm5GAhiYTY2nZYPL49R && npm install --production && pm2 restart svg-extrusion-tool
```

### PM2 Management

```bash
pm2 status                    # Check status
pm2 logs svg-extrusion-tool   # View logs
pm2 restart svg-extrusion-tool # Restart
pm2 stop svg-extrusion-tool    # Stop
pm2 start svg-extrusion-tool   # Start
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for more deployment options.

## Programmatic API

You can also use this tool programmatically in your Node.js projects:

### Convert SVG to STL

```javascript
import { convertSvgToStl } from './src/index.js';

const result = await convertSvgToStl('input.svg', {
  outputDir: './output',
  extrusionOptions: {
    height: 10,        // mm
    twistAngle: 45,    // degrees
    scale: 1.5,        // scale factor
    mode: 'linear'     // or 'rotate'
  }
});

console.log('STL file:', result.stl);
```

### Convert Image to STL

```javascript
import { convertImageToStl } from './src/index.js';

const result = await convertImageToStl('image.png', {
  outputDir: './output',
  svgOptions: {
    threshold: 128,
    turdSize: 2,
    optTolerance: 0.2,
    colorMode: 'binary'
  },
  extrusionOptions: {
    height: 8,
    twistAngle: 0,
    scale: 1
  },
  saveSvgFile: true
});

console.log('SVG file:', result.svg);
console.log('STL file:', result.stl);
```

### Batch Conversion

```javascript
import { batchConvert } from './src/index.js';

const files = ['design1.svg', 'design2.svg', 'logo.png'];

const results = await batchConvert(files, {
  outputDir: './output',
  extrusionOptions: { height: 10 }
});

results.forEach(result => {
  if (result.success) {
    console.log(`✓ ${result.input} → ${result.stl}`);
  } else {
    console.log(`✗ ${result.input}: ${result.error}`);
  }
});
```

## Tips for Best Results

### For SVG Files

1. **Simple paths work best** - Complex curves with many control points may slow processing
2. **Closed paths** - Ensure paths are closed (end with Z command) for proper extrusion
3. **Clean geometry** - Remove overlapping paths and unnecessary complexity
4. **Scale appropriately** - SVG units become millimeters in STL

### For Image Files

1. **High contrast** - Images with clear black/white distinction work best
2. **Simple shapes** - Complex photographs may not extrude well
3. **Adjust threshold** - Try different values (64, 128, 192) for different effects
4. **Reduce noise** - Use `--turd-size` to filter out small speckles
5. **Vector-friendly images** - Logos, icons, and line art work better than photos

### For 3D Printing

1. **Start small** - Test with low heights (2-5mm) first
2. **Check dimensions** - SVG coordinates map directly to millimeters
3. **Wall thickness** - Ensure SVG paths are thick enough for printing
4. **Supports** - Complex geometries may need support structures
5. **Slice preview** - Always check in your slicer before printing

## Technologies Used

- **[@neplex/vectorizer](https://www.npmjs.com/package/@neplex/vectorizer)** - Advanced image vectorization (VTracer wrapper)
- **[@jscad/modeling](https://openjscad.xyz/)** - Programmatic 3D CAD modeling
- **[@jscad/stl-serializer](https://www.npmjs.com/package/@jscad/stl-serializer)** - STL file generation
- **[svg-path-parser](https://www.npmjs.com/package/svg-path-parser)** - SVG path parsing
- **[Sharp](https://sharp.pixelplumbing.com/)** - High-performance image processing
- **[Commander](https://www.npmjs.com/package/commander)** - CLI framework

## Limitations

- Bézier curves are simplified to straight lines between endpoints
- Very complex SVGs may produce large STL files
- Image vectorization works best with high-contrast, simple images
- Multi-color SVGs are treated as single-color (all paths combined)

## Future Enhancements

- [ ] Better Bézier curve subdivision for smoother curves
- [ ] Multi-layer support with different heights per path
- [ ] Boolean operations (union, subtract, intersect)
- [ ] Variable-width extrusion based on path attributes
- [ ] Color-to-depth mapping for relief effects
- [ ] Web interface for parameter preview
- [ ] Real-time 3D preview

## Credits

This project integrates the vectorization pipeline from [STLPipeline](https://github.com/notschizo91/STLPipeline) with enhanced SVG parsing and extrusion capabilities.

## License

MIT

## Contributing

Issues and pull requests are welcome! Feel free to suggest improvements or report bugs.
