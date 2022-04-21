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

// Create scaled copies of the base Artboard in the specified dimensions
function scale(factors, dimensions) {
  for (let i = 0; i < factors.length; i++) {
    let newArtboard = baseArtboard.duplicate();
    newArtboard.name = `${baseArtboard.name}_${dimensions[i]}`;
    newArtboard.frame = getNewArtboardFrame(factors[i]);
    newArtboard.layers.forEach(l => scaleLayer(l, factors[i], false));
  }
}

// Scale a layer by scaling its frame and style. If the layer is a group [1],
// the scaling of the style is done recursively for each layer of the group.
// The 'isInGroup' arg specifies whether the layer is a descendant of a group.
function scaleLayer(layer, factor, isInGroup) {
  // If the layer is inside a group, don't scale the frame because this was
  // already done when the frame of the top-level group was scaled.
  if (!isInGroup) scaleFrame(layer.frame, factor);
  if ('style' in layer) scaleStyle(layer.style, factor);
  if (layer.type == sketch.Types.Group) {
    layer.layers.forEach(l => scaleLayer(l, factor, true));
  } 
}

// Scale a frame [1] (rectangle [2] object)
// [1] https://developer.sketch.com/reference/api/#layer
// [2] https://developer.sketch.com/reference/api/#rectangle
function scaleFrame(frame, factor) {
  frame.x *= factor;
  frame.y *= factor;
  frame.width *= factor;
  frame.height *= factor;
}

// Scale the scalable properties a style [1] object
// [1] https://developer.sketch.com/reference/api/#style
function scaleStyle(style, factor) {
  // Borders
  style.borders.forEach(b => b.thickness *= factor);
  // Shadows
  style.shadows.forEach(s => scaleShadow(s, factor));
  style.innerShadows.forEach(s => scaleShadow(s, factor));
  // Blur
  style.blur.radius *= factor;
  // Text
  style.fontSize *= factor;
  if (style.kerning != null) style.kerning *= factor;
  if (style.lineHeight != null) style.lineHeight *= factor;
  style.paragraphSpacing *= factor;
}

// Scale a shadow [1] object
// [1] https://developer.sketch.com/reference/api/#shadow
function scaleShadow(shadow, factor) {
    shadow.x *= factor;
    shadow.y *= factor;
    shadow.blur *= factor;
    shadow.spread *= factor;
}

// Calculate the frame (position and size) of a new Artboard based on the base
// Artboard, scaling factor, and frame of the last processed Artboard.
function getNewArtboardFrame(factor) {
  if (lastArtboardFrame == null) lastArtboardFrame = baseArtboard.frame;
  let width = baseArtboard.frame.width * factor;
  let height = baseArtboard.frame.height * factor;
  // Horizontal gap between Artboards
  let gapX = Math.min(Math.min(lastArtboardFrame.width, lastArtboardFrame.height), Math.min(width, height)) * 0.4;
  let x = lastArtboardFrame.x + lastArtboardFrame.width + gapX;
  let y = lastArtboardFrame.y;
  lastArtboardFrame = { x: x, y: y, width: width, height: height };
  return lastArtboardFrame;
}
