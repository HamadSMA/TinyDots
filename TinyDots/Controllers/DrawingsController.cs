

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

    }
}