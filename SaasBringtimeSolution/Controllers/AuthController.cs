using Microsoft.AspNetCore.Mvc;
using SaasBringtimeSolution.Services;

namespace SaasBringtimeSolution.Controllers
{
    public class AuthController : Controller
    {
        private readonly IFoundationService _foundationService;

        public AuthController(IFoundationService foundationService)
        {
            _foundationService = foundationService;
        }

        private async Task SetupFoundationViewDataAsync()
        {
            var f = await _foundationService.GetCurrentFoundationAsync();
            if (f != null)
            {
                ViewData["FoundationId"] = f.Id;
                ViewData["FoundationSlug"] = f.Slug;
                ViewData["FoundationDomain"] = f.Domain ?? "";
                ViewData["Tenant"] = f.Slug;
                ViewData["FoundationName"] = f.Name;
                ViewData["IsTenant"] = true;
            }
        }

        [HttpGet("Auth/Login")]
        [HttpGet("Account/Login")]
        public async Task<IActionResult> Login([FromQuery] string? tab = "login")
        {
            await SetupFoundationViewDataAsync();
            ViewData["Title"] = "Masuk Akun";
            ViewData["InitialTab"] = string.Equals(tab, "register", StringComparison.OrdinalIgnoreCase) ? "register" : "login";
            return View();
        }

        [HttpGet("Auth/Register")]
        [HttpGet("Account/Register")]
        public async Task<IActionResult> Register()
        {
            await SetupFoundationViewDataAsync();
            ViewData["Title"] = "Daftar Akun Donatur";
            ViewData["InitialTab"] = "register";
            return View("Login");
        }

        [HttpGet("Auth/Logout")]
        [HttpGet("Account/Logout")]
        public IActionResult Logout()
        {
            var deleteOptions = new CookieOptions
            {
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddDays(-1)
            };
            foreach (var cookieKey in Request.Cookies.Keys)
            {
                Response.Cookies.Delete(cookieKey, deleteOptions);
                Response.Cookies.Delete(cookieKey);
            }
            Response.Headers["Clear-Site-Data"] = "\"cookies\", \"storage\"";
            return Redirect("/Auth/Login?logout=1");
        }

        [HttpGet("Auth/ForgotPassword")]
        [HttpGet("Account/ForgotPassword")]
        public async Task<IActionResult> ForgotPassword()
        {
            await SetupFoundationViewDataAsync();
            ViewData["Title"] = "Lupa Password";
            return View();
        }

        [HttpGet("Auth/VerifyOtp")]
        [HttpGet("Account/VerifyOtp")]
        public async Task<IActionResult> VerifyOtp([FromQuery] string? email = null)
        {
            await SetupFoundationViewDataAsync();
            ViewData["Title"] = "Verifikasi Kode OTP";
            ViewData["Email"] = email;
            return View();
        }

        [HttpGet("Auth/ResetPassword")]
        [HttpGet("Account/ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromQuery] string? token = null, [FromQuery] string? otp = null, [FromQuery] string? email = null)
        {
            await SetupFoundationViewDataAsync();
            ViewData["Title"] = "Atur Ulang Kata Sandi";
            ViewData["Token"] = token;
            ViewData["Otp"] = !string.IsNullOrEmpty(otp) ? otp : token;
            ViewData["Email"] = email;
            return View();
        }
    }
}
