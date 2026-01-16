namespace TinyDots.Models
{
    public class GenerateImageRequest
    {
        public required string Prompt { get; set; }
        public required string Size { get; set; }
        public int? GridSize { get; set; }
    }
}
