/* =======================================================
   Bringtime Solution Admin JavaScript Core
   100% jQuery & Adheres to aturan_request_jquery.txt
   ======================================================= */

// 1. Sidebar Controller
window.setSidebarState = function (open) {
    var $sidebar = $('#sidebar');
    var $mainContent = $('#mainContent');
    var $overlay = $('#sidebarOverlay');
    var $topbar = $('.topbar');
    var isMobile = $(window).width() <= 991;

    if (isMobile) {
        if (open) {
            $sidebar.removeClass("closed");
            $overlay.addClass("show");
        } else {
            $sidebar.addClass("closed");
            $overlay.removeClass("show");
        }
    } else {
        if (open) {
            $sidebar.removeClass("closed");
            $mainContent.removeClass("sidebar-closed");
            $topbar.removeClass("sidebar-closed").css("left", "");
        } else {
            $sidebar.addClass("closed");
            $mainContent.addClass("sidebar-closed");
            $topbar.addClass("sidebar-closed").css("left", "0");
        }
    }
};

window.toggleSidebar = function (explicitState) {
    var $sidebar = $('#sidebar');
    var isOpen = !$sidebar.hasClass("closed");
    if (typeof explicitState === 'boolean') {
        window.setSidebarState(explicitState);
    } else {
        window.setSidebarState(!isOpen);
    }
};

$(function () {
    var isMobile = $(window).width() <= 991;
    if (isMobile) {
        window.setSidebarState(false);
    }

    $(window).on("resize", function () {
        if ($(window).width() > 991) {
            window.setSidebarState(true);
            $('#sidebarOverlay').removeClass("show");
        }
    });
});

// 2. Toast Notification Controller (Pure jQuery)
window.AdminToast = {
    _getContainer: function () {
        var $container = $('.admin-toast-wrap');
        if (!$container.length) {
            $container = $('<div class="admin-toast-wrap"></div>');
            $('body').append($container);
        }
        return $container;
    },
    show: function (msg, type) {
        var $container = this._getContainer();
        var icon = (type === 'error')
            ? '<i class="fas fa-circle-exclamation text-danger me-2"></i>'
            : '<i class="fas fa-circle-check text-success me-2"></i>';
        var $item = $('<div class="admin-toast-item toast-' + (type || 'success') + '">' + icon + '<span>' + msg + '</span></div>');
        $container.append($item);

        setTimeout(function () {
            $item.css({
                opacity: '0',
                transform: 'translateY(-10px)',
                transition: 'all 0.2s'
            });
            setTimeout(function () { $item.remove(); }, 200);
        }, 2800);
    },
    success: function (msg) { this.show(msg, 'success'); },
    error: function (msg) { this.show(msg, 'error'); }
};

// 3. Modal Helper (Pure jQuery)
window.AdminModal = {
    open: function (id) {
        $('#' + id).addClass('show');
    },
    close: function (id) {
        $('#' + id).removeClass('show');
    }
};

// 4. AdminTable - High-Performance Table Component
window.AdminTable = class {
    constructor(opts) {
        this.table = $(opts.table);
        this.tbody = $(opts.tbody);
        this.search = $(opts.search);
        this.lengthSel = $(opts.length);
        this.info = $(opts.info);
        this.paginate = $(opts.paginate);
        this.colKeys = opts.colKeys || [];
        this.renderRow = opts.renderRow;
        this.totalCols = opts.totalCols || 5;

        this.data = [];
        this.filtered = [];
        this.page = 1;
        this.pageSize = 10;
        this.sortCol = 0;
        this.sortAsc = true;

        this._bindEvents();
    }

    _bindEvents() {
        var self = this;
        if (this.lengthSel.length) {
            this.lengthSel.on('change', function () {
                self.pageSize = parseInt($(this).val()) || 10;
                self.page = 1;
                self.render();
            });
        }

        if (this.search.length) {
            this.search.on('input', function () {
                self.filter();
            });
        }

        this.table.find('thead th.sortable').on('click', function () {
            var colIdx = $(this).index();
            if (self.sortCol === colIdx) {
                self.sortAsc = !self.sortAsc;
            } else {
                self.sortCol = colIdx;
                self.sortAsc = true;
            }
            self.table.find('thead th.sortable i').remove();
            var iconClass = self.sortAsc ? 'fa-sort-up' : 'fa-sort-down';
            $(this).append(' <i class="fas ' + iconClass + ' ms-1" style="font-size:10px;"></i>');
            self.sort();
        });
    }

    setData(list) {
        this.data = list || [];
        this.filter();
    }

    filter() {
        var term = (this.search.val() || '').toLowerCase().trim();
        if (!term) {
            this.filtered = this.data.slice();
        } else {
            this.filtered = this.data.filter(function (item) {
                return Object.values(item).some(function (val) {
                    if (val === null || val === undefined) return false;
                    return String(val).toLowerCase().indexOf(term) !== -1;
                });
            });
        }
        this.sort();
    }

    sort() {
        var key = this.colKeys[this.sortCol];
        if (key) {
            var dir = this.sortAsc ? 1 : -1;
            this.filtered.sort(function (a, b) {
                var vA = a[key] !== undefined ? a[key] : '';
                var vB = b[key] !== undefined ? b[key] : '';
                if (typeof vA === 'string') vA = vA.toLowerCase();
                if (typeof vB === 'string') vB = vB.toLowerCase();
                if (vA < vB) return -1 * dir;
                if (vA > vB) return 1 * dir;
                return 0;
            });
        }
        this.page = 1;
        this.render();
    }

    render() {
        this.tbody.empty();
        var total = this.filtered.length;
        var start = (this.page - 1) * this.pageSize;
        var end = Math.min(start + this.pageSize, total);

        if (total === 0) {
            this.tbody.html('<tr><td colspan="' + this.totalCols + '" class="text-center py-4" style="color:#94a3b8;"><i class="fas fa-inbox me-2"></i>Tidak ada data ditemukan</td></tr>');
            if (this.info.length) this.info.text('Menampilkan 0 data');
            if (this.paginate.length) this.paginate.empty();
            return;
        }

        for (var i = start; i < end; i++) {
            this.tbody.append(this.renderRow(this.filtered[i], i + 1));
        }

        if (this.info.length) {
            this.info.text('Menampilkan ' + (start + 1) + ' - ' + end + ' dari ' + total + ' data');
        }

        this._renderPagination(total);
    }

    _renderPagination(total) {
        if (!this.paginate.length) return;
        this.paginate.empty();
        var totalPages = Math.ceil(total / this.pageSize);
        if (totalPages <= 1) return;

        var self = this;
        var prevBtn = $('<button type="button" class="page-btn">‹</button>');
        prevBtn.prop('disabled', this.page === 1);
        prevBtn.on('click', function () {
            self.page--;
            self.render();
        });
        this.paginate.append(prevBtn);

        for (var p = 1; p <= totalPages; p++) {
            if (p === 1 || p === totalPages || (p >= this.page - 1 && p <= this.page + 1)) {
                let pg = p;
                var pageBtn = $('<button type="button" class="page-btn ' + (this.page === pg ? 'active' : '') + '">' + pg + '</button>');
                pageBtn.on('click', function () {
                    self.page = pg;
                    self.render();
                });
                this.paginate.append(pageBtn);
            } else if (p === this.page - 2 || p === this.page + 2) {
                this.paginate.append('<span style="color:#cbd5e1; padding:0 3px;">...</span>');
            }
        }

        var nextBtn = $('<button type="button" class="page-btn">›</button>');
        nextBtn.prop('disabled', this.page === totalPages);
        nextBtn.on('click', function () {
            self.page++;
            self.render();
        });
        this.paginate.append(nextBtn);
    }
};

// Global escape utility
window.escHtml = function (str) {
    if (!str && str !== 0) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
};

// Global FontAwesome Icons Catalog (Shared across Kelola Menu, Kelola Grup, dll)
window.FONT_AWESOME_ICONS = [
    // Folder & Group Navigation
    { cls: 'fas fa-folder', name: 'folder direktori grup kelompok berkas folder-closed' },
    { cls: 'fas fa-folder-open', name: 'folder open direktori buka kelompok grup' },
    { cls: 'fas fa-folder-tree', name: 'folder tree direktori hierarki berkas pohon susunan' },
    { cls: 'fas fa-folder-plus', name: 'folder plus tambah kelompok direktori berkas' },
    { cls: 'fas fa-layer-group', name: 'layer group grup tumpukan lapisan kelompok menu' },
    { cls: 'fas fa-users-gear', name: 'users gear kelompok grup pengguna admin manajemen tim' },
    { cls: 'fas fa-sitemap', name: 'sitemap struktur hierarki organisasi bagan grup' },

    // Navigation & Dashboard
    { cls: 'fas fa-gauge-high', name: 'gauge dashboard speed kecepatan' },
    { cls: 'fas fa-chart-pie', name: 'chart pie diagram analitik statistik' },
    { cls: 'fas fa-chart-line', name: 'chart line grafik tren kenaikan performa' },
    { cls: 'fas fa-chart-simple', name: 'chart bar statistik batang metrik' },
    { cls: 'fas fa-bars', name: 'bars menu hamburger navigasi daftar' },
    { cls: 'fas fa-bars-staggered', name: 'bars staggered list menu tata letak' },
    { cls: 'fas fa-house', name: 'house home beranda dashboard utama' },
    { cls: 'fas fa-table-columns', name: 'table columns layout dashboard tata letak' },
    { cls: 'fas fa-compass', name: 'compass kompas navigasi jelajah arah' },

    // Users & Organizations
    { cls: 'fas fa-users', name: 'users orang anggota kelompok tim jamaah' },
    { cls: 'fas fa-user', name: 'user pengguna akun profile profil' },
    { cls: 'fas fa-user-gear', name: 'user gear setting kelola admin operator' },
    { cls: 'fas fa-user-shield', name: 'user shield keamanan hak akses role peran superadmin' },
    { cls: 'fas fa-user-check', name: 'user check verifikasi disetujui validasi' },
    { cls: 'fas fa-user-plus', name: 'user plus tambah anggota registrasi pendaftaran' },
    { cls: 'fas fa-id-card', name: 'id card identitas ktp profil kartu' },
    { cls: 'fas fa-building-ngo', name: 'building ngo yayasan lembaga organisasi kemitraan' },
    { cls: 'fas fa-building', name: 'building kantor instansi perusahaan gedung pusat' },
    { cls: 'fas fa-landmark', name: 'landmark pemerintah bank gedung resmi' },

    // Roles & Security
    { cls: 'fas fa-shield-halved', name: 'shield keamanan proteksi hak akses role peran otorisasi' },
    { cls: 'fas fa-shield-cat', name: 'shield cat cyber security firewall' },
    { cls: 'fas fa-lock', name: 'lock kunci sandi privasi gembok otentikasi' },
    { cls: 'fas fa-key', name: 'key kunci api token otentikasi akses' },
    { cls: 'fas fa-fingerprint', name: 'fingerprint sidik jari biometrik login keamanan' },
    { cls: 'fas fa-user-lock', name: 'user lock akun terkunci privasi blokir' },

    // Donation & Charity / Foundation
    { cls: 'fas fa-hand-holding-heart', name: 'hand holding heart donasi sedekah kasih peduli' },
    { cls: 'fas fa-heart', name: 'heart cinta suka donasi kepedulian relawan' },
    { cls: 'fas fa-hand-holding-dollar', name: 'hand holding dollar infaq wakaf zakat uang bantuan' },
    { cls: 'fas fa-hands-holding-child', name: 'hands holding child yatim anak dhuafa panti binaan' },
    { cls: 'fas fa-hands-praying', name: 'hands praying doa ibadah zakat taat' },
    { cls: 'fas fa-mosque', name: 'mosque masjid islam syariah wakaf dakwah' },
    { cls: 'fas fa-box-heart', name: 'box heart bantuan paket sembako santunan' },
    { cls: 'fas fa-ribbon', name: 'ribbon pita peduli bencana kanker kesehatan' },
    { cls: 'fas fa-gift', name: 'gift kado hadiah santunan berkah bingkisan' },

    // Campaigns & Marketing
    { cls: 'fas fa-bullhorn', name: 'bullhorn pengumuman kampanye campaign broadcast publikasi' },
    { cls: 'fas fa-flag', name: 'flag bendera target campaign program' },
    { cls: 'fas fa-bullseye', name: 'bullseye target sasaran campaign goal capaian' },
    { cls: 'fas fa-newspaper', name: 'newspaper berita artikel kabar program info' },
    { cls: 'fas fa-share-nodes', name: 'share sosial media sosialisasi bagikan link' },
    { cls: 'fas fa-envelope-open-text', name: 'envelope surat kampanye email blast warta' },

    // Finance & Payment
    { cls: 'fas fa-wallet', name: 'wallet dompet saldo pencairan rekening kas' },
    { cls: 'fas fa-money-bill-wave', name: 'money bill wave uang tunai transfer penerimaan' },
    { cls: 'fas fa-receipt', name: 'receipt struk kwitansi mutasi transaksi riwayat' },
    { cls: 'fas fa-credit-card', name: 'credit card kartu debet pembayaran midtrans gateway' },
    { cls: 'fas fa-file-invoice-dollar', name: 'invoice tagihan faktur donasi laporan' },
    { cls: 'fas fa-scale-balanced', name: 'scale neraca keuangan kas akuntansi seimbang' },
    { cls: 'fas fa-coins', name: 'coins koin perolehan dana zakat receh kas' },
    { cls: 'fas fa-money-check-dollar', name: 'money check cek transfer donasi rekening bank' },

    // Workflow & Approval
    { cls: 'fas fa-list-check', name: 'list check approval tugas checklist verifikasi persetujuan' },
    { cls: 'fas fa-clipboard-check', name: 'clipboard check validasi inspeksi survei lapangan' },
    { cls: 'fas fa-stamp', name: 'stamp cap persetujuan legalisasi approval stempel' },
    { cls: 'fas fa-diagram-project', name: 'diagram project alur proses tahapan workflow' },
    { cls: 'fas fa-arrows-split-up-and-left', name: 'arrows workflow cabang rute alur' },
    { cls: 'fas fa-signature', name: 'signature tanda tangan pengesahan berkas persetujuan' },

    // Reports & Data
    { cls: 'fas fa-file-lines', name: 'file lines dokumen laporan teks arsip' },
    { cls: 'fas fa-file-pdf', name: 'file pdf berkas laporan download cetak' },
    { cls: 'fas fa-file-excel', name: 'file excel export spreadsheet xls data' },
    { cls: 'fas fa-box-archive', name: 'archive arsip riwayat berkas lama gudang' },
    { cls: 'fas fa-clock-rotate-left', name: 'clock history riwayat audit log aktivitas jejak' },
    { cls: 'fas fa-database', name: 'database basis data backup server simpan' },

    // Communication & Notifications
    { cls: 'fas fa-bell', name: 'bell lonceng notifikasi pemberitahuan alert pesan' },
    { cls: 'fas fa-envelope', name: 'envelope pesan surat email kontak masuk' },
    { cls: 'fas fa-comments', name: 'comments percakapan obrolan chat forum diskusi' },
    { cls: 'fas fa-headset', name: 'headset bantuan cs support tiket keluhan pelayanan' },
    { cls: 'fas fa-circle-question', name: 'question tanya faq panduan bantuan petunjuk' },

    // Settings & Tools
    { cls: 'fas fa-gear', name: 'gear roda pengaturan konfigurasi settings sistem opsi' },
    { cls: 'fas fa-gears', name: 'gears pengaturan sistem tools utility alat' },
    { cls: 'fas fa-sliders', name: 'sliders filter konfigurasi parameter opsi setelan' },
    { cls: 'fas fa-wrench', name: 'wrench peralatan utilitas maintenance perbaikan alat' },
    { cls: 'fas fa-palette', name: 'palette tema tampilan kustomisasi branding warna' },
    { cls: 'fas fa-globe', name: 'globe domain bahasa publik website online portal' },
    { cls: 'fas fa-server', name: 'server vps cloud infrastruktur sistem hosting' },
    { cls: 'fas fa-shield', name: 'shield perlindungan keamanan ssl sertifikat' },
    { cls: 'fas fa-network-wired', name: 'network jaringan api integrasi webhook url' },
    { cls: 'fas fa-plug', name: 'plug plugin ekstensi integrasi webhook api' },
    { cls: 'fas fa-code', name: 'code kode developer api json rest endpoint' },
    { cls: 'fas fa-circle-dot', name: 'circle dot titik umum default item penanda' },
    { cls: 'fas fa-star', name: 'star bintang unggulan favorit utama tanda' },
    { cls: 'fas fa-tags', name: 'tags label kategori taksonomi penanda kelompok' },
    { cls: 'fas fa-cloud-arrow-up', name: 'cloud upload unggah file berkas cadangan simpan' }
];
