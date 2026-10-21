<?php
/**
 * ธีม TEAMDEE · เปลือก PHP ของหน้าที่ export มาจากต้นแบบ Vite (ตกลงแบบ ก. กับอาร์ต 20 ต.ค. 2026)
 *
 * ต้นฉบับหน้าตาอยู่ที่ site/ + src/ ในรีโป · build/ ในธีมนี้เป็นผลลัพธ์ของ `npm run export:wp` ห้ามแก้มือ
 * - หน้าที่มีใน build/pages.json → แสดง HTML ที่ export มาทั้งก้อน (templates/exported.php)
 * - บทความ / หน้าอื่นของ WordPress → index.php ใช้แถบเมนูกับ footer ชุดเดียวกัน
 * - title / description / robots → ถ้ามีปลั๊กอิน SEO ให้ปลั๊กอินจัดการ ไม่มีค่อยใช้ค่าจากต้นแบบ
 */

defined('ABSPATH') || exit;

const TD_BUILD = __DIR__ . '/build';

add_action('after_setup_theme', function () {
	add_theme_support('title-tag');
	add_theme_support('post-thumbnails');
	add_theme_support('html5', ['search-form', 'comment-form', 'gallery', 'caption', 'script', 'style']);
});

/* ---------- ข้อมูลหน้าที่ export มา ---------- */

function td_manifest(): array {
	static $m = null;
	if ($m === null) {
		$f = TD_BUILD . '/pages.json';
		$m = is_readable($f) ? (json_decode((string) file_get_contents($f), true) ?: []) : [];
	}
	return $m;
}

/** URL ที่เปิดอยู่ ในรูปเดียวกับ key ของ pages.json เช่น "/" หรือ "/sublimation/" */
function td_request_route(): string {
	$path = wp_parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
	$home = wp_parse_url(home_url('/'), PHP_URL_PATH) ?: '/';
	if ($home !== '/' && str_starts_with($path, $home)) {
		$path = '/' . substr($path, strlen($home));
	}
	$path = trim(rawurldecode($path), '/');
	return $path === '' ? '/' : "/$path/";
}

function td_page(?string $route = null): ?array {
	$pages = td_manifest()['pages'] ?? [];
	$route = $route ?? td_request_route();
	return isset($pages[$route]) ? ['route' => $route] + $pages[$route] : null;
}

/** หน้าที่กำลังแสดงด้วย HTML จากต้นแบบ (ตั้งค่าตอน template_include) */
function td_current(): ?array {
	return $GLOBALS['td_current'] ?? null;
}

function td_has_seo_plugin(): bool {
	return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION') || defined('SEOPRESS_VERSION');
}

function td_read_part(string $slug, string $part): string {
	$f = TD_BUILD . "/pages/$slug.$part.html";
	return is_readable($f) ? (string) file_get_contents($f) : '';
}

/**
 * แถบเมนู / footer ของต้นแบบ สำหรับหน้าที่ไม่ได้ export มา (บทความ)
 * ตัดจาก body ของหน้า /blog/ · header = ก่อน <main · footer = หลัง </main>
 */
function td_chrome(string $which, string $from = '/blog/'): string {
	$p = td_page($from) ?? td_page('/');
	if (!$p) return '';
	$body = td_read_part($p['slug'], 'body');
	$a = strpos($body, '<main');
	$b = strrpos($body, '</main>');
	if ($a === false || $b === false) return '';
	return $which === 'header' ? substr($body, 0, $a) : substr($body, $b + 7);
}

/* ---------- เลือก template ---------- */

add_filter('template_include', function ($template) {
	$p = td_page();
	/* หน้าแรก หน้า (Page) ที่ slug ตรงกับต้นแบบ หรือ URL ที่ WordPress ยังไม่มีหน้า (404) แต่ต้นแบบมี
	   ไม่ทับหน้ารวมบทความของ WordPress (is_home ที่ไม่ใช่หน้าแรก) เพราะต้องเป็นโพสต์จริง */
	if ($p && $p['route'] !== '404' && (is_front_page() || is_page() || is_404())) {
		if (is_404()) {
			global $wp_query;
			$wp_query->is_404 = false;
			status_header(200);
		}
		$GLOBALS['td_current'] = $p;
		return get_theme_file_path('templates/exported.php');
	}
	if (is_404() && ($p404 = td_page('404'))) {
		$GLOBALS['td_current'] = $p404;
		return get_theme_file_path('templates/exported.php');
	}
	return $template;
}, 99);

/* ---------- head ---------- */

add_filter('pre_get_document_title', function ($title) {
	$p = td_current();
	return ($p && !td_has_seo_plugin() && !empty($p['title'])) ? $p['title'] : $title;
});

add_filter('wp_robots', function (array $robots) {
	$p = td_current();
	if ($p && !td_has_seo_plugin() && !empty($p['robots']) && str_contains($p['robots'], 'noindex')) {
		$robots['noindex'] = true;
	}
	return $robots;
});

add_action('wp_head', function () {
	$p = td_current();
	if ($p) {
		if (!td_has_seo_plugin() && !empty($p['description'])) {
			printf("<meta name=\"description\" content=\"%s\">\n", esc_attr($p['description']));
		}
		$head = td_read_part($p['slug'], 'head');
		/* มีปลั๊กอิน SEO = ปลั๊กอินใส่แท็กแชร์ (og: twitter:) เอง ตัดของต้นแบบออกไม่ให้ซ้ำ */
		if (td_has_seo_plugin()) $head = preg_replace('/^\s*<meta (?:property="og:|name="twitter:)[^>]*>\s*$/m', '', $head);
		echo $head; // phpcs:ignore -- HTML จาก build ของเราเอง
	} else {
		/* บทความ: ใช้ CSS / JS / ฟอนต์ชุดเดียวกับหน้า /blog/ */
		$blog = td_page('/blog/') ?? td_page('/');
		if ($blog) echo td_read_part($blog['slug'], 'head'); // phpcs:ignore
	}
	/* แถบผู้ดูแลของ WordPress สูง 32px ดันแถบเมนูที่ติดบนสุดลงมาไม่ให้ทับกัน */
	echo "<style>.admin-bar [data-header]{top:32px}@media(max-width:782px){.admin-bar [data-header]{top:46px}}</style>\n";
}, 5);

/* หน้าที่มาจากต้นแบบไม่ใช้ block editor ไม่ต้องโหลด CSS ของ block · ลดของที่ไม่ได้ใช้ */
add_action('wp_enqueue_scripts', function () {
	if (!td_current()) return;
	foreach (['wp-block-library', 'wp-block-library-theme', 'global-styles', 'classic-theme-styles'] as $h) {
		wp_dequeue_style($h);
	}
}, 100);
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');

/* ---------- Google Tag Manager · ใส่ ID ที่ ลักษณะ > ปรับแต่ง > TEAMDEE ---------- */

add_action('customize_register', function (WP_Customize_Manager $c) {
	$c->add_section('teamdee', ['title' => 'TEAMDEE', 'priority' => 30]);
	$c->add_setting('teamdee_gtm_id', [
		'type' => 'option',
		'default' => '',
		'sanitize_callback' => fn ($v) => preg_match('/^GTM-[A-Z0-9]{4,12}$/', strtoupper(trim((string) $v))) ? strtoupper(trim((string) $v)) : '',
	]);
	$c->add_control('teamdee_gtm_id', [
		'section' => 'teamdee',
		'label' => 'Google Tag Manager ID',
		'description' => 'เช่น GTM-ABC1234 · เว้นว่าง = ไม่โหลด GTM · สัญญาณที่ธีมส่ง: td_line_click, td_phone_click, td_form_submit, td_calc_result',
	]);
});

function td_gtm_id(): string {
	return (string) get_option('teamdee_gtm_id', '');
}

add_action('wp_head', function () {
	$id = td_gtm_id();
	if (!$id) return;
	printf(
		"<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','%s');</script>\n",
		esc_js($id)
	);
}, 1);

add_action('wp_body_open', function () {
	$id = td_gtm_id();
	if (!$id) return;
	printf('<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=%s" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>', esc_attr($id));
});

/* ---------- สร้างหน้า (Page) ให้ครบตามต้นแบบ · เครื่องมือ > หน้าจากต้นแบบ ----------
   ให้ทุก URL มีหน้าใน WordPress ปลั๊กอิน SEO จะได้แก้ title / description ได้
   สร้างเฉพาะหน้าที่ยังไม่มี ไม่แก้ไม่ลบหน้าเดิม */

function td_missing_pages(): array {
	$missing = [];
	foreach (td_manifest()['pages'] ?? [] as $route => $p) {
		$route = (string) $route; // json_decode แปลง key "404" เป็นเลข ต้องคืนเป็นข้อความก่อนเทียบ
		if ($route === '/' || $route === '404' || str_contains(trim($route, '/'), '/')) continue;
		if (!get_page_by_path(trim($route, '/'), OBJECT, 'page')) $missing[$route] = $p;
	}
	return $missing;
}

function td_sync_pages(): int {
	$n = 0;
	foreach (td_missing_pages() as $route => $p) {
		$title = $p['h1'] ?: preg_replace('/\s*[|·].*$/u', '', (string) $p['title']);
		$id = wp_insert_post([
			'post_type' => 'page',
			'post_status' => 'publish',
			'post_name' => trim($route, '/'),
			'post_title' => $title ?: trim($route, '/'),
			'post_content' => '<!-- เนื้อหาหน้านี้มาจากธีม TEAMDEE (build/pages) แก้ที่ต้นแบบแล้ว export ใหม่ · ช่องนี้ไม่ได้แสดงบนเว็บ -->',
		]);
		if ($id && !is_wp_error($id)) $n++;
	}
	return $n;
}

add_action('admin_menu', function () {
	add_management_page('หน้าจากต้นแบบ', 'หน้าจากต้นแบบ', 'manage_options', 'teamdee-pages', function () {
		$pages = td_manifest()['pages'] ?? [];
		$missing = td_missing_pages();
		echo '<div class="wrap"><h1>หน้าจากต้นแบบ TEAMDEE</h1>';
		if (isset($_GET['created'])) printf('<div class="notice notice-success"><p>สร้างแล้ว %d หน้า</p></div>', (int) $_GET['created']);
		printf('<p>ต้นแบบมี %d หน้า · export เมื่อ %s · ยังไม่มีหน้าใน WordPress %d หน้า</p>', count($pages), esc_html(td_manifest()['generated'] ?? '-'), count($missing));
		if ($missing) {
			echo '<ul style="columns:3">';
			foreach ($missing as $route => $p) printf('<li><code>%s</code></li>', esc_html($route));
			echo '</ul><form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
			wp_nonce_field('teamdee_sync_pages');
			echo '<input type="hidden" name="action" value="teamdee_sync_pages">';
			submit_button('สร้างหน้าที่ยังไม่มี');
			echo '</form>';
		}
		echo '</div>';
	});
});

add_action('admin_post_teamdee_sync_pages', function () {
	if (!current_user_can('manage_options')) wp_die('ไม่มีสิทธิ์');
	check_admin_referer('teamdee_sync_pages');
	$n = td_sync_pages();
	wp_safe_redirect(admin_url('tools.php?page=teamdee-pages&created=' . $n));
	exit;
});
