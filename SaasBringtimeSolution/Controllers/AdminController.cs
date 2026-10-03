using Microsoft.AspNetCore.Mvc;
using SaasBringtimeSolution.Filters;
using SaasBringtimeSolution.Services;

namespace SaasBringtimeSolution.Controllers
{
    [DynamicMenuAuthorize]
    public class AdminController : Controller
    {
        private readonly IFoundationService _foundationService;

        public AdminController(IFoundationService foundationService)
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

        [HttpGet]
        [Route("Dashboard")]
        [Route("Admin/Dashboard")]
        public async Task<IActionResult> Dashboard()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Dashboard Platform";
            return View();
        }

        [HttpGet]
        [Route("Foundations")]
        [Route("Mitra")]
        [Route("Partners")]
        [Route("Admin/Foundations")]
        public async Task<IActionResult> Foundations()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Kelola Mitra";
            return View();
        }

        [HttpGet]
        [Route("Users")]
        [Route("Admin/Users")]
        public async Task<IActionResult> Users()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Kelola Pengguna Global";
            return View();
        }

        [HttpGet]
        [Route("Roles")]
        [Route("Admin/Roles")]
        public async Task<IActionResult> Roles()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Kelola Roles & Hak Akses";
            return View();
        }

        [HttpGet]
        [Route("UserRoles")]
        [Route("Admin/UserRoles")]
        public async Task<IActionResult> UserRoles()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "User Roles Assignment";
            return View();
        }

        [HttpGet]
        [Route("Menus")]
        [Route("Admin/Menus")]
        public async Task<IActionResult> Menus()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Kelola Menu Sistem";
            return View();
        }

        [HttpGet]
        [Route("Groups")]
        [Route("Admin/Groups")]
        public async Task<IActionResult> Groups()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Kelola Grup Menu";
            return View();
        }

        [HttpGet]
        [Route("MenuRoles")]
        [Route("Admin/MenuRoles")]
        public async Task<IActionResult> MenuRoles()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Menu Roles Mapping";
            return View();
        }

        [HttpGet]
        [Route("Navbars")]
        [Route("Admin/Navbars")]
        public async Task<IActionResult> Navbars()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Kelola Navbar - (Master)";
            return View();
        }

        [HttpGet]
        [Route("NavbarGroups")]
        [Route("Admin/NavbarGroups")]
        public async Task<IActionResult> NavbarGroups()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Kelola Grup Navbar - (Master)";
            return View();
        }

        [HttpGet]
        [Route("FoundationNavbars")]
        [Route("NavbarMitra")]
        [Route("Admin/FoundationNavbars")]
        public async Task<IActionResult> FoundationNavbars()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Foundation Navbar";
            return View();
        }

        [HttpGet]
        [Route("FoundationTypes")]
        [Route("MasterType")]
        [Route("MasterTypes")]
        [Route("Admin/FoundationTypes")]
        public async Task<IActionResult> FoundationTypes()
        {
            await SetupViewDataAsync();
            ViewData["Title"] = "Master Type Mitra - (Master)";
            return View();
        }

        [HttpGet]
        [Route("Approvals")]
        [Route("Admin/Approvals")]
        public IActionResult Approvals() => RedirectToAction("Dashboard");

        [HttpGet]
        [Route("ApprovalRoles")]
        [Route("Admin/ApprovalRoles")]
        public IActionResult ApprovalRoles() => RedirectToAction("Dashboard");
    }
}
