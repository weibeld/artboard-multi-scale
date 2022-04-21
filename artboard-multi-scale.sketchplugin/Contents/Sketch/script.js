const sketch = require("sketch");

// Artboard selected by the user
let baseArtboard;

// Frame of the last processed Artboard (used for positioning new Artboards)
let lastArtboardFrame;

function main(context) {
  // Make sure that exactly one Artboard is selected
  const selection = sketch.getSelectedDocument().selectedPage.selectedLayers;
  if (selection.length != 1 || selection.layers[0].type !== sketch.Types.Artboard) {
    sketch.UI.alert("Invalid selection", "Please select an Artboard for starting.");
    throw new Error("Invalid selection")
  }
  baseArtboard = selection.layers[0];
  getInput()
}

// Prompt the target dimensions from the user
function getInput() {
  sketch.UI.getInputFromUser(
    "Target dimensions",
    {
      description: 'Please enter a space-separated list of target dimensions.\n\nValid dimension formats are "N", "wN", "hN", "N%", where N is an integer.\n\nExample input: "100 80 50% 25% h20"'
    },
    parseInput
  )
}

// Parse the target dimensions provided by the user
function parseInput(err, value) {
  if (!err) {
    // Convert dimensions into scaling factors (numbers between 0 and 1)
    const dimensions = value.split(/[ ]+/);
    const factors = [];
    dimensions.forEach(d => {
      if (d.match(/^[0-9]+$/))
        factors.push(parseInt(d)/baseArtboard.frame.width);
      else if (d.match(/^w[0-9]+$/))
        factors.push(parseInt(d.substr(1))/baseArtboard.frame.width);
      else if (d.match(/^h[0-9]+$/))
        factors.push(parseInt(d.substr(1))/baseArtboard.frame.height);
      else if (d.match(/^[0-9]+%$/))
        factors.push(parseInt(d)/100);
      else {
        sketch.UI.alert("Invalid input", `The following dimension is invalid: ${d}`);
        throw new Error("Invalid input");
      }
    });
    scale(factors, dimensions);
  }
}

// Scale the base Artboard to the specified dimensions
function scale(factors, dimensions) {
  for (let i = 0; i < factors.length; i++) {
    // Create new scaled and empty Artboard
    let newArtboard = baseArtboard.duplicate();
    newArtboard.name = `${baseArtboard.name}_${dimensions[i]}`;
    newArtboard.frame = getNewArtboardFrame(factors[i]);
    newArtboard.layers = [];
    // Scale and add layers of base Artboard to new Artboard
    baseArtboard.layers.forEach(l => scaleAndAddLayer(l, factors[i], newArtboard));
  }
}

// Create a scaled copy of a layer and add it to specified parent layer
function scaleAndAddLayer(layer, factor, parent) {
  let newLayer = layer.duplicate();
  scaleFrame(newLayer.frame, layer.frame, factor);
  if ('style' in layer) scaleStyle(newLayer.style, layer.style, factor);
  newLayer.parent = parent;
  // If the layer is a group, scale each of its layers separately
  if (layer.type == sketch.Types.Group) {
    newLayer.layers = [];
    layer.layers.forEach(l => scaleAndAddLayer(l, factor, newLayer));
  }
}

// Scale new frame [1,2] based on base frame
// [1] https://developer.sketch.com/reference/api/#layer
// [2] https://developer.sketch.com/reference/api/#rectangle
function scaleFrame(newFrame, baseFrame, factor) {
  newFrame.x = baseFrame.x * factor;
  newFrame.y = baseFrame.y * factor;
  newFrame.width = baseFrame.width * factor;
  newFrame.height = baseFrame.height * factor;
}

// Scale scalable properties of new style [1] based on base style
// [1] https://developer.sketch.com/reference/api/#style
function scaleStyle(newStyle, baseStyle, factor) {
  // Borders
  for (let i = 0; i < baseStyle.borders.length; i++) {
    newStyle.borders[i].thickness = baseStyle.borders[i].thickness * factor;
  }
  // Shadows
  for (let i = 0; i < baseStyle.shadows.length; i++) {
    scaleShadow(newStyle.shadows[i], baseStyle.shadows[i], factor);
  }
  for (let i = 0; i < baseStyle.innerShadows.length; i++) {
    scaleShadow(newStyle.innerShadows[i], baseStyle.innerShadows[i], factor);
  }
  // Blur
  newStyle.blur.radius = baseStyle.blur.radius * factor;
  // Text
  newStyle.fontSize = baseStyle.fontSize * factor;
  if (baseStyle.kerning != null) {
    newStyle.kerning = baseStyle.kerning * factor;
  }
  if (baseStyle.lineHeight != null) {
    newStyle.lineHeight = baseStyle.lineHeight * factor;
  }
  newStyle.paragraphSpacing = baseStyle.paragraphSpacing * factor;
}

// Scale new shadow [1] based on base shadow
// [1] https://developer.sketch.com/reference/api/#shadow
function scaleShadow(newShadow, baseShadow, factor) {
    newShadow.x = baseShadow.x * factor;
    newShadow.y = baseShadow.y * factor;
    newShadow.blur = baseShadow.blur * factor;
    newShadow.spread = baseShadow.spread * factor;
}

// Calculate the frame (size and position) of a new Artboard
function getNewArtboardFrame(factor) {
  if (lastArtboardFrame == null) lastArtboardFrame = baseArtboard.frame;
  let width = baseArtboard.frame.width * factor;
  let height = baseArtboard.frame.height * factor;
  let frame = {
    // Horizontal gap between Artboards based on size of smaller Artboard
    x: lastArtboardFrame.x +
       lastArtboardFrame.width +
       Math.min(Math.min(lastArtboardFrame.width, lastArtboardFrame.height), Math.min(width, height)) * 0.4,
    y: lastArtboardFrame.y,
    width: width,
    height: height
  }
  lastArtboardFrame = frame;
  return frame;
}
