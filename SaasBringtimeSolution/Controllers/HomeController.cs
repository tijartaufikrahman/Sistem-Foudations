using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using SaasBringtimeSolution.Models;
using SaasBringtimeSolution.Services;

namespace SaasBringtimeSolution.Controllers
{
    public class HomeController : Controller
    {
        private readonly IFoundationService _foundationService;

        public HomeController(IFoundationService foundationService)
        {
            _foundationService = foundationService;
        }

        private async Task SetupFoundationViewDataAsync()
        {
            var f = await _foundationService.GetCurrentFoundationAsync();
            if (f != null)
            {
                ViewData["FoundationId"] = f.Id;
                ViewData["FoundationName"] = f.Name;
                ViewData["FoundationLogo"] = f.LogoUrl ?? "";
                ViewData["Slug"] = f.Slug;
                ViewData["Domain"] = f.Domain ?? "";
                ViewData["Tenant"] = f.Slug;
                ViewData["IsKemitraan"] = false;
            }
        }

        [HttpGet("")]
        public async Task<IActionResult> Index()
        {
            await SetupFoundationViewDataAsync();
            var name = ViewData["FoundationName"] as string ?? "Yayasan";
            ViewData["Title"] = $"{name} - Beranda Portal Donasi Resmi";
            return View();
        }

        [HttpGet("Profile")]
        public async Task<IActionResult> Profile()
        {
            await SetupFoundationViewDataAsync();
            var name = ViewData["FoundationName"] as string ?? "Yayasan";
            ViewData["Title"] = $"Profil Lembaga - {name}";
            return View();
        }

        [HttpGet("Campaigns")]
        public async Task<IActionResult> Campaigns([FromQuery] string? cat, [FromQuery] string? q)
        {
            await SetupFoundationViewDataAsync();
            var name = ViewData["FoundationName"] as string ?? "Yayasan";
            ViewData["Title"] = $"Program Donasi & Bantuan Kemanusiaan - {name}";
            return View();
        }

        [HttpGet("Campaign/{slug}")]
        public async Task<IActionResult> CampaignDetail(string slug)
        {
            await SetupFoundationViewDataAsync();
            ViewData["Slug"] = slug;
            ViewData["Title"] = "Detail Campaign";
            return View();
        }

        [HttpGet("Donate/{slug}")]
        public async Task<IActionResult> Donate(string slug)
        {
            await SetupFoundationViewDataAsync();
            ViewData["Slug"] = slug;
            ViewData["Title"] = "Mulai Donasi";
            return View();
        }

        [HttpGet("PaymentStatus/{invoiceNumber}")]
        public async Task<IActionResult> PaymentStatus(string invoiceNumber)
        {
            await SetupFoundationViewDataAsync();
            ViewData["InvoiceNumber"] = invoiceNumber;
            ViewData["Title"] = "Status Pembayaran";
            return View();
        }

        [HttpGet("Prayers")]
        public async Task<IActionResult> Prayers()
        {
            await SetupFoundationViewDataAsync();
            var name = ViewData["FoundationName"] as string ?? "Yayasan";
            ViewData["Title"] = $"Untaian Doa Donatur - {name}";
            return View();
        }

        [HttpGet("Faq")]
        public async Task<IActionResult> Faq()
        {
            await SetupFoundationViewDataAsync();
            var name = ViewData["FoundationName"] as string ?? "Yayasan";
            ViewData["Title"] = $"Tanya Jawab (FAQ) - {name}";
            return View();
        }

        [HttpGet("News")]
        [HttpGet("Berita")]
        public async Task<IActionResult> News([FromQuery] string? cat, [FromQuery] string? q)
        {
            await SetupFoundationViewDataAsync();
            var name = ViewData["FoundationName"] as string ?? "Yayasan";
            ViewData["Title"] = $"Kabar & Berita - {name}";
            return View();
        }

        [HttpGet("News/{slug}")]
        [HttpGet("Berita/{slug}")]
        public async Task<IActionResult> NewsDetail(string slug)
        {
            await SetupFoundationViewDataAsync();
            ViewData["Slug"] = slug;
            ViewData["Title"] = "Detail Berita";
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
