const sketch = require("sketch");
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

function getInput() {
  sketch.UI.getInputFromUser(
    "Target dimensions",
    {
      description: 'Please enter a space-separated list of target dimensions.\n\nValid dimension formats are "N", "wN", "hN", "N%", where N is an integer.\n\nExample input: "100 80 50% 25% h20"'
    },
    parseInput
  )
}

function parseInput(err, value) {
  if (!err) {
    // Convert dimensions into percentage scales relative to selected Artboard
    const dimensions = value.split(/[ ]+/);
    const scales = [];
    dimensions.forEach(d => {
      let s;
      if (d.match(/^[0-9]+$/))
        s = parseInt(d)/baseArtboard.frame.width;
      else if (d.match(/^w[0-9]+$/))
        s = parseInt(d.substr(1))/baseArtboard.frame.width;
      else if (d.match(/^h[0-9]+$/))
        s = parseInt(d.substr(1))/baseArtboard.frame.height;
      else if (d.match(/^[0-9]+%$/))
        s = parseInt(d)/100;
      else {
        sketch.UI.alert("Invalid input", `The following dimension specifier is invalid: ${d}`);
        throw new Error("Invalid input");
      }
      // Retain dimension string for naming the new Artboards
      scales.push({scale: s, dimension: d});
    });
    scale(scales);
  }
}

function scale(scales) {

  // Neighbour of the Artboard to create, used for positioning the new Artboard
  let neighbourArtboard;

  for (let i = 0; i < scales.length; i++) {
    let scale = scales[i].scale;
    let dimension = scales[i].dimension;
    if (i == 0) neighbourArtboard = baseArtboard;

    // Determine size and position of new Artboard
    let width = baseArtboard.frame.width * scale;
    let height = baseArtboard.frame.height * scale;
    let position = getNewArtboardPosition(neighbourArtboard, width, height);

    // Create new Artboard (copy all attributes but delete layers)
    let newArtboard = baseArtboard.duplicate();
    newArtboard.name = `${baseArtboard.name}_${dimension}`;
    newArtboard.frame = { x: position.x, y: position.y, width: width, height: height }
    newArtboard.layers = [];

    // Copy and scale layers of base Artboard onto new Artboard
    baseArtboard.layers.forEach(baseLayer => {
      let newLayer = baseLayer.duplicate()
      newLayer.frame = {
        x: baseLayer.frame.x * scale,
        y: baseLayer.frame.y * scale,
        width: baseLayer.frame.width * scale,
        height: baseLayer.frame.height * scale
      }
      newLayer.parent = newArtboard;
    });

    neighbourArtboard = newArtboard;
  }
}

// Calculate position of new Artboard based on the position and size of the
// previous Artboard and the size of the new Artboard.
function getNewArtboardPosition(neighbourArtboard, newArtboardWidth, newArtboardHeight) {
  // New Artboard is positioned top-aligned to the right of the previous Artboard
  // with a gap proportional to the size of the smaller one of the two Artboards.
  let x =
    neighbourArtboard.frame.x +
    neighbourArtboard.frame.width +
    Math.min(Math.min(neighbourArtboard.frame.width, neighbourArtboard.frame.height), Math.min(newArtboardWidth, newArtboardHeight)) * 0.4;
  let y = neighbourArtboard.frame.y;
  return {x: x, y: y};
}

