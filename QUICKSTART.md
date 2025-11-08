# Quick Start Guide

Get started with SVG Extrusion Tool in 3 minutes!

## Installation

```bash
npm install
```

## Your First Extrusion

### Step 1: Extrude an example SVG

```bash
npm run extrude -- examples/star.svg
```

This creates `output/star.stl` - a 3D star with 5mm height!

### Step 2: Open in your slicer

Open `output/star.stl` in your favorite 3D printing slicer (Cura, PrusaSlicer, etc.)

### Step 3: Try with custom parameters

```bash
npm run extrude -- examples/gear.svg -h 10 -t 45
```

This creates a 10mm tall gear with a 45° twist!

## Next Steps

### Try Different Shapes

```bash
# Hexagon
npm run extrude -- examples/hexagon.svg -h 8

# Heart
npm run extrude -- examples/heart.svg -h 12 -s 1.5

# Rotate mode (lathe effect)
npm run extrude -- examples/circle-profile.svg -m rotate
```

### Convert Your Own Images

```bash
npm run extrude -- image your-logo.png -h 10
```

### Batch Process

```bash
npm run extrude -- batch "examples/*.svg" -h 8
```

## Common Parameters

- `-h 10` - Make it 10mm tall
- `-t 45` - Twist 45 degrees
- `-s 2` - Double the size
- `-m rotate` - Rotate mode (for vases, bowls)
- `-o ./my-models` - Save to custom directory

## Get Help

```bash
npm run extrude -- examples
```

Shows all available examples and options!

## Full Documentation

See [README.md](README.md) for complete documentation and API reference.
