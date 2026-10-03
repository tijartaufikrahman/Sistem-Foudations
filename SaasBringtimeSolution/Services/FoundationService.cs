using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace SaasBringtimeSolution.Services
{
    public class FoundationInfo
    {
        public long Id { get; set; }
        public long? UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Slug { get; set; } = string.Empty;
        public string? Domain { get; set; }
        public string? LogoUrl { get; set; }
        public string? BannerUrl { get; set; }
        public string? Bio { get; set; }
        public string? Address { get; set; }
        public string? WhatsappNumber { get; set; }
        public string? LegalPermitNumber { get; set; }
        public string? BankName { get; set; }
        public string? BankAccountNumber { get; set; }
        public string? BankAccountHolder { get; set; }
        public long? FoundationTypeId { get; set; }
        public string? FoundationTypeName { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public interface IFoundationService
    {
        long GetConfiguredFoundationId();
        Task<FoundationInfo?> GetCurrentFoundationAsync();
        Task<FoundationInfo?> GetFoundationByIdAsync(long id);
    }

    public class FoundationService : IFoundationService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly IMemoryCache _memoryCache;
        private readonly ILogger<FoundationService> _logger;

        public FoundationService(
            IHttpClientFactory httpClientFactory,
            IConfiguration configuration,
            IMemoryCache memoryCache,
            ILogger<FoundationService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _memoryCache = memoryCache;
            _logger = logger;
        }

        public long GetConfiguredFoundationId()
        {
            // Baca FoundationSettings:FoundationId dari appsettings.json
            var configVal = _configuration["FoundationSettings:FoundationId"] ?? _configuration["FoundationId"];
            if (long.TryParse(configVal, out var fid) && fid > 0)
            {
                return fid;
            }
            return 0;
        }

        public async Task<FoundationInfo?> GetCurrentFoundationAsync()
        {
            var fid = GetConfiguredFoundationId();
            if (fid <= 0) return null;
            return await GetFoundationByIdAsync(fid);
        }

        public async Task<FoundationInfo?> GetFoundationByIdAsync(long id)
        {
            if (id <= 0) return null;

            var cacheKey = $"foundation_info_id_{id}";
            if (_memoryCache.TryGetValue(cacheKey, out FoundationInfo? cached) && cached != null)
            {
                return cached;
            }

            try
            {
                var apiBaseUrl = _configuration["ApiBaseUrl"] ?? "http://localhost:10007/api";
                var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(5);

                var response = await client.GetAsync($"{apiBaseUrl}/foundations/{id}");
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var info = JsonSerializer.Deserialize<FoundationInfo>(json, options);
                    if (info != null)
                    {
                        _memoryCache.Set(cacheKey, info, TimeSpan.FromMinutes(10));
                        return info;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Gagal memuat profil Foundation ID {Id} dari API. Mencoba membaca langsung dari Database.", id);
            }

            // 2. Fallback langsung membaca dari Database SQL Server jika REST API sedang offline / belum nyala
            try
            {
                var connStr = _configuration.GetConnectionString("DefaultConnection");
                if (!string.IsNullOrEmpty(connStr))
                {
                    using var conn = new Microsoft.Data.SqlClient.SqlConnection(connStr);
                    await conn.OpenAsync();
                    using var cmd = conn.CreateCommand();
                    cmd.CommandText = "SELECT TOP 1 Id, UserId, Name, Slug, Domain, LogoUrl, BannerUrl, Bio, Address, WhatsappNumber, LegalPermitNumber, BankName, BankAccountNumber, BankAccountHolder, IsActive FROM foundations WHERE Id = @Id";
                    cmd.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@Id", id));
                    using var reader = await cmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        var dbInfo = new FoundationInfo
                        {
                            Id = Convert.ToInt64(reader["Id"]),
                            UserId = reader["UserId"] != DBNull.Value ? Convert.ToInt64(reader["UserId"]) : null,
                            Name = reader["Name"] != DBNull.Value ? reader["Name"].ToString()! : "",
                            Slug = reader["Slug"] != DBNull.Value ? reader["Slug"].ToString()! : "",
                            Domain = reader["Domain"] != DBNull.Value ? reader["Domain"].ToString() : null,
                            LogoUrl = reader["LogoUrl"] != DBNull.Value ? reader["LogoUrl"].ToString() : null,
                            BannerUrl = reader["BannerUrl"] != DBNull.Value ? reader["BannerUrl"].ToString() : null,
                            Bio = reader["Bio"] != DBNull.Value ? reader["Bio"].ToString() : null,
                            Address = reader["Address"] != DBNull.Value ? reader["Address"].ToString() : null,
                            WhatsappNumber = reader["WhatsappNumber"] != DBNull.Value ? reader["WhatsappNumber"].ToString() : null,
                            LegalPermitNumber = reader["LegalPermitNumber"] != DBNull.Value ? reader["LegalPermitNumber"].ToString() : null,
                            BankName = reader["BankName"] != DBNull.Value ? reader["BankName"].ToString() : null,
                            BankAccountNumber = reader["BankAccountNumber"] != DBNull.Value ? reader["BankAccountNumber"].ToString() : null,
                            BankAccountHolder = reader["BankAccountHolder"] != DBNull.Value ? reader["BankAccountHolder"].ToString() : null,
                            IsActive = reader["IsActive"] != DBNull.Value && Convert.ToBoolean(reader["IsActive"])
                        };
                        _memoryCache.Set(cacheKey, dbInfo, TimeSpan.FromMinutes(10));
                        return dbInfo;
                    }
                }
            }
            catch (Exception dbEx)
            {
                _logger.LogWarning(dbEx, "Gagal memuat profil Foundation ID {Id} langsung dari DB SQL Server.", id);
            }

            // Fallback profil dinamis sementara jika kedua metode belum siap
            var fallback = new FoundationInfo
            {
                Id = id,
                Name = "Portal Mitra",
                Slug = $"mitra-{id}",
                Domain = $"mitra{id}.org",
                Bio = "Portal Donasi & Filantropi Terpercaya untuk Kebaikan Ummat",
                BankName = "Bank Syariah Indonesia (BSI)",
                BankAccountNumber = "-",
                BankAccountHolder = "Yayasan Mitra",
                IsActive = true
            };

            _memoryCache.Set(cacheKey, fallback, TimeSpan.FromSeconds(5));
            return fallback;
        }
    }
}
