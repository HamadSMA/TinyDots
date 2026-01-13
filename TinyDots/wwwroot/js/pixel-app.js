// =======================
// State
// =======================
let gridSize = 32
let pixels = []
let activeDrawingId = null

let isDrawing = false
let currentColor = "#000000"
let isEraser = false
let isReadOnly = false
let colorHistory = []
let colorPickedFromHistory = false
const colorHistoryKey = "tinydots.colorHistory"
const colorHistorySize = 5

// =======================
// DOM Elements
// =======================
const grid = document.getElementById("grid")
const gridCanvas = document.getElementById("gridCanvas")
const gridCtx = gridCanvas ? gridCanvas.getContext("2d") : null
const drawingList = document.getElementById("drawingList")
const colorPicker = document.getElementById("colorPicker")
const eraserBtn = document.getElementById("eraserBtn")
const colorHistoryEl = document.getElementById("colorHistory")
const colorTintsEl = document.getElementById("colorTints")
const colorShadesEl = document.getElementById("colorShades")

const newBtn = document.getElementById("newBtn")
const saveBtn = document.getElementById("saveBtn")
const gridSizeButtons = document.querySelectorAll(".grid-size-btn")
const openGalleryBtn = document.getElementById("openGalleryBtn")
const galleryModal = document.getElementById("galleryModal")
const galleryGrid = document.getElementById("galleryGrid")
const sidebarThumbLimit = 4
const aiPrompt = document.getElementById("aiPrompt")
const aiGenerateBtn = document.getElementById("aiGenerateBtn")
const aiDownloadBtn = document.getElementById("aiDownloadBtn")
const statusGrid = document.getElementById("statusGrid")
const statusColor = document.getElementById("statusColor")
const statusEraser = document.getElementById("statusEraser")

// =======================
// Grid Helpers
// =======================
function buildEmptyGrid() {
  pixels = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
  isReadOnly = false
  renderGrid()
  updateStatusBar()
}

function clonePixels(data) {
  return data.map((row) => row.slice())
}

function setCanvasSize() {
  if (!gridCanvas || !gridCtx) return
  gridCanvas.width = gridSize
  gridCanvas.height = gridSize
  gridCtx.imageSmoothingEnabled = false
}

function toHex(value) {
  return value.toString(16).padStart(2, "0")
}

function applyImageToGrid(img) {
  if (!gridCanvas || !gridCtx) return
  const canvas = document.createElement("canvas")
  canvas.width = gridSize
  canvas.height = gridSize
  const ctx = canvas.getContext("2d")
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, 0, 0, gridSize, gridSize)
  const data = ctx.getImageData(0, 0, gridSize, gridSize).data

  pixels = Array.from({ length: gridSize }, () => Array(gridSize).fill(null))
  isReadOnly = false
  activeDrawingId = null
  setCanvasSize()
  gridCtx.clearRect(0, 0, gridSize, gridSize)

  let y = 0
  const rowsPerFrame = 1

  function paintRows() {
    const end = Math.min(gridSize, y + rowsPerFrame)
    for (; y < end; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        const idx = (y * gridSize + x) * 4
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]
        const a = data[idx + 3]
        const color = a === 0 ? null : `#${toHex(r)}${toHex(g)}${toHex(b)}`
        pixels[y][x] = color
        if (color) {
          gridCtx.fillStyle = color
          gridCtx.fillRect(x, y, 1, 1)
        }
      }
    }

    if (y < gridSize) {
      requestAnimationFrame(paintRows)
      return
    }

    updateStatusBar()
  }

  paintRows()
}

function renderGridToDataUrl() {
  if (!gridCanvas || !gridCtx) return ""
  renderGrid()
  return gridCanvas.toDataURL("image/png")
}

function loadColorHistory() {
  try {
    const stored = JSON.parse(localStorage.getItem(colorHistoryKey))
    if (Array.isArray(stored)) {
      const trimmed = stored
        .filter((color) => typeof color === "string")
        .slice(0, colorHistorySize)
      return trimmed.concat(Array(colorHistorySize - trimmed.length).fill(null))
    }
  } catch (err) {
    return Array(colorHistorySize).fill(null)
  }

  return Array(colorHistorySize).fill(null)
}

function saveColorHistory() {
  const payload = colorHistory.filter((color) => typeof color === "string")
  localStorage.setItem(colorHistoryKey, JSON.stringify(payload))
}

function renderGrid() {
  if (!gridCanvas || !gridCtx) return
  setCanvasSize()
  gridCtx.clearRect(0, 0, gridSize, gridSize)
  pixels.forEach((row, y) => {
    row.forEach((color, x) => {
      if (!color) return
      gridCtx.fillStyle = color
      gridCtx.fillRect(x, y, 1, 1)
    })
  })
}

document.addEventListener("mouseup", () => {
  isDrawing = false
})

function handleGridPaintEvent(event) {
  if (isReadOnly) return
  if (!gridCanvas) return
  const rect = gridCanvas.getBoundingClientRect()
  const scaleX = gridSize / rect.width
  const scaleY = gridSize / rect.height
  const x = Math.floor((event.clientX - rect.left) * scaleX)
  const y = Math.floor((event.clientY - rect.top) * scaleY)
  if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) return
  paintPixel(x, y)
}

gridCanvas?.addEventListener("mousedown", (event) => {
  isDrawing = true
  handleGridPaintEvent(event)
})

gridCanvas?.addEventListener("mousemove", (event) => {
  if (!isDrawing) return
  handleGridPaintEvent(event)
})

// =======================
// Drawing Tools
// =======================
function paintPixel(x, y) {
  if (isReadOnly) return
  if (!gridCtx) return
  if (isEraser) {
    pixels[y][x] = null
    gridCtx.clearRect(x, y, 1, 1)
    return
  }

  // 🎨 First actual usage of color → register in history
  if (!colorPickedFromHistory) {
    const existingIndex = colorHistory.indexOf(currentColor)
    if (existingIndex !== 0) {
      if (existingIndex > 0) colorHistory.splice(existingIndex, 1)
      colorHistory.unshift(currentColor)
      colorHistory = colorHistory
        .slice(0, colorHistorySize)
        .concat(Array(colorHistorySize).fill(null))
        .slice(0, colorHistorySize)
      saveColorHistory()
      renderColorHistory()
    }
  }

  pixels[y][x] = currentColor
  gridCtx.fillStyle = currentColor
  gridCtx.fillRect(x, y, 1, 1)
}

// =======================
// Color System
// =======================
function setColor(color, options = {}) {
  currentColor = color
  isEraser = false
  eraserBtn.classList.remove("tool-active")
  colorPickedFromHistory = options.fromHistory === true
  renderColorHistory()
  renderColorScales()
  updateStatusBar()
}

function renderColorHistory() {
  colorHistoryEl.innerHTML = ""

  colorHistory.forEach((color) => {
    const div = document.createElement("div")
    div.className = "color-history-item"
    if (color) {
      div.style.backgroundColor = color
      if (!isEraser && color === currentColor) {
        div.classList.add("selected")
      }
      div.onclick = () => {
        setColor(color, { fromHistory: true })
        colorPicker.value = color
      }
    } else {
      div.classList.add("empty")
    }
    colorHistoryEl.appendChild(div)
  })
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "")
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return { r, g, b }
}

function rgbToHex(r, g, b) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function mixColor(base, target, amount) {
  const r = Math.round(base.r + (target.r - base.r) * amount)
  const g = Math.round(base.g + (target.g - base.g) * amount)
  const b = Math.round(base.b + (target.b - base.b) * amount)
  return rgbToHex(r, g, b)
}

function renderColorScales() {
  if (!colorTintsEl || !colorShadesEl) return
  const base = hexToRgb(currentColor)
  const tints = [0.2, 0.4, 0.6, 0.8].map((amount) =>
    mixColor(base, { r: 255, g: 255, b: 255 }, amount)
  )
  const shades = [0.2, 0.4, 0.6, 0.8].map((amount) =>
    mixColor(base, { r: 0, g: 0, b: 0 }, amount)
  )

  colorTintsEl.innerHTML = ""
  colorShadesEl.innerHTML = ""

  tints.forEach((color) => {
    const swatch = document.createElement("div")
    swatch.className = "color-scale-item"
    swatch.style.backgroundColor = color
    swatch.addEventListener("click", () => {
      setColor(color)
      colorPicker.value = color
    })
    colorTintsEl.appendChild(swatch)
  })

  shades.forEach((color) => {
    const swatch = document.createElement("div")
    swatch.className = "color-scale-item"
    swatch.style.backgroundColor = color
    swatch.addEventListener("click", () => {
      setColor(color)
      colorPicker.value = color
    })
    colorShadesEl.appendChild(swatch)
  })
}

colorPicker.addEventListener("input", (e) => setColor(e.target.value))

eraserBtn.addEventListener("click", () => {
  isEraser = true
  eraserBtn.classList.add("tool-active")
  renderColorHistory()
  updateStatusBar()
})

// =======================
// New Button
// =======================
newBtn.onclick = () => {
  activeDrawingId = null
  isReadOnly = false
  buildEmptyGrid()
}

// =======================
// Grid Size
// =======================
gridSizeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextSize = Number(button.dataset.size)
    if (!nextSize || nextSize === gridSize) return
    gridSize = nextSize
    activeDrawingId = null
    gridSizeButtons.forEach((btn) => btn.classList.remove("selected"))
    button.classList.add("selected")
    buildEmptyGrid()
  })
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

function updateStatusBar() {
  if (!statusGrid || !statusColor || !statusEraser) return
  statusGrid.textContent = `${gridSize}×${gridSize}`
  statusColor.textContent = currentColor.toUpperCase()
  statusEraser.textContent = isEraser ? "Active" : "Inactive"
}

function loadDrawing(data, id) {
  isReadOnly = true
  pixels = clonePixels(data)
  gridSize = data.length
  activeDrawingId = id
  renderGrid()
  updateStatusBar()
}

function editDrawing(data, id) {
  isReadOnly = false
  pixels = clonePixels(data)
  gridSize = data.length
  activeDrawingId = id
  renderGrid()
  updateStatusBar()
}

async function deleteDrawing(id, li) {
  if (!id) return
  const shouldDelete = confirm("Delete this drawing?")
  if (!shouldDelete) return

  const response = await fetch("/Drawings/DeleteAjax", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Number(id)),
  })

  if (!response.ok) {
    alert("Failed to delete drawing")
    return
  }

  if (!li) {
    const canvas = drawingList.querySelector(`.thumb-canvas[data-id="${id}"]`)
    li = canvas ? canvas.closest(".thumb-item") : null
  }

  if (li) li.remove()
  if (Number(activeDrawingId) === Number(id)) {
    activeDrawingId = null
    buildEmptyGrid()
  }

  updateSidebarThumbnails()
  if (galleryModal && galleryModal.classList.contains("is-open")) {
    buildGalleryModal()
  }
}

function setThumbnailData(canvas, data) {
  canvas.dataset.pixels = JSON.stringify(data)
  drawThumbnail(canvas, data)
}

function attachThumbnailDelete(button) {
  button.addEventListener("click", (e) => {
    e.stopPropagation()
    const li = button.closest(".thumb-item")
    deleteDrawing(button.dataset.id, li)
  })
}

function attachThumbnailEdit(button) {
  button.addEventListener("click", (e) => {
    e.stopPropagation()
    const shouldEdit = confirm("Edit this drawing?")
    if (!shouldEdit) return
    const li = button.closest(".thumb-item")
    const canvas = li ? li.querySelector(".thumb-canvas") : null
    if (!canvas) return
    const data = JSON.parse(canvas.dataset.pixels)
    editDrawing(data, Number(button.dataset.id))
  })
}

function attachThumbnailClick(canvas) {
  canvas.addEventListener("click", () => {
    const data = JSON.parse(canvas.dataset.pixels)
    loadDrawing(data, Number(canvas.dataset.id))
  })
}

function updateSidebarThumbnails() {
  if (!drawingList) return
  const items = drawingList.querySelectorAll(".thumb-item")
  items.forEach((item, index) => {
    item.style.display = index < sidebarThumbLimit ? "" : "none"
  })
}

function closeGallery() {
  if (!galleryModal) return
  galleryModal.classList.remove("is-open")
  galleryModal.setAttribute("aria-hidden", "true")
}

function buildGalleryModal() {
  if (!galleryGrid) return
  galleryGrid.innerHTML = ""

  drawingList.querySelectorAll(".thumb-canvas").forEach((canvas) => {
    const data = JSON.parse(canvas.dataset.pixels)
    const id = Number(canvas.dataset.id)

    const item = document.createElement("div")
    item.className = "modal-thumb"

    const preview = document.createElement("canvas")
    preview.width = 64
    preview.height = 64
    drawThumbnail(preview, data)
    preview.addEventListener("click", () => {
      loadDrawing(data, id)
      closeGallery()
    })

    const actions = document.createElement("div")
    actions.className = "modal-actions"

    const editButton = document.createElement("button")
    editButton.type = "button"
    editButton.textContent = "Edit"
    editButton.addEventListener("click", () => {
      const shouldEdit = confirm("Edit this drawing?")
      if (!shouldEdit) return
      editDrawing(data, id)
      closeGallery()
    })

    const deleteButton = document.createElement("button")
    deleteButton.type = "button"
    deleteButton.textContent = "Delete"
    deleteButton.addEventListener("click", () => {
      deleteDrawing(id, null)
    })

    actions.appendChild(editButton)
    actions.appendChild(deleteButton)

    item.appendChild(preview)
    item.appendChild(actions)
    galleryGrid.appendChild(item)
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

  setThumbnailData(canvas, data)
  attachThumbnailClick(canvas)

  li.appendChild(canvas)
  const actions = document.createElement("div")
  actions.className = "thumb-actions"

  const editButton = document.createElement("button")
  editButton.type = "button"
  editButton.className = "thumb-edit"
  editButton.textContent = "Edit"
  editButton.dataset.id = id
  attachThumbnailEdit(editButton)

  const deleteButton = document.createElement("button")
  deleteButton.type = "button"
  deleteButton.className = "thumb-delete"
  deleteButton.textContent = "Delete"
  deleteButton.setAttribute("aria-label", "Delete drawing")
  deleteButton.dataset.id = id
  attachThumbnailDelete(deleteButton)

  actions.appendChild(editButton)
  actions.appendChild(deleteButton)
  li.appendChild(actions)
  drawingList.appendChild(li)
  updateSidebarThumbnails()
  if (galleryModal && galleryModal.classList.contains("is-open")) {
    buildGalleryModal()
  }
  return canvas
}

// =======================
// Initialize Existing Thumbnails
// =======================
document.querySelectorAll(".thumb-canvas").forEach((canvas) => {
  const data = JSON.parse(canvas.dataset.pixels)
  setThumbnailData(canvas, data)
  attachThumbnailClick(canvas)
})

document.querySelectorAll(".thumb-delete").forEach((button) => {
  attachThumbnailDelete(button)
})

document.querySelectorAll(".thumb-edit").forEach((button) => {
  attachThumbnailEdit(button)
})

if (openGalleryBtn) {
  openGalleryBtn.addEventListener("click", () => {
    buildGalleryModal()
    galleryModal.classList.add("is-open")
    galleryModal.setAttribute("aria-hidden", "false")
  })
}

if (galleryModal) {
  galleryModal.addEventListener("click", (e) => {
    const target = e.target
    if (target.dataset && target.dataset.close === "true") {
      closeGallery()
    }
  })
}

async function handleGenerateClick() {
  if (!aiPrompt || !aiGenerateBtn) return
  if (aiGenerateBtn.disabled) return
  const prompt = aiPrompt.value.trim()
  if (!prompt) return

  aiGenerateBtn.disabled = true
  const originalText = aiGenerateBtn.textContent
  aiGenerateBtn.textContent = "Generating..."
  const safetyResetId = setTimeout(() => {
    aiGenerateBtn.disabled = false
    aiGenerateBtn.textContent = originalText
  }, 65000)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 60000)
    const response = await fetch("/Drawings/GenerateImage", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, size: "1024x1024" }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const message = await response.text()
      alert(message || "Failed to generate image")
      return
    }

    const data = await response.json()
    const img = new Image()
    img.onload = () => applyImageToGrid(img)
    img.src = `data:image/png;base64,${data.imageBase64}`
  } catch (err) {
    alert("Failed to generate image")
  } finally {
    clearTimeout(safetyResetId)
    aiGenerateBtn.disabled = false
    aiGenerateBtn.textContent = originalText
  }
}

if (aiGenerateBtn) {
  aiGenerateBtn.addEventListener("click", handleGenerateClick)
}

if (aiDownloadBtn) {
  aiDownloadBtn.addEventListener("click", () => {
    const dataUrl = renderGridToDataUrl()
    const link = document.createElement("a")
    link.href = dataUrl
    link.download = "pixelettuce.png"
    document.body.appendChild(link)
    link.click()
    link.remove()
  })
}

document.addEventListener("click", (e) => {
  const target = e.target
  if (target && target.id === "aiGenerateBtn") {
    handleGenerateClick()
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
    setThumbnailData(thumb, pixels)
  }

  activeDrawingId = data.id
}

// =======================
// Init
// =======================
buildEmptyGrid()
updateStatusBar()
colorHistory = loadColorHistory()
renderColorHistory()
renderColorScales()
gridSizeButtons.forEach((button) => {
  if (Number(button.dataset.size) === gridSize) {
    button.classList.add("selected")
  }
})
updateSidebarThumbnails()
