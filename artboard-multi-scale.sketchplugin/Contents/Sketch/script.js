const sketch = require("sketch");

// Artboard selected by the user
let baseArtboard;

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

// Prompt the target dimension input from the user
function getInput() {
  sketch.UI.getInputFromUser(
    "Target dimensions",
    {
      description: 'Please enter a space-separated list of target dimensions.\n\nValid dimension formats are "N", "wN", "hN", "N%", where N is an integer.\n\nExample input: "100 80 50% 25% h20"'
    },
    parseInput
  )
}

// Parse the target dimension input
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

// Scale the base Artboard to all the specified dimensions. Scaling factors
// are passed in 'factors' and user-provided dimension strings in 'dimensions'.
function scale(factors, dimensions) {

  // Previously created Artboard, used for positioning the new Artboard
  let previousArtboard;

  for (let i = 0; i < factors.length; i++) {
    if (i == 0) previousArtboard = baseArtboard;

    // Create new scaled empty Artboard
    let newArtboard = baseArtboard.duplicate();
    newArtboard.name = `${baseArtboard.name}_${dimensions[i]}`;
    let width = baseArtboard.frame.width * factors[i];
    let height = baseArtboard.frame.height * factors[i];
    let position = calculateNewArtboardPosition(previousArtboard, width, height);
    newArtboard.frame = { x: position.x, y: position.y, width: width, height: height }
    newArtboard.layers = [];

    // Scale layers of base Artboard and add them to the new Artboard
    baseArtboard.layers.forEach(baseLayer => {
      let newLayer = baseLayer.duplicate();
      scaleFrame(newLayer.frame, baseLayer.frame, factors[i]);
      if ('style' in baseLayer) {
        scaleStyle(newLayer.style, baseLayer.style, factors[i]);
      }
      newLayer.parent = newArtboard;
    });

    previousArtboard = newArtboard;
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

// Calculate the position of the new Artboard
function calculateNewArtboardPosition(previousArtboard, newArtboardWidth, newArtboardHeight) {
  // Horizontal gap between new Artboard and neighbour Artboard
  let xGap = Math.min(Math.min(previousArtboard.frame.width, previousArtboard.frame.height), Math.min(newArtboardWidth, newArtboardHeight)) * 0.4;
  let x = previousArtboard.frame.x + previousArtboard.frame.width + xGap;
  let y = previousArtboard.frame.y;
  return {x: x, y: y};
}
