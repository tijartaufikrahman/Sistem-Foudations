using Microsoft.AspNetCore.Mvc;
using SaasBringtimeSolution.Filters;
using SaasBringtimeSolution.Services;

namespace SaasBringtimeSolution.Controllers
{
    [DynamicMenuAuthorize]
    public class DonorController : Controller
    {
        private readonly IFoundationService _foundationService;

        public DonorController(IFoundationService foundationService)
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

        [HttpGet("Donor/Dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Dashboard Donatur";
            return View();
        }

        [HttpGet("Donor/History")]
        public async Task<IActionResult> History()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Riwayat Donasi";
            return View();
        }

        [HttpGet("Donor/Profile")]
        public async Task<IActionResult> Profile()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Profil Saya";
            return View();
        }
    }
}
