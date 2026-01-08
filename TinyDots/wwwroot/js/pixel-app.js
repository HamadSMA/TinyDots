let gridSize = 8
const grid = document.getElementById("grid")
const drawingIdInput = document.getElementById("currentDrawingId")
const drawingList = document.getElementById("drawingList")

const colorPicker = document.getElementById("colorPicker")
const eraserBtn = document.getElementById("eraserBtn")
const colorHistoryEl = document.getElementById("colorHistory")

colorHistoryEl.style.display = "flex"
colorHistoryEl.style.alignItems = "center"
colorHistoryEl.style.height = "28px"
colorHistoryEl.style.minHeight = "28px"
colorHistoryEl.style.gap = "6px"

let pixels = []
let activeDrawingId = null
let isDrawing = false

let currentColor = "#000000"
let isEraser = false
let colorHistory = []

function getCellSize() {
  return Math.floor(320 / gridSize)
}

// Color history
function renderColorHistory() {
  colorHistoryEl.innerHTML = ""

  colorHistory.forEach((color) => {
    const div = document.createElement("div")
    div.className = "color-history-item"

    div.style.backgroundColor = color
    div.style.display = "block"

    div.addEventListener("click", () => {
      setColor(color)
      colorPicker.value = color
    })

    colorHistoryEl.appendChild(div)
  })
}

eraserBtn.addEventListener("click", () => {
  isEraser = true
  eraserBtn.classList.add("tool-active")
})

// Color selection
function setColor(color) {
  currentColor = color
  isEraser = false
  eraserBtn.classList.remove("tool-active")

  // Update color history (max 5, unique)
  if (!colorHistory.includes(color)) {
    colorHistory.unshift(color)
    if (colorHistory.length > 5) {
      colorHistory.pop()
    }
    renderColorHistory()
  }
}

colorPicker.addEventListener("input", (e) => {
  setColor(e.target.value)
})

// Sidebar helpers
function addDrawingToSidebar(id, pixelData) {
  const li = document.createElement("li")

  const btn = document.createElement("button")
  btn.classList.add("load-btn")
  btn.textContent = `Drawing #${id}`
  btn.dataset.id = id
  btn.dataset.pixels = pixelData

  btn.addEventListener("click", () => {
    pixels = JSON.parse(btn.dataset.pixels)
    gridSize = pixels.length
    renderGrid()
    activeDrawingId = id
    document.getElementById("deleteBtn").disabled = false
  })

  li.appendChild(btn)
  drawingList.appendChild(li)
}

function removeDrawingFromSidebar(id) {
  const btn = drawingList.querySelector(`button[data-id="${id}"]`)
  if (btn) btn.parentElement.remove()
}
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

  const cellSize = getCellSize()

  grid.style.display = "grid"
  grid.style.gridTemplateColumns = `repeat(${gridSize}, ${cellSize}px)`
  grid.style.gridTemplateRows = `repeat(${gridSize}, ${cellSize}px)`

  pixels.forEach((row, y) => {
    row.forEach((value, x) => {
      const pixel = document.createElement("div")
      pixel.classList.add("pixel")

      pixel.style.width = `${cellSize}px`
      pixel.style.height = `${cellSize}px`

      if (value) {
        pixel.style.backgroundColor = value
      }

      pixel.addEventListener("mousedown", () => {
        isDrawing = true
        paintPixel(x, y, pixel)
      })

      pixel.addEventListener("mouseover", () => {
        if (isDrawing) paintPixel(x, y, pixel)
      })

      grid.appendChild(pixel)
    })
  })
}

document.addEventListener("mouseup", () => {
  isDrawing = false
})

function paintPixel(x, y, pixel) {
  if (isEraser === true) {
    pixels[y][x] = null
    pixel.style.backgroundColor = ""
    return // 🔑 STOP HERE — DO NOT PAINT
  }

  pixels[y][x] = currentColor
  pixel.style.backgroundColor = currentColor
}

// function togglePixel(x, y, pixel) {
//   pixels[y][x] = pixels[y][x] === 0 ? 1 : 0
//   pixel.classList.toggle("active")
// }

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

// Save logic
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

  if (!activeDrawingId) {
    addDrawingToSidebar(result.id, payload.pixelData)
  } else {
    const btn = drawingList.querySelector(
      `button[data-id="${activeDrawingId}"]`
    )
    if (btn) btn.dataset.pixels = payload.pixelData
  }

  activeDrawingId = result.id
  document.getElementById("deleteBtn").disabled = false
})

// Delete logic
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

  removeDrawingFromSidebar(activeDrawingId)
  activeDrawingId = null
  document.getElementById("deleteBtn").disabled = true
  buildEmptyGrid()
})

renderColorHistory()
