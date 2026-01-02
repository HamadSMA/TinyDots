using System;

namespace TinyDots.Models
{
    public class Drawing
    {
        public int Id { get; set; }
        public required string PixelData { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}