namespace TinyDots.Models
{
    public class SaveDrawingRequest
    {
        public int? Id { get; set; }
        public required string PixelData { get; set; }
    }
}
