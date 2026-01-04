const gridElement = document.getElementById("grid");
const gridSize = pixelData.length;

// gridElement.style.display = "grid";
// gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;
// gridElement.style.gap = "4px";

//Build grid from saved data
pixelData.forEach((row, y) => {
    row.forEach((value, x) =>{
        const pixel = document.createElement("div");
        pixel.classList.add("pixel");

        if (value === 1){
            pixel.classList.add("active");
        }
        gridElement.appendChild(pixel);
    });
});