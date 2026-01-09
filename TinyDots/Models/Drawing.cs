using System;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Net.Http.Headers;

namespace TinyDots.Models
{
    public class Drawing
    {
        public int Id { get; set; }
        public required string PixelData { get; set; }
        public DateTime CreatedAt { get; set; }
        
        public string UserId { get; set; }
        public ApplicationUser User { get; set; }
    }
}