using Microsoft.AspNetCore.Mvc;
using SaasBringtimeSolution.Filters;
using SaasBringtimeSolution.Services;

namespace SaasBringtimeSolution.Controllers
{
    [DynamicMenuAuthorize]
    public class FoundationController : Controller
    {
        private readonly IFoundationService _foundationService;

        public FoundationController(IFoundationService foundationService)
        {
            _foundationService = foundationService;
        }

        private async Task SetupViewDataAsync()
        {
            var f = await _foundationService.GetCurrentFoundationAsync();
            if (f != null)
            {
                ViewData["FoundationId"] = f.Id;
                ViewData["FoundationName"] = f.Name;
                ViewData["Tenant"] = f.Slug;
                ViewData["Slug"] = f.Slug;
            }
        }

        [HttpGet("Foundation/Dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Dashboard Yayasan";
            return View();
        }

        [HttpGet("Foundation/Campaigns")]
        public async Task<IActionResult> Campaigns()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Kelola Campaign";
            return View();
        }

        [HttpGet("Foundation/NewsPosts")]
        public async Task<IActionResult> NewsPosts()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Kelola Berita";
            return View();
        }

        [HttpGet("Foundation/Donations")]
        public async Task<IActionResult> Donations()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Daftar Donasi";
            return View();
        }

        [HttpGet("Foundation/Settings")]
        public async Task<IActionResult> Settings()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Pengaturan Yayasan";
            return View();
        
        }

        //[HttpGet("Foundation/Settings")]
        public async Task<IActionResult> dummy()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Pengaturan Yayasan";
            return View();

        }
    }
}
