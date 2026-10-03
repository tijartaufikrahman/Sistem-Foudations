using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using SaasBringtimeSolution.Services;

namespace SaasBringtimeSolution.Filters
{
    public class DynamicMenuAuthorizeAttribute : TypeFilterAttribute
    {
        public DynamicMenuAuthorizeAttribute() : base(typeof(DynamicMenuAuthorizeFilter))
        {
        }
    }

    public class DynamicMenuAuthorizeFilter : IAsyncActionFilter
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _memoryCache;
        private readonly IFoundationService _foundationService;

        public DynamicMenuAuthorizeFilter(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IMemoryCache memoryCache,
            IFoundationService foundationService)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _memoryCache = memoryCache;
            _foundationService = foundationService;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            var httpContext = context.HttpContext;
            var path = httpContext.Request.Path.Value?.TrimEnd('/') ?? "";

            // 1. Ambil Session Pengguna
            string? userJson = null;

            string[] cookieKeys = {
                "bringtime_user_session",
                "bringtime_session_foundation",
                "bringtime_session_donor",
                "bringtime_session_admin",
                "saaso_user_session"
            };

            foreach (var key in cookieKeys)
            {
                if (httpContext.Request.Cookies.TryGetValue(key, out var val) && !string.IsNullOrWhiteSpace(val))
                {
                    userJson = val;
                    break;
                }
            }

            if (string.IsNullOrWhiteSpace(userJson))
            {
                // Pengguna belum login, alihkan ke /Account/Login
                context.Result = new RedirectResult("/Auth/Login");
                return;
            }

            try
            {
                var decodedUserJson = System.Net.WebUtility.UrlDecode(userJson);
                using var userDoc = JsonDocument.Parse(decodedUserJson);
                var root = userDoc.RootElement;

                // Ambil daftar role id dan nama role
                var roleIds = new List<int>();
                if (root.TryGetProperty("roleIds", out var rIdsElem) && rIdsElem.ValueKind == JsonValueKind.Array)
                {
                    foreach (var item in rIdsElem.EnumerateArray())
                    {
                        if (item.TryGetInt32(out var rid)) roleIds.Add(rid);
                    }
                }
                else if (root.TryGetProperty("roleId", out var rIdElem) && rIdElem.TryGetInt32(out var rId))
                {
                    roleIds.Add(rId);
                }

                // Cek Super Admin
                bool isSuperAdmin = roleIds.Contains(1) || roleIds.Contains(4);
                if (!isSuperAdmin && root.TryGetProperty("roles", out var rolesArr) && rolesArr.ValueKind == JsonValueKind.Array)
                {
                    foreach (var r in rolesArr.EnumerateArray())
                    {
                        var rStr = r.GetString() ?? "";
                        if (rStr.Contains("super", StringComparison.OrdinalIgnoreCase) || rStr.Equals("admin", StringComparison.OrdinalIgnoreCase))
                        {
                            isSuperAdmin = true;
                            break;
                        }
                    }
                }

                // Cek Foundation ID afiliasi pengguna
                long userFoundationId = 0;
                if (root.TryGetProperty("foundationId", out var fIdElem) && fIdElem.TryGetInt64(out var fid))
                {
                    userFoundationId = fid;
                }

                var userFoundationIds = new List<long>();
                if (root.TryGetProperty("foundationIds", out var fIdsElem) && fIdsElem.ValueKind == JsonValueKind.Array)
                {
                    foreach (var elem in fIdsElem.EnumerateArray())
                    {
                        if (elem.TryGetInt64(out var idVal)) userFoundationIds.Add(idVal);
                    }
                }
                if (userFoundationId > 0 && !userFoundationIds.Contains(userFoundationId))
                {
                    userFoundationIds.Add(userFoundationId);
                }

                var configuredFoundationId = _foundationService.GetConfiguredFoundationId();

                // Jika pengguna bukan Super Admin dan bukan Donatur murni, pastikan yayasannya cocok dengan website ini
                bool isDonor = roleIds.Contains(3) || roleIds.Contains(6);
                if (!isSuperAdmin && !isDonor)
                {
                    if (userFoundationIds.Count > 0 && !userFoundationIds.Contains(configuredFoundationId))
                    {
                        // Akun yayasan lain mencoba membuka portal yayasan ini
                        context.Result = new RedirectResult("/Auth/Login");
                        return;
                    }
                }

                // Lolos verifikasi
                await next();
            }
            catch
            {
                context.Result = new RedirectResult("/Auth/Login");
            }
        }
    }
}
