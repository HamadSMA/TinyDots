const gridElement = document.getElementById("grid")

if (gridElement && Array.isArray(pixelData)) {
  const gridSize = pixelData.length
  const fragment = document.createDocumentFragment()

  gridElement.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`
  gridElement.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`

  pixelData.forEach((row) => {
    row.forEach((value) => {
      const pixel = document.createElement("div")
      pixel.classList.add("pixel")

      if (value) {
        pixel.style.backgroundColor = value === 1 ? "#222" : value
      }

      fragment.appendChild(pixel)
    })
  })

  gridElement.appendChild(fragment)
}
