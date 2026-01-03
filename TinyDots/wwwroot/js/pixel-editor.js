const gridSize = 8;
const gridElement = document.getElementById("grid");
const pixelDataInput = document.getElementById("pixelData");

// 2D array to store pixel state
let pixels = Array.from({ length: gridSize }, () =>
  Array(gridSize).fill(0)
);

// Build grid
pixels.forEach((row, y) => {
  row.forEach((_, x) => {
    const pixel = document.createElement("div");
    pixel.classList.add("pixel");
    pixel.dataset.x = x;
    pixel.dataset.y = y;

    pixel.addEventListener("click", () => {
      pixels[y][x] = pixels[y][x] === 0 ? 1 : 0;
      pixel.classList.toggle("active");
      syncPixelData();
    });

    gridElement.appendChild(pixel);
  });
});

// Serialize pixel state
function syncPixelData() {
  pixelDataInput.value = JSON.stringify(pixels);
}
