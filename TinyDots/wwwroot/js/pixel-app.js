// =======================
// State
// =======================
let gridSize = 8
let pixels = []
let activeDrawingId = null

let isDrawing = false
let currentColor = "#000000"
let isEraser = false
let colorHistory = []

// =======================
// DOM Elements
// =======================
const grid = document.getElementById("grid")
const drawingList = document.getElementById("drawingList")
const colorPicker = document.getElementById("colorPicker")
const eraserBtn = document.getElementById("eraserBtn")
const colorHistoryEl = document.getElementById("colorHistory")

const newBtn = document.getElementById("newBtn")
const saveBtn = document.getElementById("saveBtn")
const deleteBtn = document.getElementById("deleteBtn")
const gridSizeSelect = document.getElementById("gridSizeSelect")

// =======================
// Color History Layout Lock
// =======================
colorHistoryEl.style.display = "flex"
colorHistoryEl.style.height = "28px"
colorHistoryEl.style.gap = "6px"

// =======================
// Grid Helpers
// =======================
function getCellSize() {
  return Math.floor(320 / gridSize)
}

function buildEmptyGrid() {
  pixels = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
  renderGrid()
}

function renderGrid() {
  grid.innerHTML = ""
  const size = getCellSize()

  grid.style.gridTemplateColumns = `repeat(${gridSize}, ${size}px)`
  grid.style.gridTemplateRows = `repeat(${gridSize}, ${size}px)`

  pixels.forEach((row, y) => {
    row.forEach((value, x) => {
      const pixel = document.createElement("div")
      pixel.className = "pixel"
      pixel.style.width = `${size}px`
      pixel.style.height = `${size}px`

      if (value) pixel.style.backgroundColor = value

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

// =======================
// Drawing Tools
// =======================
function paintPixel(x, y, pixel) {
  if (isEraser) {
    pixels[y][x] = null
    pixel.style.backgroundColor = ""
    return
  }

  // 🎨 First actual usage of color → register in history
  if (!colorHistory.includes(currentColor)) {
    colorHistory.unshift(currentColor)
    if (colorHistory.length > 5) colorHistory.pop()
    renderColorHistory()
  }

  pixels[y][x] = currentColor
  pixel.style.backgroundColor = currentColor
}

// =======================
// Color System
// =======================
function setColor(color) {
  currentColor = color
  isEraser = false
  eraserBtn.classList.remove("tool-active")
}

function renderColorHistory() {
  colorHistoryEl.innerHTML = ""

  colorHistory.forEach((color) => {
    const div = document.createElement("div")
    div.className = "color-history-item"
    div.style.backgroundColor = color
    div.onclick = () => {
      setColor(color)
      colorPicker.value = color
    }
    colorHistoryEl.appendChild(div)
  })
}

colorPicker.addEventListener("input", (e) => setColor(e.target.value))

eraserBtn.addEventListener("click", () => {
  isEraser = true
  eraserBtn.classList.add("tool-active")
})

// =======================
// New Button
// =======================
newBtn.onclick = () => {
  activeDrawingId = null
  deleteBtn.disabled = true
  buildEmptyGrid()
}

// =======================
// Grid Size
// =======================
gridSizeSelect.addEventListener("change", (e) => {
  gridSize = Number(e.target.value)
  activeDrawingId = null
  deleteBtn.disabled = true
  buildEmptyGrid()
})

// =======================
// Thumbnail Helpers
// =======================
function drawThumbnail(canvas, data) {
  const ctx = canvas.getContext("2d")
  const size = data.length
  const cell = canvas.width / size

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  data.forEach((row, y) => {
    row.forEach((color, x) => {
      if (color) {
        ctx.fillStyle = color
        ctx.fillRect(x * cell, y * cell, cell, cell)
      }
    })
  })
}

function createThumbnail(id, data) {
  const li = document.createElement("li")
  li.className = "thumb-item"

  const canvas = document.createElement("canvas")
  canvas.className = "thumb-canvas"
  canvas.width = 64
  canvas.height = 64
  canvas.dataset.id = id

  drawThumbnail(canvas, data)

  canvas.onclick = () => {
    pixels = JSON.parse(JSON.stringify(data))
    gridSize = data.length
    activeDrawingId = id
    deleteBtn.disabled = false
    renderGrid()
  }

  li.appendChild(canvas)
  drawingList.appendChild(li)
  return canvas
}

// =======================
// Initialize Existing Thumbnails
// =======================
document.querySelectorAll(".thumb-canvas").forEach((canvas) => {
  const data = JSON.parse(canvas.dataset.pixels)
  drawThumbnail(canvas, data)

  canvas.onclick = () => {
    pixels = JSON.parse(JSON.stringify(data))
    gridSize = data.length
    activeDrawingId = Number(canvas.dataset.id)
    deleteBtn.disabled = false
    renderGrid()
  }
})

// =======================
// Save
// =======================
saveBtn.onclick = async () => {
  const response = await fetch("/Drawings/Save", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: activeDrawingId,
      pixelData: JSON.stringify(pixels),
    }),
  })

  if (!response.ok) {
    alert("Failed to save drawing")
    return
  }

  const data = await response.json()

  let thumb = document.querySelector(`.thumb-canvas[data-id="${data.id}"]`)

  if (!thumb) {
    thumb = createThumbnail(data.id, pixels)
  } else {
    drawThumbnail(thumb, pixels)
  }

  activeDrawingId = data.id
  deleteBtn.disabled = false
}

// =======================
// Delete
// =======================
deleteBtn.onclick = async () => {
  if (!activeDrawingId) return

  const response = await fetch("/Drawings/DeleteAjax", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(activeDrawingId),
  })

  if (!response.ok) {
    alert("Failed to delete drawing")
    return
  }

  const thumb = document.querySelector(
    `.thumb-canvas[data-id="${activeDrawingId}"]`
  )

  if (thumb) thumb.parentElement.remove()

  activeDrawingId = null
  deleteBtn.disabled = true
  buildEmptyGrid()
}

// =======================
// Init
// =======================
buildEmptyGrid()
