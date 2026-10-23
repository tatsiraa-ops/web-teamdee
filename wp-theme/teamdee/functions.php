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

/* เนื้อหาทั้งเว็บเป็นภาษาไทย · ไม่พึ่งค่าภาษาของ WordPress (ในเครื่องเป็น en-US → โปรแกรมอ่านหน้าจออ่านไทยด้วยเสียงอังกฤษ และ Google เดาภาษาผิด) */
add_filter('language_attributes', function ($output) {
    /* หน้าแอดมินและหน้าล็อกอินใช้ภาษาที่ตั้งใน WordPress ตามเดิม */
    if (is_admin() || (isset($GLOBALS['pagenow']) && $GLOBALS['pagenow'] === 'wp-login.php')) return $output;
    return 'lang="th"';
});

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

/* URL ที่ต้นแบบมีหน้า ห้าม WordPress เดา slug แล้ว 301 ไปหน้าชื่อคล้าย (เช่น /project/ → /projects/)
   การเดานี้ทำงานก่อน template_include · เจอ 22 ต.ค. 2026 ตอนย้าย URL ตาม Wireframe v22 */
add_filter('redirect_canonical', function ($redirect) {
	return td_page() ? false : $redirect;
});
add_filter('do_redirect_guess_404_permalink', function ($guess) {
	return td_page() ? false : $guess;
});

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

/* หน้าระบบเดิมบนเว็บจริง (URL-MIGRATION-MAP v22: KEEP_NOINDEX) · ให้ทำงานต่อแต่ไม่ให้ Google เก็บ และเอาออกจาก Sitemap
   บังคับจากธีม ใช้ได้ทั้งตอนมี Rank Math (เว็บจริง) และไม่มี (Sitemap ของ WordPress) */
const TD_NOINDEX_SLUGS = ['thank-you', 'test-page'];

/** หน้าที่ export มาแล้วตั้ง noindex ไว้ (บทความร่าง ค้นหา 404 แกลเลอรีที่ยังไม่มีแบบ) · v22: XML Sitemap ไม่ใส่หน้าร่าง ค้นหา 404 */
function td_route_noindex(string $route): bool {
	$p = td_page($route);
	return $p && str_contains($p['robots'] ?? '', 'noindex');
}

/** route ของโพสต์/หน้า WordPress จากลิงก์ถาวร เพื่อเทียบกับ pages.json */
function td_route_of_post(WP_Post $post): string {
	$path = trim((string) wp_parse_url(get_permalink($post), PHP_URL_PATH), '/');
	return $path === '' ? '/' : "/$path/";
}

/* บังคับจากธีมทั้งตอนมีและไม่มีปลั๊กอิน SEO · เดิมใช้ค่า robots ของต้นแบบเฉพาะตอนไม่มีปลั๊กอิน
   แต่เว็บจริงใช้ Rank Math → หน้าร่างจะถูกเก็บเข้า Google และ Sitemap (เจอตอนไล่ผังเว็บ v22 · 22 ต.ค. 2026) */
function td_is_noindex_page(): bool {
	return is_page(TD_NOINDEX_SLUGS) || td_route_noindex(td_request_route());
}
add_filter('wp_robots', function (array $robots) {
	if (td_is_noindex_page()) $robots['noindex'] = true;
	return $robots;
}, 20);
add_filter('rank_math/frontend/robots', function ($robots) {
	if (td_is_noindex_page()) { $robots['index'] = 'noindex'; }
	return $robots;
});
add_filter('rank_math/sitemap/entry', function ($url, $type, $object) {
	if ($type !== 'post' || !($object instanceof WP_Post)) return $url;
	return (in_array($object->post_name, TD_NOINDEX_SLUGS, true) || td_route_noindex(td_route_of_post($object))) ? false : $url;
}, 10, 3);
add_filter('wp_sitemaps_posts_query_args', function (array $args, string $type) {
	if ($type !== 'page') return $args;
	$noindex = array_map(fn ($r) => trim($r, '/'), array_keys(array_filter(td_manifest()['pages'] ?? [], fn ($p) => str_contains($p['robots'] ?? '', 'noindex'))));
	$ids = array_filter(array_map(fn ($slug) => get_page_by_path($slug)?->ID, [...TD_NOINDEX_SLUGS, ...array_filter($noindex, fn ($s) => $s !== '' && $s !== '404')]));
	if ($ids) $args['post__not_in'] = array_merge($args['post__not_in'] ?? [], $ids);
	return $args;
}, 10, 2);

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
	/* จอ ≤600px แถบแอดมิน WP เลื่อนหายไปกับหน้า (position:absolute) header ต้องกลับไปติดขอบบน ไม่งั้นเหลือช่อง 46px เห็นเนื้อหาโผล่ */
	echo "<style>.admin-bar [data-header]{top:32px}@media(max-width:782px){.admin-bar [data-header]{top:46px}}@media(max-width:600px){.admin-bar [data-header]{top:0}}</style>\n";
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

/* ---------- ฟอร์มติดต่อ /contact-us/ · ส่งเข้าอีเมลทีมขาย (แผน v22 ระยะ 3 · อาร์ตเคาะ 22 ต.ค. 2026) ----------
   ตั้งอีเมลรับฟอร์มที่ ลักษณะ > ปรับแต่ง > TEAMDEE · เว้นว่าง = ปิด หน้าเว็บใช้ทางสำรอง (คัดลอกข้อความ + LINE)
   กันสแปม: ช่องกันบอท (website) + จำกัด 5 ครั้ง / 10 นาที ต่อเครื่อง · ไม่รับไฟล์แนบ รับแค่ชื่อไฟล์
   ไม่เก็บข้อมูลลูกค้าลงฐานข้อมูล ส่งอีเมลอย่างเดียว */

add_action('customize_register', function (WP_Customize_Manager $c) {
	$c->add_setting('teamdee_form_email', ['type' => 'option', 'default' => '', 'sanitize_callback' => 'sanitize_email']);
	$c->add_control('teamdee_form_email', [
		'section' => 'teamdee',
		'label' => 'อีเมลรับฟอร์มติดต่อ',
		'description' => 'อีเมลทีมขายที่รับข้อมูลจากหน้า /contact-us/ · เว้นว่าง = ปิดการส่ง (ลูกค้าคัดลอกข้อความแล้วส่งทาง LINE แทน)',
	]);
	$c->add_setting('teamdee_form_thanks', ['type' => 'option', 'default' => '/thank-you/', 'sanitize_callback' => fn ($v) => preg_match('#^/[a-z0-9/_-]*$#i', (string) $v) ? (string) $v : '/thank-you/']);
	$c->add_control('teamdee_form_thanks', [
		'section' => 'teamdee',
		'label' => 'หน้าหลังส่งฟอร์มสำเร็จ',
		'description' => 'ค่าเริ่มต้น /thank-you/ (หน้าเดิมบนเว็บจริง ใช้วัดผลแอด) · เว้นว่าง = แสดงข้อความในหน้าติดต่อ',
	]);
});

function td_form_email(): string {
	return (string) get_option('teamdee_form_email', '');
}

/* ค่าที่ JS ใช้ (src/js/contact-send.js) · พิมพ์เฉพาะหน้าติดต่อ */
add_action('wp_head', function () {
	$p = td_current();
	if (!$p || ($p['route'] ?? '') !== '/contact-us/') return;
	$cfg = [
		'enabled' => td_form_email() !== '',
		'endpoint' => admin_url('admin-post.php'),
		'thanks' => (string) get_option('teamdee_form_thanks', '/thank-you/'),
	];
	printf("<script>window.TD_FORM=%s;</script>\n", wp_json_encode($cfg));
}, 6);

function td_contact_handle(): void {
	$out = fn (array $body, int $code) => wp_send_json($body, $code);
	$to = td_form_email();
	if ($to === '') $out(['ok' => false, 'reason' => 'off'], 503);
	if (!empty($_POST['website'])) $out(['ok' => true], 200); // บอท · ตอบเหมือนสำเร็จแต่ไม่ส่ง

	$ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	$key = 'td_contact_' . md5($ip);
	$hits = (int) get_transient($key);
	if ($hits >= 5) $out(['ok' => false, 'reason' => 'limit'], 429);
	set_transient($key, $hits + 1, 10 * MINUTE_IN_SECONDS);

	$f = static fn (string $k, bool $long = false) => mb_substr($long ? sanitize_textarea_field(wp_unslash($_POST[$k] ?? '')) : sanitize_text_field(wp_unslash($_POST[$k] ?? '')), 0, $long ? 3000 : 200);
	$name = $f('name');
	$tel = preg_replace('/[^0-9+\- ]/', '', $f('tel'));
	if ($name === '' || strlen(preg_replace('/\D/', '', $tel)) < 9) $out(['ok' => false, 'reason' => 'invalid'], 400);
	$email = sanitize_email(wp_unslash($_POST['email'] ?? ''));

	$rows = [
		'ชื่อ' => $name, 'เบอร์โทร' => $tel, 'องค์กร' => $f('org'), 'อีเมล' => $email,
		'จำนวน' => $f('qty'), 'วันที่ต้องการใช้' => $f('date'), 'ใช้กับงาน' => $f('use'), 'สินค้าที่สนใจ' => $f('product'),
		'เอกสารที่ต้องการ' => $f('docs'),
		'มาจากหน้า' => $f('from'), 'ไฟล์ที่จะส่งตามทาง LINE' => $f('files'),
	];
	$body = '';
	foreach ($rows as $label => $v) if ($v !== '') $body .= "{$label}: {$v}\n";
	$note = $f('note', true);
	if ($note !== '') $body .= "\nรายละเอียด:\n{$note}\n";
	$body .= "\n— ส่งจากฟอร์มหน้า /contact-us/ ของ " . home_url('/');

	$headers = ['Content-Type: text/plain; charset=UTF-8'];
	if (is_email($email)) $headers[] = 'Reply-To: ' . $name . ' <' . $email . '>';
	$ok = wp_mail($to, 'ขอราคา/ติดต่อจากเว็บ: ' . $name, $body, $headers);
	$ok ? $out(['ok' => true], 200) : $out(['ok' => false, 'reason' => 'mail'], 500);
}
add_action('admin_post_nopriv_td_contact', 'td_contact_handle');
add_action('admin_post_td_contact', 'td_contact_handle');

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
			/* เว็บจริงใช้ Rank Math (ปลั๊กอินคุม title / description / robots แทนธีม) → ตั้งค่าตามต้นแบบ v22 ให้ตั้งแต่สร้างหน้า
			   หน้าเดิมที่มีอยู่แล้วไม่แตะ (เก็บ SEO เดิม) */
			'meta_input' => [
				'rank_math_title' => (string) ($p['title'] ?? ''),
				'rank_math_description' => (string) ($p['description'] ?? ''),
				'rank_math_robots' => str_contains($p['robots'] ?? '', 'noindex') ? ['noindex'] : ['index'],
			],
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
