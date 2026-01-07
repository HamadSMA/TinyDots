let gridSize = 8
const grid = document.getElementById("grid")
const drawingIdInput = document.getElementById("currentDrawingId")

let pixels = []
let activeDrawingId = null
let isDrawing = false

// ---------- GRID ----------
function buildEmptyGrid() {
  pixels = Array.from({ length: gridSize }, () => Array(gridSize).fill(0))
  renderGrid()
}

document.getElementById("gridSizeSelect").addEventListener("change", (e) => {
  gridSize = Number(e.target.value)
  activeDrawingId = null
  document.getElementById("deleteBtn").disabled = true
  buildEmptyGrid()
})

function renderGrid() {
  grid.innerHTML = ""
  grid.style.display = "grid" // 🔑 add this
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`

  pixels.forEach((row, y) => {
    row.forEach((value, x) => {
      const pixel = document.createElement("div")
      pixel.classList.add("pixel")
      if (value === 1) pixel.classList.add("active")

      pixel.addEventListener("mousedown", () => {
        isDrawing = true
        togglePixel(x, y, pixel)
      })

      pixel.addEventListener("mouseover", () => {
        if (isDrawing) {
          togglePixel(x, y, pixel)
        }
      })

      document.addEventListener("mouseup", () => {
        isDrawing = false
      })

      function togglePixel(x, y, pixel) {
        pixels[y][x] = pixels[y][x] === 0 ? 1 : 0
        pixel.classList.toggle("active")
      }

      grid.appendChild(pixel)
    })
  })
}

// ---------- LOAD ----------
document.querySelectorAll(".load-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    pixels = JSON.parse(btn.dataset.pixels)
    activeDrawingId = btn.dataset.id
    drawingIdInput.value = activeDrawingId
    renderGrid()
    document.getElementById("deleteBtn").disabled = false
  })
})

// ---------- TOOLBAR ----------
document.getElementById("newBtn").addEventListener("click", () => {
  activeDrawingId = null
  drawingIdInput.value = ""
  document.getElementById("deleteBtn").disabled = true
  buildEmptyGrid()
})

// Initial load
buildEmptyGrid()

document.getElementById("saveBtn").addEventListener("click", async () => {
  const payload = {
    id: activeDrawingId ? Number(activeDrawingId) : null,
    pixelData: JSON.stringify(pixels),
  }

  const response = await fetch("/Drawings/Save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    alert("Failed to save drawing")
    return
  }

  const result = await response.json()
  activeDrawingId = result.id
  document.getElementById("deleteBtn").disabled = false

  alert("Saved")
})

document.getElementById("deleteBtn").addEventListener("click", async () => {
  if (!activeDrawingId) return

  if (!confirm("Delete this drawing?")) return

  const response = await fetch("/Drawings/DeleteAjax", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activeDrawingId),
  })

  if (!response.ok) {
    alert("Delete failed")
    return
  }

  location.reload() // refresh sidebar list safely
})
