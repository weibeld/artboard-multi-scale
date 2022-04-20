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

// Prompt the dimension specification input from the user
function getInput() {
  sketch.UI.getInputFromUser(
    "Target dimensions",
    {
      description: 'Please enter a space-separated list of target dimensions.\n\nValid dimension formats are "N", "wN", "hN", "N%", where N is an integer.\n\nExample input: "100 80 50% 25% h20"'
    },
    parseInput
  )
}

// Parse the dimension specification input
function parseInput(err, value) {
  if (!err) {
    // Convert dimensions into scaling factors (between 0 and 1)
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

// Create scaled copies of the base Artboard. The 'factors' arg contains the
// scaling factors (numbers between 0 and 1), and 'dimensions' contains the
// corresponding dimension specifiers as supplied by the user.
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

    // Add scaled layers of base Artboard to new Artboard
    baseArtboard.layers.forEach(baseLayer => {
      let newLayer = baseLayer.duplicate()
      newLayer.frame = {
        x: baseLayer.frame.x * factors[i],
        y: baseLayer.frame.y * factors[i],
        width: baseLayer.frame.width * factors[i],
        height: baseLayer.frame.height * factors[i] 
      }
      newLayer.parent = newArtboard;
    });

    previousArtboard = newArtboard;
  }
}

// Calculate the position of the new Artboard
function calculateNewArtboardPosition(previousArtboard, newArtboardWidth, newArtboardHeight) {
  // Horizontal gap between new Artboard and neighbour Artboard
  let xGap = Math.min(Math.min(previousArtboard.frame.width, previousArtboard.frame.height), Math.min(newArtboardWidth, newArtboardHeight)) * 0.4;
  let x = previousArtboard.frame.x + previousArtboard.frame.width + xGap;
  let y = previousArtboard.frame.y;
  return {x: x, y: y};
}
