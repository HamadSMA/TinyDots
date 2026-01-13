using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using TinyDots.Data;
using TinyDots.Models;

namespace TinyDots.Controllers
{
    [Authorize]
    [IgnoreAntiforgeryToken] // 🔥 REQUIRED for fetch-based POSTs
    public class DrawingsController : Controller
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;

        public DrawingsController(AppDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
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

        // =========================
        // AI GENERATE
        // =========================
        [HttpPost]
        public async Task<IActionResult> GenerateImage([FromBody] GenerateImageRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Prompt))
            {
                return BadRequest("Prompt is required");
            }

            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return StatusCode(500, "OpenAI API key not configured");
            }

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);

            var payload = new
            {
                model = "gpt-image-1",
                prompt = request.Prompt,
                size = "256x256",
                response_format = "b64_json"
            };

            var content = new StringContent(
                JsonSerializer.Serialize(payload),
                Encoding.UTF8,
                "application/json"
            );

            var response = await client.PostAsync("https://api.openai.com/v1/images/generations", content);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, responseBody);
            }

            using var doc = JsonDocument.Parse(responseBody);
            var base64 = doc.RootElement
                .GetProperty("data")[0]
                .GetProperty("b64_json")
                .GetString();

            if (string.IsNullOrWhiteSpace(base64))
            {
                return StatusCode(500, "No image returned from OpenAI");
            }

            return Json(new { imageBase64 = base64 });
        }
    }
}
