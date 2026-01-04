// pixel-editor-edit.js
// Purpose: edit an existing drawing safely

const gridElement = document.getElementById("grid");
const pixelDataInput = document.getElementById("pixelData");

// Defensive parsing — backend data must exist
let pixels;

try {
  if (!Array.isArray(initialPixelData)) {
    throw new Error("Pixel data is not an array");
  }
  pixels = initialPixelData;
} catch (e) {
  alert("This drawing contains invalid data and cannot be edited.");
  pixels = [];
}

const gridSize = pixels.length;

// Grid layout
gridElement.style.display = "grid";
gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;
gridElement.style.gap = "4px";

// Build grid from existing data
pixels.forEach((row, y) => {
  row.forEach((value, x) => {
    const pixel = document.createElement("div");
    pixel.classList.add("pixel");

    if (value === 1) {
      pixel.classList.add("active");
    }

    pixel.addEventListener("click", () => {
      pixels[y][x] = pixels[y][x] === 0 ? 1 : 0;
      pixel.classList.toggle("active");
      syncPixelData();
    });

    gridElement.appendChild(pixel);
  });
});

// Sync updated pixel state to hidden input
function syncPixelData() {
  pixelDataInput.value = JSON.stringify(pixels);
}

// Mandatory initial sync to prevent NULL PixelData
syncPixelData();
