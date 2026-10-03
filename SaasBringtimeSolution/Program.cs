using SaasBringtimeSolution.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container (Frontend: Controllers + Views only)
builder.Services.AddControllersWithViews();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();

// Foundation identity service configured via appsettings.json
builder.Services.AddScoped<IFoundationService, FoundationService>();

var app = builder.Build();

// Forwarded Headers for Linux Nginx Reverse Proxy
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedFor | Microsoft.AspNetCore.HttpOverrides.ForwardedHeaders.XForwardedProto
});

// Configure the HTTP request pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseRouting();

// Standar Rute MVC ASP.NET Core: {controller}/{action}/{id?}
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
