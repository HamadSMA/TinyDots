using TinyDots.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;


var builder = WebApplication.CreateBuilder(args);

// --------------------
// DATABASE
// --------------------
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(
            builder.Configuration.GetConnectionString("DefaultConnection")
        )
    )
);

// --------------------
// IDENTITY
// --------------------
builder.Services
    .AddDefaultIdentity<ApplicationUser>(options =>
    {
        options.SignIn.RequireConfirmedAccount = false;
    })
    .AddEntityFrameworkStores<AppDbContext>();


// --------------------
// MVC + RAZOR PAGES
// --------------------
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();

// --------------------
// BUILD APP (NO SERVICES AFTER THIS)
// --------------------
var app = builder.Build();

// --------------------
// MIDDLEWARE
// --------------------
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// --------------------
// ENDPOINTS
// --------------------
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Drawings}/{action=Index}/{id?}");

app.MapRazorPages();

app.Run();
