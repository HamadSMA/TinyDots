

using Microsoft.AspNetCore.Mvc;
using TinyDots.Data;
using TinyDots.Models;
using System.Linq;

namespace TinyDots.Controllers
{
    public class DrawingsController : Controller
    {
        private readonly AppDbContext _context;

        public DrawingsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: /Drawings
        public IActionResult Index()
        {
            var drawings = _context.Drawings.ToList();
            return View(drawings);
        }

        // GET: /Drawings/Create
        public IActionResult Create()
        {
            return View();
        }


        // POST: /Drawings/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Create(string pixelData)
        {
            var drawing = new Drawing
            {
                PixelData = pixelData,
                CreatedAt = DateTime.Now
            };

            _context.Drawings.Add(drawing);
            _context.SaveChanges();

            return RedirectToAction(nameof(Index));
        }

        public IActionResult Details(int id)
        {
            var drawing = _context.Drawings.FirstOrDefault(d => d.Id == id);

            if (drawing == null)
            {
                return NotFound();
            }
            return View(drawing);
        }

        // GET: /Drawings/Edit/5
        public IActionResult Edit(int id)
        {
            var drawing = _context.Drawings.FirstOrDefault(d => d.Id == id);

            if (drawing == null)
            {
                return NotFound();
            }
            return View(drawing);
        }

        //POST: /Drwaings/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Edit(int id, string pixelData)
        {

            if (string.IsNullOrWhiteSpace(pixelData))
            {
                ModelState.AddModelError("", "Pixel data is missing.");
                return RedirectToAction(nameof(Edit), new { id });
            }

            var drawing = _context.Drawings.FirstOrDefault(d => d.Id == id);

            if (drawing == null)
            {
                return NotFound();
            }
            drawing.PixelData = pixelData;
            _context.SaveChanges();

            return RedirectToAction(nameof(Index));
        }

        //GET: /Drawings/Delete/5
        public IActionResult Delete(int id)
        {
            var drawing = _context.Drawings.FirstOrDefault(d => d.Id == id);
            if (drawing == null)
            {
                return NotFound();
            }
            return View(drawing);
        }

        // POST: /Drawings/Delete/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult DeleteConfirmed(int id)
        {
            var drawing = _context.Drawings.FirstOrDefault(d => d.Id == id);

            if (drawing == null)
            {
                return NotFound();
            }

            _context.Drawings.Remove(drawing);
            _context.SaveChanges();

            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public IActionResult Save([FromBody] SaveDrawingRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.PixelData))
            {
                return BadRequest();
            }

            Drawing drawing;

            if (request.Id.HasValue)
            {
                drawing = _context.Drawings.FirstOrDefault(d => d.Id == request.Id.Value);
                if (drawing == null) return NotFound();
                drawing.PixelData = request.PixelData;
            }
            else
            {
                drawing = new Drawing
                {
                    PixelData = request.PixelData,
                    CreatedAt = DateTime.Now
                };
                _context.Drawings.Add(drawing);
            }

            _context.SaveChanges();

            return Json(new { id = drawing.Id });
        }


        [HttpPost]
        public IActionResult DeleteAjax([FromBody] int id)
        {
            var drawing = _context.Drawings.FirstOrDefault(d => d.Id == id);
            if (drawing == null) return NotFound();

            _context.Drawings.Remove(drawing);
            _context.SaveChanges();

            return Ok();
        }


    }
}