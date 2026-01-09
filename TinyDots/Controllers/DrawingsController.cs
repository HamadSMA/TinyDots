using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TinyDots.Data;
using TinyDots.Models;

namespace TinyDots.Controllers
{
    [Authorize]
    [IgnoreAntiforgeryToken] // 🔥 REQUIRED for fetch-based POSTs
    public class DrawingsController : Controller
    {
        private readonly AppDbContext _context;

        public DrawingsController(AppDbContext context)
        {
            _context = context;
        }

        // =========================
        // MAIN PAGE
        // =========================
        public IActionResult Index()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized();
            }

            var drawings = _context.Drawings
                .Where(d => d.UserId == userId)
                .ToList();

            return View(drawings);
        }

        // =========================
        // SAVE (CREATE / UPDATE)
        // =========================
        [HttpPost]
        public IActionResult Save([FromBody] SaveDrawingRequest request)
        {
            // 🔒 HARD GUARD — NO USER, NO SAVE
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized("UserId missing");
            }

            if (request == null)
            {
                return BadRequest("Request body missing");
            }

            if (string.IsNullOrWhiteSpace(request.PixelData))
            {
                return BadRequest("PixelData missing");
            }

            Drawing drawing;

            if (request.Id.HasValue)
            {
                drawing = _context.Drawings
                    .FirstOrDefault(d => d.Id == request.Id.Value && d.UserId == userId);

                if (drawing == null)
                {
                    return NotFound();
                }

                drawing.PixelData = request.PixelData;
            }
            else
            {
                drawing = new Drawing
                {
                    PixelData = request.PixelData,
                    CreatedAt = DateTime.UtcNow,
                    UserId = userId
                };

                _context.Drawings.Add(drawing);
            }

            _context.SaveChanges();

            return Json(new { id = drawing.Id });
        }

        // =========================
        // DELETE
        // =========================
        [HttpPost]
        public IActionResult DeleteAjax([FromBody] int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var drawing = _context.Drawings
                .FirstOrDefault(d => d.Id == id && d.UserId == userId);

            if (drawing == null)
            {
                return NotFound();
            }

            _context.Drawings.Remove(drawing);
            _context.SaveChanges();

            return Ok();
        }
    }
}
