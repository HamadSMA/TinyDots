using Microsoft.EntityFrameworkCore;
using TinyDots.Models;

namespace TinyDots.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<Drawing> Drawings { get; set; }
    }
}