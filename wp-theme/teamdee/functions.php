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

/** คำขอที่ระบุเลขของ WordPress (?p= ?page_id= ?attachment_id=) · 17 พ.ย. 2026 ตรวจ staging: /?p=999999 เคยตอบ 200 เป็นหน้าแรก (tests/wp-query-by-id.test.js) */
function td_asks_wp_object(array $get): bool {
	foreach (['p', 'page_id', 'attachment_id'] as $k) if (isset($get[$k]) && is_string($get[$k]) && $get[$k] !== '') return true;
	return false;
}
function td_page(?string $route = null): ?array {
	/* ขอของ WordPress ด้วยเลข = ไม่ใช่หน้าของต้นแบบ → WordPress จัดการเอง (มี = redirect ไป URL จริง · ไม่มี = 404) */
	if ($route === null && td_asks_wp_object($_GET)) return null;
	$pages = td_manifest()['pages'] ?? [];
	$route = $route ?? td_request_route();
	return isset($pages[$route]) ? ['route' => $route] + $pages[$route] : null;
}

/** หน้าที่กำลังแสดงด้วย HTML จากต้นแบบ (ตั้งค่าตอน template_include) */
/** เนื้อหาหน้ามี <h1> ของตัวเองแล้ว (หน้า Elementor เดิม) → แม่แบบไม่ใส่ H1 ชื่อหน้าซ้ำ · 17 พ.ย. 2026 อาร์ต "/collar-styles/ คงไว้" (tests/legacy-keep-1117.test.js) */
function td_content_has_h1(string $html): bool {
	return (bool) preg_match('~<h1[\s>]~i', $html);
}
function td_current(): ?array {
	return $GLOBALS['td_current'] ?? null;
}

function td_has_seo_plugin(): bool {
	return defined('WPSEO_VERSION') || defined('RANK_MATH_VERSION') || defined('AIOSEO_VERSION') || defined('SEOPRESS_VERSION');
}

/* HTML ที่ export ฝัง path ไฟล์ไว้เป็น /wp-content/themes/teamdee/build/ (WordPress ที่ราก · ชื่อโฟลเดอร์ teamdee)
   16 พ.ย. 2026: staging ของทีมโฮสต์อยู่ที่ /enterprise/ → CSS JS รูป ไปโหลดจากเว็บจริงไม่เจอ
   เปลี่ยนให้ชี้โฟลเดอร์ธีมที่ติดตั้งจริงตอนส่งหน้า · ติดตั้งที่ราก + ชื่อ teamdee = ไม่แตะอะไรเลย (tests/wp-theme-portable.test.js) */
function td_portable_paths(string $html): string {
	$from = '/wp-content/themes/teamdee/build/';
	$to = rtrim((string) wp_parse_url(get_template_directory_uri(), PHP_URL_PATH), '/') . '/build/';
	if ($to !== $from) $html = str_replace($from, $to, $html);
	/* 16 พ.ย. 2026 รูปอยู่นอกธีม (wp-content/uploads/teamdee/img) → ชี้ uploads ที่ติดตั้งจริง (WordPress ในโฟลเดอร์ย่อยก็ถูก) */
	$imgFrom = '/wp-content/uploads/teamdee/';
	$imgTo = rtrim((string) wp_parse_url((string) (wp_upload_dir()['baseurl'] ?? ''), PHP_URL_PATH), '/') . '/teamdee/';
	return ($imgTo === $imgFrom || $imgTo === '/teamdee/') ? $html : str_replace($imgFrom, $imgTo, $html);
}

/* 16 พ.ย. 2026 รูปอยู่นอกธีม: นับรูปในรายการ (build/img-manifest.json) ที่ไม่มีบนเซิร์ฟเวอร์ · ใช้เตือนในหลังบ้านเมื่อลืมวางชุดรูปเพิ่ม */
function td_missing_images(string $manifest, string $dir): array {
	$m = is_readable($manifest) ? json_decode((string) file_get_contents($manifest), true) : null;
	$files = is_array($m['files'] ?? null) ? $m['files'] : [];
	$miss = [];
	foreach ($files as $f) if (is_string($f) && !is_file($dir . '/' . $f)) $miss[] = $f;
	return ['total' => count($files), 'missing' => count($miss), 'sample' => array_slice($miss, 0, 5)];
}

add_action('admin_notices', function () {
	if (!current_user_can('manage_options')) return;
	/* แคชผลนับไว้ (ตรวจไฟล์หลายพันไฟล์ทุกหน้าหลังบ้านไม่คุ้ม) · ติดตั้งธีมใหม่ = รายการรูปเปลี่ยน (filemtime) → ตรวจใหม่ทันที */
	$man = TD_BUILD . '/img-manifest.json';
	$v = is_file($man) ? (int) filemtime($man) : 0;
	$r = get_transient('td_img_check');
	if (!is_array($r) || ($r['v'] ?? -1) !== $v) {
		$r = td_missing_images($man, rtrim((string) (wp_upload_dir()['basedir'] ?? ''), '/') . '/teamdee/img') + ['v' => $v];
		set_transient('td_img_check', $r, $r['missing'] ? 5 * MINUTE_IN_SECONDS : HOUR_IN_SECONDS);
	}
	if (!$r['missing']) return;
	echo '<div class="notice notice-error"><p><strong>ธีม TEAMDEE: รูปบนเซิร์ฟเวอร์ไม่ครบ ' . (int) $r['missing'] . ' จาก ' . (int) $r['total'] . ' ไฟล์</strong> · วางชุดรูปจาก Release (teamdee-images-*.zip) ลงโฟลเดอร์ wp-content/uploads/ แล้วรอ 5 นาทีหรือรีเฟรชหน้านี้ · ตัวอย่างที่หาย: <code>' . esc_html(implode(', ', $r['sample'])) . '</code></p></div>';
});

/* 16 พ.ย. 2026 อาร์ต "ลิงก์ยังไปหน้าเดิมในเว็บเก่า" (staging อยู่ team-dee.com/enterprise/): ลิงก์ต้นแบบเป็น /sublimation/ เริ่มจากรากโดเมน
   → WordPress ในโฟลเดอร์ย่อย: เติม path โฟลเดอร์หน้าลิงก์ภายใน (href action และ URL หน้าในดัชนีค้นหา "u":) · ติดตั้งที่ราก = ไม่แตะ
   ไม่แตะลิงก์ไฟล์ของ WordPress (/wp-content/ /wp-admin/ …) ลิงก์นอก และ #anchor · JS ที่สร้างลิงก์เองอ่าน <meta name="td-base"> (src/js/base-path.js) · tests/base-path.test.js */
function td_base_path(): string {
	return rtrim((string) wp_parse_url(home_url('/'), PHP_URL_PATH), '/');
}
function td_portable_links(string $html): string {
	$base = td_base_path();
	if ($base === '') return $html;
	$skip = '(?!/|wp-(?:content|admin|includes|json|login)\b)';
	/* ใส่ path ด้วย callback (ไม่ใช่สตริงแทนที่) · path ที่มี $ หรือ \ จะไม่ถูกอ่านเป็นตัวอ้างอิงกลุ่ม */
	$add = static fn (array $m): string => $m[1] . $base . '/';
	/* regex ล้ม (null · backtrack limit บนโฮสต์ร่วม) = ใช้ HTML เดิม ไม่ใช่หน้าว่าง (17 พ.ย. 2026) */
	$html = preg_replace_callback('~(\s(?:href|action)=")/' . $skip . '~', $add, $html) ?? $html;
	return preg_replace_callback('~("u":")/' . $skip . '~', $add, $html) ?? $html;
}

function td_read_part(string $slug, string $part, bool $live = true): string {
	$f = TD_BUILD . "/pages/$slug.$part.html";
	$html = td_portable_paths(td_portable_links(is_readable($f) ? (string) file_get_contents($f) : ''));
	if ($part !== 'body') return $html;
	/* หน้าแรกและ /blog/: บทความจริงจาก WordPress (บล็อก "บทความจริงจาก WordPress" ด้านล่าง) */
	if ($live && ($slug === 'home' || $slug === 'blog')) $html = td_posts_live($slug, $html, td_posts_from_wp(), td_post_cat_counts());
	return td_body_live($html);
}

/* ส่วนของ body ที่รู้ได้ตอนเปิดหน้าเท่านั้น (30 ต.ค.)
   - action ของฟอร์มติดต่อ: ต้นแบบเขียน /wp-admin/admin-post.php → ใช้ admin_url() จริง (ติดตั้งใน sub-folder ก็ถูก)
   - ผลส่งฟอร์มแบบไม่มี JS: ?sent=0&why= → กล่องแจ้งเหนือฟอร์ม · ?sent=<token> → หน้าขอบคุณขึ้นว่าได้รับแล้ว (token จริงจาก transient เท่านั้น) */
function td_body_live(string $html): string {
	if (str_contains($html, 'action="/wp-admin/admin-post.php"')) {
		$html = str_replace('action="/wp-admin/admin-post.php"', 'action="' . esc_url(admin_url('admin-post.php')) . '"', $html);
	}
	$sent = isset($_GET['sent']) && is_string($_GET['sent']) ? preg_replace('/[^A-Za-z0-9]/', '', wp_unslash($_GET['sent'])) : '';
	if ($sent === '') return $html;
	if ($sent === '0' && str_contains($html, '<form id="contactForm"')) {
		$why = isset($_GET['why']) && is_string($_GET['why']) ? sanitize_key(wp_unslash($_GET['why'])) : '';
		return str_replace('<form id="contactForm"', td_nojs_fail($why) . '<form id="contactForm"', $html);
	}
	if ($sent !== '0' && str_contains($html, 'id="tyHeading"') && get_transient('td_sent_' . $sent)) {
		/* ข้อความชุดเดียวกับ src/js/thanks-page.js */
		$set = static fn (string $h, string $id, string $text) => preg_replace('~(<[a-z0-9]+\b[^>]*\bid="' . $id . '"[^>]*>)[^<]*~u', '${1}' . esc_html($text), $h, 1);
		$html = $set($html, 'tyHeading', 'ทีมดีได้รับข้อมูลของคุณแล้ว');
		$html = $set($html, 'tyCrumb', 'ส่งข้อมูลแล้ว');
		$html = $set($html, 'tyLead', 'ขอบคุณที่ติดต่อทีมดี ทีมติดต่อกลับในเวลาทำการ · ต้องการคุยต่อ ทัก LINE ได้เลย');
		$html = $set($html, 'wait-h', 'ระหว่างรอทีมติดต่อกลับ');
		$html = preg_replace('~<a id="tyContact"~', '<a hidden id="tyContact"', $html, 1);
	}
	return $html;
}

/** กล่อง "ยังส่งไม่ถึงทีมดี" สำหรับคนที่ส่งฟอร์มโดยไม่มี JS · ข้อความตามสาเหตุ (ชุดเดียวกับ failText ใน contact-send.js) */
function td_nojs_fail(string $why): string {
	$msg = [
		'off' => 'ฟอร์มนี้ยังส่งเข้าระบบไม่ได้ ข้อมูลยังไม่ถึงทีมดี ทัก LINE @teamdee หรือโทรหาทีมดีได้เลย',
		'limit' => 'ส่งถี่เกินไป ระบบพักรับชั่วคราว รอสักครู่แล้วกรอกส่งใหม่ หรือทัก LINE @teamdee / โทรได้เลย',
		'invalid' => 'เบอร์โทรหรือชื่อยังไม่ครบ กรอกอีกครั้งแล้วส่งใหม่ หรือทัก LINE @teamdee / โทรได้เลย',
	][$why] ?? 'ระบบรับข้อมูลขัดข้อง กรอกแล้วลองส่งอีกครั้ง หรือทัก LINE @teamdee / โทรได้เลย';
	return '<div class="cf-fail" role="alert" id="formNoJs"><h3 class="cf-fail__h">ยังส่งไม่ถึงทีมดี</h3><p class="t-body mt-2">' . esc_html($msg) . '</p></div>';
}

/**
 * แถบเมนู / footer ของต้นแบบ สำหรับหน้าที่ไม่ได้ export มา (บทความ)
 * ตัดจาก body ของหน้า /blog/ · header = ก่อน <main · footer = หลัง </main>
 */
function td_chrome(string $which, string $from = '/blog/'): string {
	/* 17 พ.ย. 2026: หน้าบทความเรียก 2 ครั้ง (header + footer) → อ่านไฟล์ครั้งเดียว · ไม่ดึงบทความ WordPress (ใช้แค่หัว/ท้ายเว็บ) */
	static $cache = [];
	$p = td_page($from) ?? td_page('/');
	if (!$p) return '';
	$body = $cache[$from] ??= td_read_part($p['slug'], 'body', false);
	$a = strpos($body, '<main');
	$b = strrpos($body, '</main>');
	if ($a === false || $b === false) return '';
	return $which === 'header' ? substr($body, 0, $a) : substr($body, $b + 7);
}

/* ---------- บทความจริงจาก WordPress บนหน้าแรกและ /blog/ ---------- */
/* 16 พ.ย. 2026 (อาร์ต "จะอัพเดทบทความใหม่ๆยังไง" → "ทำข้อ 1 เลย"): หน้าแรกและ /blog/ ฝังรายการบทความตอน build (legacy-posts.json)
   บทความที่ลงในหลังบ้านหลังเปิดเว็บจึงไม่ขึ้น → ใส่บทความจริงตอนเปิดหน้า ด้วย HTML ชุดเดียวกับต้นแบบ
   - หน้าแรก: การ์ด 4 เรื่องล่าสุด (ไม่มีโพสต์เลย = HTML เดิม)
   - /blog/: หน้านิตยสาร 12 เรื่องเดิมคงไว้ (จัดหัวข้อด้วยมือ) · เรื่องที่ยังไม่อยู่ในหน้า → ส่วน "ใหม่ล่าสุด" ใต้เรื่องปก
     + ชิปหัวข้อ + ผลค้นหา (#artGrid) + จำนวนเรื่อง/วันที่บนหัวหน้า · ตัวเลขหมวดตาม WordPress
   tests/wp-posts-live.test.js */

/** แปลงโพสต์ WordPress เป็นข้อมูลการ์ด (ใหม่สุดก่อน) · url = path ที่ใช้ลิงก์ · key = /slug/ ใช้เทียบกับลิงก์ในหน้าที่ export (ติดตั้งในโฟลเดอร์ย่อยก็เทียบถูก) */
function td_posts_from_wp(): array {
	$mon = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
	$out = [];
	$list = get_posts(['post_type' => 'post', 'post_status' => 'publish', 'numberposts' => 60, 'orderby' => 'date', 'order' => 'DESC', 'has_password' => false]);
	foreach ($list as $p) {
		$cat = (get_the_category($p->ID) ?: [null])[0];
		$tid = (int) get_post_thumbnail_id($p);
		$ts = (int) get_post_timestamp($p);
		$ex = has_excerpt($p) ? (string) $p->post_excerpt : (string) get_post_meta($p->ID, 'rank_math_description', true);
		if ($ex === '' || str_contains($ex, '%')) $ex = wp_trim_words(wp_strip_all_tags(strip_shortcodes((string) $p->post_content)), 40, '…');
		$out[] = [
			'url' => wp_make_link_relative((string) get_permalink($p)),
			'key' => td_base_path() . '/' . $p->post_name . '/', /* ลิงก์ในหน้าเติม path โฟลเดอร์ย่อยแล้ว (td_portable_links) → เทียบด้วย path เดียวกัน */
			'title' => wp_strip_all_tags(html_entity_decode(get_the_title($p), ENT_QUOTES, 'UTF-8')),
			'img' => $tid ? (string) wp_get_attachment_image_url($tid, 'large') : '',
			'srcset' => $tid ? (string) wp_get_attachment_image_srcset($tid, 'large') : '',
			'cat' => $cat ? (string) $cat->slug : '',
			'catName' => $cat ? html_entity_decode((string) $cat->name, ENT_QUOTES, 'UTF-8') : '',
			'date' => wp_date('Y-m-d', $ts),
			'dateTh' => wp_date('j', $ts) . ' ' . $mon[(int) wp_date('n', $ts) - 1] . ' ' . wp_date('Y', $ts),
			'excerpt' => trim(wp_strip_all_tags(html_entity_decode($ex, ENT_QUOTES, 'UTF-8'))),
		];
	}
	return $out;
}

/** จำนวนบทความที่เผยแพร่ของแต่ละหมวด [slug => n] */
function td_post_cat_counts(): array {
	$n = [];
	foreach (get_categories(['hide_empty' => false]) as $c) $n[$c->slug] = (int) $c->count;
	return $n;
}

/** รูปปกการ์ด · ไม่มีรูปปก = ไม่ใส่ <img> (กรอบใช้สีพื้นของการ์ด) */
function td_post_img(array $p, string $sizes): string {
	if (($p['img'] ?? '') === '') return '';
	return '<img src="' . esc_url($p['img']) . '" srcset="' . esc_attr($p['srcset'] ?? '') . '" sizes="' . $sizes . '" alt="" width="1024" height="512" loading="lazy" decoding="async">';
}

/** การ์ดแบบผลค้นหาของ /blog/ (.mz-card) · data-* ให้ articles-page.js ค้นได้ */
function td_post_mz_card(array $p): string {
	return '<a class="mz-card" href="' . esc_url($p['url']) . '" data-cat="' . esc_attr($p['cat']) . '" data-topics="" data-title="' . esc_attr($p['title']) . '" data-excerpt="' . esc_attr($p['excerpt']) . '" data-cat-name="' . esc_attr($p['catName']) . '">'
		. '<span class="mz-row__img">' . td_post_img($p, '(min-width: 1024px) 400px, (min-width: 640px) 50vw, calc(100vw - 40px)') . '</span>'
		. '<span class="mz-kicker">' . esc_html($p['catName']) . '</span><span class="mz-row__t">' . esc_html($p['title']) . '</span>'
		. '<time datetime="' . esc_attr($p['date']) . '">' . esc_html($p['dateTh']) . '</time></a>';
}

function td_posts_live(string $slug, string $html, array $posts, array $counts = []): string {
	/* 17 พ.ย. 2026 audit: "Hello world!" (Uncategorized) ขึ้นหน้าแรกและ /blog/ → ไม่เอาเรื่องที่ยังไม่ได้ใส่หมวด */
	$posts = array_values(array_filter($posts, fn ($p) => ($p['cat'] ?? '') !== 'uncategorized'));
	if ($slug === 'home') {
		/* หน้าแรกเอาเฉพาะเรื่องที่มีรูปปก (ไม่มีรูป = กล่องเทาว่าง) · ไม่ครบ 4 = เติมการ์ดเดิมจากตอน build ที่ลิงก์ไม่ซ้ำ */
		$posts = array_slice(array_values(array_filter($posts, fn ($p) => ($p['img'] ?? '') !== '')), 0, 4);
		if (!$posts) return $html;
		if (!preg_match('~<ul class="hm-posts">(.*?)\s*</ul>~s', $html, $old)) return $html;
		preg_match_all('~\s*<li><a class="hm-post" href="([^"]+)".*?</li>~s', $old[1], $keep, PREG_SET_ORDER);
		$used = array_map(fn ($p) => $p['key'] ?? $p['url'], $posts);
		$fill = array_slice(array_filter($keep, fn ($m) => !in_array($m[1], $used, true) && !in_array($m[1], array_column($posts, 'url'), true)), 0, 4 - count($posts));
		$li = '';
		foreach ($posts as $p) {
			$li .= "\n      <li><a class=\"hm-post\" href=\"" . esc_url($p['url']) . "\">\n        <span class=\"hm-post__img\">" . td_post_img($p, '(min-width: 1280px) 300px, (min-width: 768px) 24vw, 80vw') . "</span>\n"
				. '        <span class="hm-post__body"><span class="hm-post__cat">' . esc_html($p['catName']) . '</span><span class="hm-post__t">' . esc_html($p['title']) . '</span><time datetime="' . esc_attr($p['date']) . '">' . esc_html($p['dateTh']) . "</time></span>\n      </a></li>";
		}
		foreach ($fill as $m) $li .= $m[0];
		return preg_replace_callback('~(<ul class="hm-posts">)(.*?)(\s*</ul>)~s', fn ($m) => $m[1] . $li . $m[3], $html, 1) ?? $html;
	}
	if ($slug !== 'blog') return $html;

	/* ตัวเลขหมวด (เฉพาะแถบ "อ่านตามหมวดเดิม") */
	if ($counts) {
		$html = preg_replace_callback('~<nav class="mz-archives".*?</nav>~s', fn ($nav) => preg_replace_callback(
			'~(<a href="[^"]*/category/([^/"]+)/">.*?<b class="tabular-nums">)(\d+)(</b>)~s',
			fn ($m) => $m[1] . (isset($counts[$m[2]]) ? $counts[$m[2]] : $m[3]) . $m[4],
			$nav[0]
		) ?? $nav[0], $html, 1) ?? $html;
	}

	$new = array_values(array_filter($posts, fn ($p) => !str_contains($html, 'href="' . ($p['key'] ?? $p['url']) . '"')));
	if (!$new) return $html;

	$cards = implode('', array_map('td_post_mz_card', $new));
	$n = count($new);
	/* จำนวนเรื่อง + วันที่ล่าสุดบนหัวหน้า */
	preg_match_all('~datetime="(\d{4}-\d{2}-\d{2})"~', $html, $d);
	$latest = $new[0];
	foreach ($new as $p) if ($p['date'] > $latest['date']) $latest = $p;
	$html = preg_replace_callback('~<p class="mz-head__meta">(\d+) เรื่อง · อัปเดตล่าสุด ([^<]*)</p>~u', function ($m) use ($n, $latest, $d) {
		$keep = $d[1] && max($d[1]) > $latest['date'];
		return '<p class="mz-head__meta">' . ((int) $m[1] + $n) . ' เรื่อง · อัปเดตล่าสุด ' . ($keep ? $m[2] : esc_html($latest['dateTh'])) . '</p>';
	}, $html, 1) ?? $html;
	/* ชิปหัวข้อ */
	$html = str_replace('<ul class="mz-topics" aria-label="ไปที่หัวข้อ">', '<ul class="mz-topics" aria-label="ไปที่หัวข้อ"><li style="--i:0"><a href="#t-latest">ใหม่ล่าสุด<b class="tabular-nums">' . $n . '</b></a></li>', $html);
	/* ส่วน "ใหม่ล่าสุด" ใต้เรื่องปก ก่อนหัวข้อเดิม (สูงสุด 6 เรื่อง · ที่เหลืออยู่ในผลค้นหาและหน้าหมวด) */
	$sec = '<section class="mz-sec mz-sec--latest" id="t-latest" aria-labelledby="t-latest-h">'
		. '<header class="mz-sec__hd"><h2 id="t-latest-h">ใหม่ล่าสุด</h2><span class="tabular-nums">' . $n . ' เรื่อง</span></header>'
		. '<div class="mz-grid">' . implode('', array_map('td_post_mz_card', array_slice($new, 0, 6))) . '</div></section>' . "\n    ";
	$html = str_replace('<div class="mz-sections">', $sec . '<div class="mz-sections">', $html);
	/* ผลค้นหา: เรื่องใหม่ขึ้นก่อน */
	return str_replace('id="artGrid">', 'id="artGrid">' . $cards, $html);
}

/* เผยแพร่ / แก้ / ถอนบทความ → ให้ LiteSpeed Cache ล้างหน้าแรกและ /blog/ (ไม่มีปลั๊กอิน = do_action ไม่มีผู้รับ ไม่เกิดอะไร) */
add_action('transition_post_status', function ($new, $old, $post) {
	if (($post->post_type ?? '') !== 'post' || ($new !== 'publish' && $old !== 'publish')) return;
	do_action('litespeed_purge_url', home_url('/'));
	do_action('litespeed_purge_url', home_url('/blog/'));
}, 10, 3);

/* ---------- หน้าที่ต้นแบบมี แต่ WordPress ไม่มี Page ---------- */
/* 16 พ.ย. 2026 ตรวจ staging (มี Rank Math): หน้าแบบนี้ (/faq/ /custom-class-shirts/ ฯลฯ) เดิมปล่อยให้ WordPress ตั้ง 404 ก่อน
   แล้วค่อยพลิกใน template_include → Rank Math ตัดสินเป็น 404 ไปแล้ว ได้ title "Page Not Found" + noindex ไม่มี description/canonical
   แก้: ไม่ให้ตั้ง 404 ตั้งแต่ต้น · บอก Rank Math ค่าจาก pages.json เฉพาะหน้าที่ไม่มี Page (หน้าที่มี Page ใช้ค่าที่ตั้งใน Rank Math เหมือนเดิม)
   tests/wp-fallback-seo.test.js */
add_filter('pre_handle_404', function ($preempt, $query = null) {
	if ($preempt || is_admin() || !$query || !$query->is_main_query() || !empty($query->posts)) return $preempt;
	$p = td_page();
	if (!$p || $p['route'] === '404') return $preempt;
	$GLOBALS['td_fallback'] = true;
	status_header(200);
	return true;
}, 10, 2);

/** ค่า SEO ของหน้าที่ไม่มี Page ใน WordPress (null = ใช้ค่าของ Rank Math) */
/** canonical เฉพาะหน้าที่ index ได้ · หน้า 404 / noindex ไม่มี canonical (17 พ.ย. 2026 · เดิม 404 ชี้ /404) */
function td_canonical_ok(array $p): bool {
	return str_starts_with($p['route'], '/') && !str_contains((string) ($p['robots'] ?? ''), 'noindex');
}
function td_fallback_seo(string $field) {
	$p = td_current();
	if (!$p || empty($GLOBALS['td_fallback'])) return null;
	if ($field === 'canonical') return td_canonical_ok($p) ? home_url($p['route']) : null;
	return ($p[$field] ?? '') !== '' ? $p[$field] : null;
}
/* 16 พ.ย. 2026 อาร์ตเลือกข้อ ข: title หน้าแรกบน staging เป็นค่าเดิมใน Rank Math "โรงงานรับผลิตเสื้อ…" (ขัดกติกาไม่ใช้คำว่าโรงงาน)
   → หน้าที่ธีมแสดงเองใช้ title จากต้นแบบทุกหน้า (มี Page หรือไม่ก็ตาม) รวม title ตอนแชร์ลิงก์ · บทความและหน้าอื่นใช้ Rank Math · tests/wp-page-title.test.js */
function td_page_title(): ?string {
	$p = td_current();
	return ($p && ($p['title'] ?? '') !== '') ? $p['title'] : null;
}
add_filter('rank_math/frontend/title', fn ($v) => td_page_title() ?? $v);
add_filter('rank_math/opengraph/facebook/og_title', fn ($v) => td_page_title() ?? $v);
add_filter('rank_math/opengraph/twitter/twitter_title', fn ($v) => td_page_title() ?? $v);
/* 17 พ.ย. 2026 อาร์ตเลือกข้อ ก: description หน้าเดิมใน Rank Math ยังเป็นของเว็บเก่า ("โรงงาน…" · ตัวเลขที่ไม่มีที่มา)
   → หน้าที่ธีมแสดงเองใช้ description จากต้นแบบ (ผ่านตัวตรวจความยาว npm run check แล้ว) รวมตอนแชร์ลิงก์ · tests/wp-page-title.test.js */
function td_page_description(): ?string {
	$p = td_current();
	return ($p && ($p['description'] ?? '') !== '') ? $p['description'] : null;
}
add_filter('rank_math/frontend/description', fn ($v) => td_page_description() ?? $v);
add_filter('rank_math/opengraph/facebook/og_description', fn ($v) => td_page_description() ?? $v);
add_filter('rank_math/opengraph/twitter/twitter_description', fn ($v) => td_page_description() ?? $v);
add_filter('rank_math/frontend/canonical', fn ($v) => td_fallback_seo('canonical') ?? $v);
/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A9: มี Rank Math → ธีมตัดแท็กแชร์ของตัวเอง (กันซ้ำ) · ส่งรูปแชร์รายหน้า (JPG 1200×630 · public/img/og)
   และภาษาไทยให้ Rank Math แทน ไม่งั้นได้รูปเว็บเก่า/โลโก้ และ en_US · ชื่อ filter ตามเอกสาร Rank Math ต้องลองบน staging ยืนยัน */
function td_og_from_head(string $head): ?string {
	return preg_match('~<meta property="og:image" content="([^"]+)"~', $head, $m) ? html_entity_decode($m[1], ENT_QUOTES) : null;
}
function td_page_og_image(): ?string {
	static $cache = [];
	$p = td_current();
	if (!$p) return null;
	return $cache[$p['slug']] ??= td_og_from_head(td_read_part($p['slug'], 'head', false));
}
add_filter('rank_math/opengraph/facebook/image', fn ($v) => td_page_og_image() ?? $v);
add_filter('rank_math/opengraph/twitter/image', fn ($v) => td_page_og_image() ?? $v);
add_filter('rank_math/opengraph/facebook/og_locale', fn ($v) => td_current() ? 'th_TH' : $v);

/* 17 พ.ย. 2026 แผน SEO/GEO ข้อ A10: graph ของ Rank Math ให้เหลือธุรกิจเดียว (/#business ของธีม · LocalBusiness ทุกหน้า head.hbs)
   เว็บจริงเดิม: #person "TEAMDEE STUDIO - โรงงาน…" + #organization ที่อยู่เก่า + BreadcrumbList "Home" + schema รายหน้าเก่า (Service/HowTo) + en-US
   หน้าธีม: ตัดธุรกิจ / breadcrumb / schema รายหน้าของ Rank Math (ธีมพิมพ์เองแล้ว) · บทความ: คงของ Rank Math แต่ผู้เผยแพร่ = TEAMDEE /#business
   ทุกหน้า: อ้างอิง #person / #organization → /#business · WebSite ชื่อ TEAMDEE ภาษาไทย ไม่มี SearchAction · ห้ามคืน array ว่าง
   key ใน $data ของ Rank Math รุ่นที่ติดตั้งต้อง dump ดูบน staging ก่อน · tests/theme-hardening.test.js */
function td_rm_ref($v, string $biz, array $old) {
	if (!is_array($v)) return $v;
	if (count($v) === 1 && isset($v['@id']) && in_array($v['@id'], $old, true)) return ['@id' => $biz];
	foreach ($v as $k => $x) $v[$k] = td_rm_ref($x, $biz, $old);
	return $v;
}
function td_rm_jsonld(array $data, bool $themePage, string $base): array {
	$biz = $base . '/#business';
	$old = [$base . '/#person', $base . '/#organization'];
	$out = [];
	foreach ($data as $k => $node) {
		if (!is_array($node)) { $out[$k] = $node; continue; }
		$id = $node['@id'] ?? '';
		$types = (array) ($node['@type'] ?? []);
		if ($id === $base . '/#organization') continue;
		if ($id === $base . '/#person') {
			if ($themePage) continue;
			$node = array_intersect_key($node, ['logo' => 1, 'image' => 1]) + ['@type' => 'Organization', '@id' => $biz, 'name' => 'TEAMDEE', 'alternateName' => 'ทีมดี', 'url' => $base . '/'];
		}
		/* หน้าธีม: Rank Math ใส่ Article (richSnippet · en-US) + ผู้เขียน (Person) ให้ Page เดิม · หน้าธีมไม่ใช่บทความ (ตรวจ staging 17 พ.ย. หน้า /blog/) */
		if ($themePage && (in_array('BreadcrumbList', $types, true) || in_array('Person', $types, true) || $k === 'richSnippet' || str_starts_with((string) $k, 'schema-'))) continue;
		if (in_array('WebSite', $types, true)) {
			$node['name'] = 'TEAMDEE';
			$node['alternateName'] = 'ทีมดี';
			unset($node['potentialAction']);
		}
		if (isset($node['inLanguage'])) $node['inLanguage'] = 'th';
		$out[$k] = td_rm_ref($node, $biz, $old);
	}
	/* ตัดจนว่าง: ห้ามคืน $data เดิม (ธุรกิจเก่ากลับมา) · ห้ามคืน array ว่าง → WebSite ขั้นต่ำที่ชี้ /#business (code review 17 พ.ย. 2026) */
	return $out ?: ['WebSite' => ['@type' => 'WebSite', '@id' => $base . '/#website', 'url' => $base . '/', 'name' => 'TEAMDEE', 'alternateName' => 'ทีมดี', 'inLanguage' => 'th', 'publisher' => ['@id' => $biz]]];
}
add_filter('rank_math/json_ld', fn ($data) => is_array($data) ? td_rm_jsonld($data, (bool) td_current(), untrailingslashit(home_url())) : $data, PHP_INT_MAX); /* ท้ายสุด: Rank Math ใส่ Article หลัง 99 (ตรวจ staging 17 พ.ย.) */
/* 17 พ.ย. 2026 รอบตรวจ SEO: ไม่มีปลั๊กอิน SEO → WordPress พิมพ์ canonical ให้เฉพาะ Page/โพสต์ หน้าแรกแบบรายการโพสต์ไม่มี · ธีมพิมพ์เอง */
function td_canonical_fallback(): void {
	$p = td_current();
	if (!$p || td_has_seo_plugin() || is_singular() || !td_canonical_ok($p)) return;
	echo '<link rel="canonical" href="' . esc_url(home_url($p['route'])) . '">' . "\n";
}
add_action('wp_head', 'td_canonical_fallback');
/* index ได้เมื่อหน้านั้นไม่ได้ตั้ง noindex และเว็บไม่ได้ปิดไม่ให้ Google เก็บ (staging) · หน้าร่างยังโดนตัวกรอง noindex ด้านล่างทับอีกชั้น */
add_filter('rank_math/frontend/robots', function ($robots) {
	$p = td_current();
	/* 17 พ.ย. 2026: ใช้กับทุกหน้าที่ธีมแสดง (เดิมเฉพาะหน้าที่ยังไม่มี Page · หน้าที่ sync ไปตอน noindex ค้าง noindex ใน Rank Math) */
	if (!$p || get_option('blog_public') === '0' || str_contains($p['robots'] ?? '', 'noindex')) return $robots;
	$robots['index'] = 'index';
	$robots['follow'] = 'follow';
	return $robots;
}, 5);

/* ---------- เลือก template ---------- */

add_filter('template_include', function ($template) {
	$p = td_page();
	/* หน้าแรก หน้า (Page) ที่ slug ตรงกับต้นแบบ หรือ URL ที่ WordPress ยังไม่มีหน้า (404) แต่ต้นแบบมี
	   ไม่ทับหน้ารวมบทความของ WordPress (is_home ที่ไม่ใช่หน้าแรก) เพราะต้องเป็นโพสต์จริง */
	if ($p && $p['route'] !== '404' && (is_front_page() || is_page() || is_404() || !empty($GLOBALS['td_fallback']))) {
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

/* ---------- บทความและหมวด ใช้แม่แบบของธีมเสมอ ---------- */
/* 16 พ.ย. 2026: staging มีเทมเพลต Elementor Pro "Single Post" (เงื่อนไข Posts) จากเว็บเดิม ทับหน้าบทความทั้งหน้า
   (Elementor Pro เปลี่ยน template_include ที่ priority 12) → บทความเป็นหน้าตาเว็บเก่า · เนื้อบทความเป็นโพสต์ปกติ ธีมแสดงเองได้
   จึงดึงกลับมาใช้แม่แบบของธีมทีหลังสุด · หน้า (Page) จัดการในตัวกรองด้านบนแล้ว · tests/wp-post-template.test.js */
add_filter('template_include', function ($template) {
	if (is_singular('post')) return get_theme_file_path('single.php');
	if (is_category()) return get_theme_file_path('category.php');
	return $template;
}, 100);

/* ---------- /llms.txt (17 พ.ย. 2026 แผน SEO/GEO ข้อ A1 · tests/llms-txt.test.js) ----------
   ไฟล์สรุปให้ AI อ่านข้อมูลบริษัท เงื่อนไข ราคาเริ่มต้น วันผลิต หน้าหลัก · export สร้างจาก site.json / prices.json / lead-times.json
   ส่งก่อน WordPress หา query (ไม่มีไฟล์จริงที่รากเว็บ) · ติดตั้งในโฟลเดอร์ย่อยก็ตอบที่ /<โฟลเดอร์>/llms.txt */
function td_serve_llms(): void {
	if (td_request_route() !== '/llms.txt/') return;
	$f = TD_BUILD . '/llms.txt';
	if (!is_readable($f)) return;
	status_header(200);
	header('Content-Type: text/plain; charset=utf-8');
	header('X-Robots-Tag: noindex');
	readfile($f);
	exit;
}
add_action('parse_request', 'td_serve_llms', 0);

/* ---------- URL ที่ต้นแบบมีหน้า ---------- */
/* URL ที่ต้นแบบมีหน้า ห้าม WordPress เดา slug แล้ว 301 ไปหน้าชื่อคล้าย (เช่น /project/ → /projects/)
   การเดานี้ทำงานก่อน template_include · เจอ 22 ต.ค. 2026 ตอนย้าย URL ตาม Wireframe v22 */
/** URL ที่ path ไม่มี / ท้าย → URL เดียวกันที่มี / (query คงไว้) · มีแล้ว = null (17 พ.ย. 2026: /faq กับ /faq/ เคยตอบ 200 ทั้งคู่) */
function td_slash_url(string $url): ?string {
	$path = (string) wp_parse_url($url, PHP_URL_PATH);
	if ($path === '' || str_ends_with($path, '/')) return null;
	$at = strpos($url, $path, (int) strpos($url, '//') + 2);
	return $at === false ? null : substr_replace($url, $path . '/', $at, strlen($path));
}
add_filter('redirect_canonical', function ($redirect, $requested = '') {
	/* ?p= / ?page_id= (ลิงก์ถาวรแบบเลข) ให้ WordPress redirect ไป URL จริงตามปกติ (17 พ.ย. 2026 · เดิม /?p=1 ตอบ 200 เป็นหน้าแรก) */
	if (isset($_GET['p']) || isset($_GET['page_id'])) return $redirect;
	return td_page() ? td_slash_url($requested) ?? false : $redirect;
}, 10, 2);

/** path ตัวพิมพ์ใหญ่ที่มีหน้าตัวเล็ก → path ตัวเล็ก · ไม่มี = null (17 พ.ย. 2026 · เดิม /FAQ/ ตอบ 200 เป็นหน้า WP เปล่า) */
function td_case_target(string $route, callable $exists): ?string {
	$low = strtolower($route);
	return ($low !== $route && $exists($low)) ? $low : null;
}
/* ค้นหาของ WordPress (?s=) เปิดหน้าภาษาอังกฤษ "Archives" → หน้าค้นหาของเว็บ /search/?q= (Rank Math SearchAction ชี้ ?s=) */
function td_search_redirect(): void {
	if (is_admin() || is_feed() || !isset($_GET['s']) || !is_string($_GET['s']) || !td_page('/search/')) return;
	wp_safe_redirect(add_query_arg('q', rawurlencode(wp_unslash((string) $_GET['s'])), home_url('/search/')), 301);
	exit;
}
add_action('template_redirect', function () {
	td_search_redirect();
	$to = td_case_target(td_request_route(), fn ($r) => td_page($r) !== null);
	if ($to) { $q = (string) ($_SERVER['QUERY_STRING'] ?? ''); wp_safe_redirect(home_url($to) . ($q !== '' ? "?$q" : ''), 301); exit; } /* คง ?q= / utm ไว้ */
}, 0);
/* sitemap ของ WordPress (ตอนไม่มีปลั๊กอิน SEO): ไม่เอาหน้าผู้ใช้ · หน้า archive ผู้เขียน/วันที่ไม่ให้ Google เก็บ (หน้าบาง ซ้ำกับ /blog/) */
add_filter('wp_sitemaps_add_provider', fn ($provider, $name) => $name === 'users' ? false : $provider, 10, 2);
add_filter('wp_robots', function (array $robots) {
	if (is_author() || is_date()) $robots['noindex'] = true;
	return $robots;
});
add_filter('do_redirect_guess_404_permalink', function ($guess) {
	return td_page() ? false : $guess;
});

/* ---------- head ---------- */

add_filter('pre_get_document_title', function ($title) {
	$p = td_current();
	/* 17 พ.ย. 2026: WordPress พิมพ์ค่านี้ใน <title> โดยไม่ escape · pages.json ถอด entity แล้ว (&amp; → &) */
	return ($p && !td_has_seo_plugin() && !empty($p['title'])) ? esc_html($p['title']) : $title;
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
	return (in_array($object->post_name, TD_NOINDEX_SLUGS, true) || td_route_noindex(td_route_of_post($object)) || td_retired_target(td_route_of_post($object)) !== null) ? false : $url;
}, 10, 3);
add_filter('wp_sitemaps_posts_query_args', function (array $args, string $type) {
	if ($type !== 'page') return $args;
	$noindex = array_map(fn ($r) => trim($r, '/'), array_keys(array_filter(td_manifest()['pages'] ?? [], fn ($p) => str_contains($p['robots'] ?? '', 'noindex'))));
	$retired = array_map(fn ($r) => trim($r, '/'), array_keys((array) apply_filters('teamdee_retired_pages', TD_RETIRED)));
	$ids = array_filter(array_map(fn ($slug) => get_page_by_path($slug)?->ID, [...TD_NOINDEX_SLUGS, ...array_filter($noindex, fn ($s) => $s !== '' && $s !== '404'), ...$retired]));
	if ($ids) $args['post__not_in'] = array_merge($args['post__not_in'] ?? [], $ids);
	return $args;
}, 10, 2);

/** Assets and functional scripts only: CMS posts must not inherit the blog hub's SEO identity. */
function td_cms_asset_head(string $head): string {
	$head = preg_replace('~<title\b[^>]*>.*?</title\s*>~is', '', $head);
	$head = preg_replace_callback('~<meta\b[^>]*>~is', function ($m) {
		if (!preg_match('~\b(?:name|property)\s*=\s*([\"\x27])(.*?)\1~is', $m[0], $attr)) return $m[0];
		$key = strtolower(trim($attr[2]));
		return in_array($key, ['description', 'robots', 'googlebot', 'bingbot'], true) || str_starts_with($key, 'og:') || str_starts_with($key, 'twitter:') ? '' : $m[0];
	}, $head);
	$head = preg_replace_callback('~<link\b[^>]*>~is', function ($m) {
		return preg_match('~\brel\s*=\s*([\"\x27])[^\"\x27]*\bcanonical\b[^\"\x27]*\1~i', $m[0]) ? '' : $m[0];
	}, $head);
	return preg_replace('~<script\b(?=[^>]*\btype\s*=\s*([\"\x27])application/ld\+json\1)[^>]*>.*?</script\s*>~is', '', $head);
}

add_action('wp_head', function () {
	if (($base = td_base_path()) !== '') printf("<meta name=\"td-base\" content=\"%s\">\n", esc_attr($base));
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
		if ($blog) echo td_cms_asset_head(td_read_part($blog['slug'], 'head')); // phpcs:ignore
	}
	/* แถบผู้ดูแลของ WordPress สูง 32px ดันแถบเมนูที่ติดบนสุดลงมาไม่ให้ทับกัน */
	/* จอ ≤600px แถบแอดมิน WP เลื่อนหายไปกับหน้า (position:absolute) header ต้องกลับไปติดขอบบน ไม่งั้นเหลือช่อง 46px เห็นเนื้อหาโผล่ */
	echo "<style>.admin-bar [data-header]{top:32px}@media(max-width:782px){.admin-bar [data-header]{top:46px}}@media(max-width:600px){.admin-bar [data-header]{top:0}}</style>\n";
}, 5);

/* หน้าที่มาจากต้นแบบไม่ใช้ block editor ไม่ต้องโหลด CSS ของ block · ลดของที่ไม่ได้ใช้
   WP 6.9+ ธีม classic พิมพ์ global-styles ตอน wp_footer แล้วย้ายขึ้น <head> (wp_hoist_late_printed_styles)
   dequeue ตอนนี้จึงไม่ทัน ต้องถอด hook ตอน wp_footer ด้วย ไม่งั้น body{padding:0} ของ WP ทับที่เว้นให้แถบล่างมือถือ (audit 26 ต.ค. H1) */
add_action('wp_enqueue_scripts', function () {
	if (!td_current()) return;
	foreach (['wp-block-library', 'wp-block-library-theme', 'global-styles', 'classic-theme-styles', 'wp-global-styles-placeholder'] as $h) {
		wp_dequeue_style($h);
	}
	remove_action('wp_footer', 'wp_enqueue_global_styles', 1);
}, 100);
remove_action('wp_head', 'print_emoji_detection_script', 7);
remove_action('wp_print_styles', 'print_emoji_styles');

/* 16 พ.ย. 2026 (staging หน้าแรกพื้นดำ ตัวหนังสือดำหาย): หน้า Elementor ของเว็บเดิม (#50) มี CSS เอง html, body { background-color:#050505; padding:0 !important }
   Elementor ยังโหลด CSS ของหน้าเดิมและ CSS กลางของมันลงหน้าที่ธีมแสดงเอง (หลัง CSS ธีม) → ทับพื้นขาวและที่เว้นแถบล่างมือถือ
   หน้าจากต้นแบบไม่ใช้ Elementor เลย → เอา CSS ของ Elementor ออกทั้งที่ใส่ใน head และที่ใส่ท้ายหน้า · บทความและหน้าอื่นไม่แตะ · tests/wp-no-elementor-css.test.js */
function td_is_elementor_asset(string $handle, string $src): bool {
	if (str_starts_with($handle, 'elementor-') || str_starts_with($handle, 'elementor_')) return true;
	return (bool) preg_match('~/(?:plugins/elementor(?:-pro)?|uploads/elementor)/~', $src);
}
function td_dequeue_elementor_styles(): void {
	if (!td_current()) return;
	$styles = wp_styles();
	foreach ((array) $styles->queue as $h) {
		$src = (string) ($styles->registered[$h]->src ?? '');
		if (td_is_elementor_asset((string) $h, $src)) wp_dequeue_style($h);
	}
}
add_action('wp_print_styles', 'td_dequeue_elementor_styles', 1);
add_action('wp_print_footer_scripts', 'td_dequeue_elementor_styles', 1);
add_filter('style_loader_tag', fn ($tag, $handle, $href) => (td_current() && td_is_elementor_asset($handle, (string) $href)) ? '' : $tag, 10, 3);

/* 17 พ.ย. 2026 staging console "elementorFrontendConfig is not defined" (Elementor 4.2.4) · อาร์ตเลือกข้อ ก
   สคริปต์ Elementor ยังโหลดลงหน้าที่ธีมแสดงเอง (Page เดิมเป็นหน้า Elementor) แต่ค่าตั้งต้นไม่มา → error ทุกหน้า + โหลดสคริปต์ที่ไม่ได้ใช้
   → ตัดสคริปต์ Elementor และสคริปต์ที่พึ่ง Elementor (ทางอ้อมก็นับ · ปลั๊กอินเสริม widget) · jQuery และปลั๊กอินอื่นคงไว้ · บทความและหน้าอื่นไม่แตะ
   tests/wp-no-elementor-js.test.js */
function td_script_needs_elementor(string $handle, array $registered, array $seen = []): bool {
	$r = $registered[$handle] ?? null;
	if (!$r || isset($seen[$handle])) return false;
	if (td_is_elementor_asset($handle, (string) ($r->src ?? ''))) return true;
	$seen[$handle] = true;
	foreach ((array) ($r->deps ?? []) as $d) if (td_script_needs_elementor((string) $d, $registered, $seen)) return true;
	return false;
}
function td_dequeue_elementor_scripts(): void {
	if (!td_current()) return;
	$scripts = wp_scripts();
	foreach ((array) $scripts->queue as $h) {
		if (td_script_needs_elementor((string) $h, $scripts->registered)) wp_dequeue_script($h);
	}
}
add_action('wp_print_scripts', 'td_dequeue_elementor_scripts', 1);
add_action('wp_print_footer_scripts', 'td_dequeue_elementor_scripts', 1);
/* กันหลุด: ตัวที่ยังถูกพิมพ์ (เป็น dependency ของตัวอื่น) ตัดทั้งแท็ก รวมสคริปต์ inline ก่อน/หลัง (ค่าตั้งต้น elementorFrontendConfig) */
add_filter('script_loader_tag', fn ($tag, $handle) => (td_current() && td_script_needs_elementor($handle, wp_scripts()->registered)) ? '' : $tag, 10, 2);

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

/* Consent Mode v2 (ป้ายคุกกี้ PDPA · 26 ต.ค. 2026) · ค่าเริ่ม = ไม่ยินยอม ต้องมาก่อน GTM (ลำดับ 0 < 1)
   ชุดเดียวกับ src/partials/consentHead.hbs · tests/consent.test.js ตรวจว่าตรงกัน */
function td_consent_default(): string {
	return '<script>(function(w){w.dataLayer=w.dataLayer||[];var gtag=w.gtag=w.gtag||function(){w.dataLayer.push(arguments)};gtag(\'consent\',\'default\',{analytics_storage:\'denied\',ad_storage:\'denied\',ad_user_data:\'denied\',ad_personalization:\'denied\',wait_for_update:500});gtag(\'set\',\'ads_data_redaction\',true);try{var c=JSON.parse(localStorage.getItem(\'td-consent\'));var g=c&&(Date.now()-Date.parse(c.at))/864e5;if(c&&(c.v===1||c.v===2&&typeof c.media===\'boolean\')&&typeof c.analytics===\'boolean\'&&typeof c.marketing===\'boolean\'&&g>=0&&g<=365){var a=c.analytics?\'granted\':\'denied\',m=c.v===2&&c.marketing?\'granted\':\'denied\';gtag(\'consent\',\'update\',{analytics_storage:a,ad_storage:m,ad_user_data:m,ad_personalization:m})}}catch(e){}})(window);</script>';
}
add_action('wp_head', function () {
	echo td_consent_default() . "\n";
}, 0);

add_action('wp_head', function () {
	$id = td_gtm_id();
	if (!$id) return;
	printf(
		/* โหลด GTM ทีหลัง (30 ต.ค. อาร์ตอนุญาต): ผู้ใช้แตะ/เลื่อน/กดปุ่มครั้งแรก หรือทันทีที่หน้าโหลดเสร็จ (load) แล้วแต่อย่างไหนก่อน
		   ไม่แย่งเน็ตกับรูปจอแรกบนมือถือ · event ที่ push เข้า dataLayer ก่อนหน้านั้นยังอยู่ครบ GTM อ่านต่อเอง
		   เดิมรอเพิ่ม ~2.5 วิ หลัง load → คนกด LINE บนคอมพ์เร็วๆ คลิกไม่ถูกนับ · อาร์ตเลือก "ข" โหลดตอน load เลย (30 ต.ค.) */
		"<script>(function(w,d,s,l,i){w[l]=w[l]||[];var done=0;function go(){if(done)return;done=1;w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f)}['pointerdown','keydown','scroll','touchstart'].forEach(function(e){w.addEventListener(e,go,{once:true,passive:true})});w.addEventListener('load',go)})(window,document,'script','dataLayer','%s');</script>\n",
		esc_js($id)
	);
}, 1);

/* GTM <noscript> เอาออก (ตรวจโค้ด 26 ต.ค. L7): ผู้ใช้ที่ปิด JS ไม่ผ่าน Consent Mode จะโดนโหลด GTM โดยไม่ได้ยินยอม */

/* ---------- ฟอร์มติดต่อ /contact-us/ · ส่งเข้าอีเมลทีมขาย (แผน v22 ระยะ 3 · อาร์ตเคาะ 22 ต.ค. 2026) ----------
   ตั้งอีเมลรับฟอร์มที่ ลักษณะ > ปรับแต่ง > TEAMDEE · เว้นว่าง = ปิด หน้าเว็บใช้ทางสำรอง (ส่งต่อทาง LINE ที่พิมพ์ข้อความไว้ให้)
   กันสแปม: ช่องกันบอท (website) + จำกัด 5 ครั้ง / 10 นาที ต่อเครื่อง · ไม่มีช่องแนบไฟล์ (อาร์ตเคาะ 24 ต.ค.) ไฟล์ส่งทาง LINE
   ส่งสำเร็จ → หน้า /thank-you/ ของธีม (site/thank-you/ ในต้นแบบ) แสดงเบอร์ที่กรอก และยิง td_form_submit
   ไม่เก็บข้อมูลลูกค้าลงฐานข้อมูล ส่งอีเมลอย่างเดียว */

add_action('customize_register', function (WP_Customize_Manager $c) {
	$c->add_setting('teamdee_form_email', ['type' => 'option', 'default' => '', 'sanitize_callback' => 'sanitize_email']);
	$c->add_control('teamdee_form_email', [
		'section' => 'teamdee',
		'label' => 'อีเมลรับฟอร์มติดต่อ',
		'description' => 'อีเมลทีมขายที่รับข้อมูลจากหน้า /contact-us/ · เว้นว่าง = ปิดการส่ง (หน้าเว็บบอกลูกค้าว่ายังไม่ถึงทีม แล้วพาไปส่งทาง LINE แทน)',
	]);
	$c->add_setting('teamdee_form_thanks', ['type' => 'option', 'default' => '/thank-you/', 'sanitize_callback' => 'td_thanks_path']);
	$c->add_control('teamdee_form_thanks', [
		'section' => 'teamdee',
		'label' => 'หน้าหลังส่งฟอร์มสำเร็จ',
		'description' => 'ค่าเริ่มต้น /thank-you/ (หน้าเดิมบนเว็บจริง ใช้วัดผลแอด · ธีมแสดงหน้าขอบคุณของต้นแบบ) · ต้องขึ้นต้นด้วย / · ค่าว่างหรือผิดรูปแบบ = /thank-you/',
	]);
});

function td_form_email(): string {
	return (string) get_option('teamdee_form_email', '');
}

/** path หน้าขอบคุณ · ต้องขึ้นต้น / ตัวเดียว (30 ต.ค.: เดิมรับ //host = พาออกนอกเว็บได้) · ผิดรูปแบบ = /thank-you/ */
function td_thanks_path($v): string {
	$v = (string) $v;
	return preg_match('#^/(?!/)[a-z0-9/_-]*$#i', $v) ? $v : '/thank-you/';
}

/** ใช้ตอนอ่านด้วย · ค่าที่บันทึกไว้ก่อนแก้ sanitize อาจเป็น //host */
function td_form_thanks(): string {
	return td_thanks_path(get_option('teamdee_form_thanks', '/thank-you/'));
}

/* ค่าที่ JS ใช้ (src/js/contact-send.js) · พิมพ์เฉพาะหน้าติดต่อ */
add_action('wp_head', function () {
	$p = td_current();
	if (!$p || ($p['route'] ?? '') !== '/contact-us/') return;
	$cfg = [
		'enabled' => td_form_email() !== '',
		'endpoint' => admin_url('admin-post.php'),
		'thanks' => td_form_thanks(),
	];
	printf("<script>window.TD_FORM=%s;</script>\n", wp_json_encode($cfg));
}, 6);

/* ---------- ตัวช่วยของฟอร์มติดต่อ (30 ต.ค. · ตรวจ security) ---------- */

/* ช่วง IP ของ Cloudflare (cloudflare.com/ips-v4 + ips-v6 · เทียบแล้วตรงทุกช่วง 30 ต.ค. 2026) · REMOTE_ADDR อยู่ในช่วงนี้เท่านั้นถึงเชื่อ CF-Connecting-IP
   ไม่งั้นใครก็ปลอม header หลบ rate limit ได้ · ช่วงเปลี่ยน → แก้ด้วย filter teamdee_cloudflare_ranges
   proxy อื่น (nginx / load balancer) → ใช้ filter teamdee_client_ip ( $ip, $remote_addr ) คืน IP ลูกค้าเอง */
const TD_CF_RANGES = [
	'173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18',
	'190.93.240.0/20', '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13',
	'104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
	'2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32',
];

/** IP อยู่ในช่วง CIDR ไหม (IPv4 / IPv6) */
function td_ip_in(string $ip, string $cidr): bool {
	$parts = explode('/', $cidr, 2);
	$a = @inet_pton($ip);
	$b = @inet_pton($parts[0]);
	if ($a === false || $b === false || strlen($a) !== strlen($b)) return false;
	$bits = isset($parts[1]) ? max(0, min(strlen($a) * 8, (int) $parts[1])) : strlen($a) * 8;
	$whole = intdiv($bits, 8);
	if (substr($a, 0, $whole) !== substr($b, 0, $whole)) return false;
	$rest = $bits % 8;
	if ($rest === 0) return true;
	$mask = (0xFF << (8 - $rest)) & 0xFF;
	return (ord($a[$whole]) & $mask) === (ord($b[$whole]) & $mask);
}

/** IP ลูกค้า · หลัง Cloudflare ใช้ CF-Connecting-IP (เดิมใช้ REMOTE_ADDR = ทุกคนเป็น IP ของ CF แชร์โควตาเดียว โดน 429 กันหมด) */
function td_client_ip(): string {
	$remote = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	$ip = $remote;
	$cf = isset($_SERVER['HTTP_CF_CONNECTING_IP']) ? trim((string) $_SERVER['HTTP_CF_CONNECTING_IP']) : '';
	if ($cf !== '' && filter_var($cf, FILTER_VALIDATE_IP)) {
		foreach ((array) apply_filters('teamdee_cloudflare_ranges', TD_CF_RANGES) as $range) {
			if (td_ip_in($remote, (string) $range)) { $ip = $cf; break; }
		}
	}
	return (string) apply_filters('teamdee_client_ip', $ip, $remote);
}

/** กลุ่มที่นับ rate limit · IPv6 นับทั้ง /64 (บ้านหนึ่งได้ทั้ง /64 เปลี่ยนเลขท้ายได้เรื่อยๆ) · IPv4 ที่ห่อใน IPv6 นับเป็น IPv4 */
function td_rate_bucket(string $ip): string {
	$bin = @inet_pton($ip);
	if ($bin === false) return $ip;
	if (strlen($bin) === 16 && substr($bin, 0, 12) === str_repeat("\0", 10) . "\xFF\xFF") return (string) inet_ntop(substr($bin, 12));
	return strlen($bin) === 16 ? bin2hex(substr($bin, 0, 8)) . '::/64' : $ip;
}

/** ส่งมาจากหน้าเว็บเราเอง · ดู Origin ก่อน (ไม่มี/null ค่อยดู Referer) · ไม่มีทั้งคู่ = ไม่รับ */
function td_same_site(?string $origin, ?string $referer, string $home): bool {
	$want = strtolower((string) wp_parse_url($home, PHP_URL_HOST));
	$src = ($origin !== null && $origin !== '' && $origin !== 'null') ? $origin : (string) $referer;
	$host = strtolower((string) wp_parse_url($src, PHP_URL_HOST));
	return $want !== '' && $host === $want;
}

/** ชื่อใน Reply-To · ตัด " , ; < > \ และอักขระควบคุม · wp_mail แยกที่อยู่ด้วย , และ PHPMailer ใส่เครื่องหมายคำพูด/เข้ารหัสชื่อให้เอง
    (ใส่ "..." เองจะติดไปกับชื่อ: wp-includes/pluggable.php แยกชื่อด้วย /(.*)<(.+)>/ ไม่ตัดเครื่องหมายคำพูด) */
function td_reply_name(string $name): string {
	return trim(preg_replace('/[\x00-\x1F\x7F",;<>\\\\]+/u', ' ', $name));
}

/** ฟอร์มส่งเอง (ไม่มี JS) หรือส่งผ่าน fetch · ช่อง td_nojs มีแต่ตอนฟอร์มส่งเอง (contact-send.js ไม่ส่งช่องนี้) */
function td_contact_is_nav(): bool {
	return !empty($_POST['td_nojs']) || (($_SERVER['HTTP_SEC_FETCH_MODE'] ?? '') === 'navigate');
}

/** ค่าทุกตัวของชื่อช่องที่ซ้ำ (checkbox "เอกสาร" ตอนส่งไม่มี JS · PHP เก็บใน $_POST แค่ตัวสุดท้าย) */
function td_post_all(string $key): array {
	$out = [];
	foreach (explode('&', (string) file_get_contents('php://input')) as $pair) {
		$kv = explode('=', $pair, 2);
		if (urldecode($kv[0]) === $key && isset($kv[1])) $out[] = urldecode($kv[1]);
	}
	return $out;
}

function td_contact_handle(): void {
	$nav = td_contact_is_nav();
	/* ผลลัพธ์: fetch ได้ JSON (contact-send.js) · ฟอร์มส่งเองได้ redirect 303 (ไม่ทิ้งข้อมูลไว้ใน URL) */
	$fail = static function (string $why, int $code) use ($nav): void {
		if (!$nav) wp_send_json(['ok' => false, 'reason' => $why], $code);
		wp_safe_redirect(add_query_arg(['sent' => '0', 'why' => $why], home_url('/contact-us/')), 303);
		exit;
	};
	$done = static function (bool $real) use ($nav): void {
		if (!$nav) wp_send_json(['ok' => true], 200);
		$url = home_url(td_form_thanks());
		if ($real) {
			$t = wp_generate_password(20, false);
			set_transient('td_sent_' . $t, 1, 30 * MINUTE_IN_SECONDS);
			$url = add_query_arg('sent', $t, $url);
		}
		wp_safe_redirect($url, 303);
		exit;
	};

	/* กันส่งข้ามเว็บ (30 ต.ค.) · ไม่ใช้ nonce เพราะหน้าอาจถูก cache */
	$origin = isset($_SERVER['HTTP_ORIGIN']) ? (string) $_SERVER['HTTP_ORIGIN'] : null;
	$referer = isset($_SERVER['HTTP_REFERER']) ? (string) $_SERVER['HTTP_REFERER'] : null;
	if (!td_same_site($origin, $referer, home_url('/'))) $fail('origin', 403);

	$to = td_form_email();
	if ($to === '') $fail('off', 503);
	if (!empty($_POST['website'])) $done(false); // บอท · ตอบเหมือนสำเร็จแต่ไม่ส่ง

	$key = 'td_contact_' . md5(td_rate_bucket(td_client_ip()));
	$hits = (int) get_transient($key);
	if ($hits >= 5) $fail('limit', 429);
	set_transient($key, $hits + 1, 10 * MINUTE_IN_SECONDS);

	/* JS ส่งชื่อช่องอังกฤษ · ฟอร์มส่งเองใช้ name ภาษาไทยของ input (site/contact-us/index.html · ข้อความคัดลอกใช้ชื่อนี้) */
	$alias = ['name' => 'ชื่อ', 'tel' => 'เบอร์โทร', 'org' => 'องค์กร', 'email' => 'อีเมล', 'order' => 'เลขออเดอร์เดิม', 'qty' => 'จำนวน', 'date' => 'วันที่ต้องการใช้', 'use' => 'ใช้กับงาน', 'product' => 'สินค้าที่สนใจ', 'note' => 'รายละเอียด', 'from' => 'มาจากหน้า'];
	$raw = static function (string $k) use ($alias): string {
		$v = $_POST[$k] ?? (isset($alias[$k]) ? ($_POST[$alias[$k]] ?? '') : '');
		return is_string($v) ? wp_unslash($v) : '';
	};
	$f = static fn (string $k, bool $long = false) => mb_substr($long ? sanitize_textarea_field($raw($k)) : sanitize_text_field($raw($k)), 0, $long ? 3000 : 200);
	$name = $f('name');
	/* เบอร์องค์กรมีเบอร์ต่อได้ ("ต่อ 12" "#12" "ext 5") · เก็บตามที่พิมพ์ (ตัวเลข + ( ) - # และคำว่าต่อ/ext) นับหลักจากเบอร์หลัก (audit 26 ต.ค. M2) */
	$tel = trim(preg_replace('/[^0-9+\-() #a-zA-Z.\x{0E00}-\x{0E7F}]/u', '', $f('tel')));
	$tel_main = preg_replace('/\s*(?:ต่อ|ext\.?|x|#)\s*\d{1,6}\s*$/iu', '', $tel);
	if ($name === '' || strlen(preg_replace('/\D/', '', $tel_main)) < 9) $fail('invalid', 400);
	$email = sanitize_email($raw('email'));
	/* อีเมลผิดรูปแบบไม่ทิ้งเงียบ: ส่งค่าที่พิมพ์มาให้ทีมขายดูเอง (audit 26 ต.ค. M2) */
	$email_raw = $f('email');
	if (!is_email($email)) $email = '';
	/* สรุปจากหน้าคำนวณยาวถึง 300 ตัว (contact-send.js CALC_MAX · 2 พ.ย.) */
	$from = mb_substr(sanitize_text_field($raw('from')), 0, 300);
	$docs = $f('docs');
	if ($docs === '' && $nav) $docs = mb_substr(implode(', ', array_filter(array_map('sanitize_text_field', td_post_all('เอกสาร')))), 0, 200);

	$rows = [
		'ชื่อ' => $name, 'เบอร์โทร' => $tel, 'องค์กร' => $f('org'), 'อีเมล' => $email,
		'อีเมล (รูปแบบอาจผิด)' => ($email === '' && $email_raw !== '') ? $email_raw : '',
		'เลขออเดอร์เดิม' => $f('order'),
		'จำนวน' => $f('qty'), 'วันที่ต้องการใช้' => $f('date'), 'ใช้กับงาน' => $f('use'), 'สินค้าที่สนใจ' => $f('product'),
		'เอกสารที่ต้องการ' => $docs,
		'มาจากหน้า' => $from,
		'ส่งแบบ' => $nav ? 'ฟอร์มไม่มี JS' : '',
	];
	$body = '';
	foreach ($rows as $label => $v) if ($v !== '') $body .= "{$label}: {$v}\n";
	$note = $f('note', true);
	if ($note !== '') $body .= "\nรายละเอียด:\n{$note}\n";
	$body .= "\n— ส่งจากฟอร์มหน้า /contact-us/ ของ " . home_url('/');

	$headers = ['Content-Type: text/plain; charset=UTF-8'];
	if (is_email($email)) {
		$rn = td_reply_name($name);
		$headers[] = 'Reply-To: ' . ($rn !== '' ? $rn . ' <' . $email . '>' : $email);
	}
	$subject = ($from === 'reorder' ? 'สั่งซ้ำ: ' : 'ขอราคา/ติดต่อจากเว็บ: ') . $name;
	wp_mail($to, $subject, $body, $headers) ? $done(true) : $fail('mail', 500);
}
add_action('admin_post_nopriv_td_contact', 'td_contact_handle');
add_action('admin_post_td_contact', 'td_contact_handle');

/* ---------- security headers หน้าเว็บ (30 ต.ค. · audit Security LOW) ----------
   send_headers ทำงานเฉพาะหน้าบ้าน (WP::send_headers) ไม่โดนหน้าแอดมิน · SAMEORIGIN ยังให้ Customizer เปิดหน้าใน iframe ได้ (โดเมนเดียวกัน)
   มีปลั๊กอิน/เซิร์ฟเวอร์ตั้งไว้แล้ว = ไม่ทับ */
add_action('send_headers', function () {
	if (headers_sent() || is_admin()) return;
	$have = array_map(fn ($h) => strtolower(trim(explode(':', $h, 2)[0])), headers_list());
	foreach ([
		'X-Content-Type-Options' => 'nosniff',
		'Referrer-Policy' => 'strict-origin-when-cross-origin',
		'X-Frame-Options' => 'SAMEORIGIN',
	] as $k => $v) {
		if (!in_array(strtolower($k), $have, true)) header("$k: $v");
	}
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
		td_seo_legacy_panel();
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

/* ---------- SEO 22 URL เดิม (Rank Math) · อาร์ตเคาะ "ใช้ตามที่เสนอทั้งหมด" 30 ต.ค. 2026 ----------
   ข้อมูล seo-legacy.json (ที่มา docs/seo/rank-math-title-map-2026-10-30.md) · ธีมไม่เขียนเอง ผู้ดูแลกดปุ่มที่ เครื่องมือ > หน้าจากต้นแบบ
   เขียนเฉพาะช่องที่ยังว่าง · เป็นแม่แบบ (%title% ฯลฯ) · หรือยังเป็นข้อความเดิม ณ 30 ต.ค. · มีคนแก้ใน Rank Math หลังจากนั้น = ข้าม แสดงให้เห็น
   หน้าแรกแบบรายการบทความ (ไม่มีหน้าแรกเป็นหน้า) ใช้ค่าในตั้งค่า Rank Math > Titles & Meta > Homepage */
function td_seo_legacy(): array {
	static $pages = null;
	if ($pages === null) {
		$f = __DIR__ . '/seo-legacy.json';
		$json = is_readable($f) ? json_decode((string) file_get_contents($f), true) : null;
		$pages = is_array($json['pages'] ?? null) ? $json['pages'] : [];
	}
	return $pages;
}

function td_seo_norm(string $s): string {
	return trim((string) preg_replace('/\s+/u', ' ', html_entity_decode(wp_strip_all_tags($s), ENT_QUOTES, 'UTF-8')));
}

/** ที่เก็บค่าของ URL เดิม: ['post', id] หรือ ['home'] (ตั้งค่า Rank Math) หรือ null = ไม่พบหน้า */
function td_seo_target(string $route): ?array {
	if ($route === '/') {
		$id = (int) get_option('page_on_front');
		return $id ? ['post', $id] : ['home'];
	}
	$id = url_to_postid(home_url($route));
	if (!$id && ($p = get_page_by_path(trim($route, '/')))) $id = $p->ID;
	return $id ? ['post', (int) $id] : null;
}

function td_seo_get(array $t, string $k): string {
	if ($t[0] === 'post') return (string) get_post_meta($t[1], 'rank_math_' . $k, true);
	$o = (array) get_option('rank-math-options-titles', []);
	return (string) ($o['homepage_' . $k] ?? '');
}

function td_seo_set(array $t, string $k, string $v): void {
	if ($t[0] === 'post') { update_post_meta($t[1], 'rank_math_' . $k, $v); return; }
	$o = (array) get_option('rank-math-options-titles', []);
	$o['homepage_' . $k] = $v;
	update_option('rank-math-options-titles', $o);
}

/** แผนต่อช่อง: keep = คงเดิม · done = ใช้ค่าใหม่แล้ว · apply = จะเปลี่ยน · edited = มีคนแก้หลัง 30 ต.ค. (ข้าม) · missing = ไม่พบหน้า */
function td_seo_legacy_plan(): array {
	$plan = [];
	foreach (td_seo_legacy() as $route => $p) {
		$t = td_seo_target((string) $route);
		foreach (['title', 'description'] as $k) {
			$new = $p[$k] ?? null;
			$row = ['route' => (string) $route, 'field' => $k, 'new' => $new, 'cur' => '', 'target' => $t];
			if ($new === null) $row['state'] = 'keep';
			elseif (!$t) $row['state'] = 'missing';
			else {
				$cur = td_seo_get($t, $k);
				$row['cur'] = $cur;
				$template = $cur === '' || preg_match('/%[a-z_]+%/', $cur);
				$row['state'] = td_seo_norm($cur) === td_seo_norm((string) $new) ? 'done'
					: (($template || td_seo_norm($cur) === td_seo_norm((string) ($p['old'][$k] ?? ''))) ? 'apply' : 'edited');
			}
			$plan[] = $row;
		}
	}
	return $plan;
}

function td_seo_legacy_apply(): int {
	$n = 0;
	foreach (td_seo_legacy_plan() as $row) {
		if ($row['state'] !== 'apply') continue;
		td_seo_set($row['target'], $row['field'], (string) $row['new']);
		$n++;
	}
	return $n;
}

function td_seo_legacy_panel(): void {
	$plan = array_filter(td_seo_legacy_plan(), fn ($r) => $r['state'] !== 'keep');
	if (!$plan) return;
	$label = ['done' => 'ใช้ค่าใหม่แล้ว', 'apply' => 'จะเปลี่ยน', 'edited' => 'มีคนแก้ใน Rank Math แล้ว · ข้าม', 'missing' => 'ไม่พบหน้า · ข้าม'];
	$todo = count(array_filter($plan, fn ($r) => $r['state'] === 'apply'));
	echo '<h2>SEO หน้าเดิม 22 URL (Rank Math)</h2>';
	echo '<p>title / description ที่อาร์ตเคาะ 30 ต.ค. 2026 · ช่องที่ไม่อยู่ในตาราง = คงของเดิม · หลังกดใช้ ล้างแคช (ปลั๊กอินแคช / Cloudflare) แล้ว Google จะเห็นเมื่อเก็บหน้าใหม่</p>';
	if (isset($_GET['seo'])) printf('<div class="notice notice-success"><p>เปลี่ยนแล้ว %d ช่อง</p></div>', (int) $_GET['seo']);
	echo '<table class="widefat striped"><thead><tr><th>URL</th><th>ช่อง</th><th>ตอนนี้</th><th>ใหม่</th><th>สถานะ</th></tr></thead><tbody>';
	foreach ($plan as $r) {
		printf('<tr><td><code>%s</code></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
			esc_html($r['route']), esc_html($r['field']), esc_html($r['cur'] !== '' ? $r['cur'] : '(แม่แบบ Rank Math)'), esc_html((string) $r['new']), esc_html($label[$r['state']]));
	}
	echo '</tbody></table>';
	if ($todo) {
		echo '<form method="post" action="' . esc_url(admin_url('admin-post.php')) . '">';
		wp_nonce_field('teamdee_seo_legacy');
		echo '<input type="hidden" name="action" value="teamdee_seo_legacy">';
		submit_button(sprintf('ใช้ข้อความใหม่ (%d ช่อง)', $todo));
		echo '</form>';
	}
}

add_action('admin_post_teamdee_seo_legacy', function () {
	if (!current_user_can('manage_options')) wp_die('ไม่มีสิทธิ์');
	check_admin_referer('teamdee_seo_legacy');
	$n = td_seo_legacy_apply();
	wp_safe_redirect(admin_url('tools.php?page=teamdee-pages&seo=' . $n));
	exit;
});

/* Preserve the audited legacy alias only when WordPress has no page at
 * the old URL and the destination is published. Existing redirect plugins and
 * existing content retain ownership. No redirect for POST/form submissions. */
add_action('template_redirect', function () {
	if (!is_404() || !in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) return;
	$aliases = ['/terms/' => 'terms-conditions'];
	$route = td_request_route();
	if (!isset($aliases[$route])) return;
	$target = get_page_by_path($aliases[$route]);
	if (!$target || get_post_status($target) !== 'publish') return;
	wp_safe_redirect(get_permalink($target), 301, 'TEAMDEE legacy URL');
	exit;
}, 9);

/* หน้าเดิมที่ต้นแบบไม่มีแทน → 301 ไปหน้าหัวข้อเดียวกัน (อาร์ตเคาะ 30 ต.ค. รอบ 48 ข้อ 12)
   เนื้อหาเดิมฝังหัวเว็บ/ท้ายเว็บของธีมเก่าไว้ในตัวหน้า แสดงในธีมใหม่จะมีเมนูซ้อน · ทำงานแม้หน้าเดิมยังอยู่ใน WordPress
   /serviecs/ (ลิงก์สะกดผิดในเมนูเดิม) ไปปลายทางเลย ไม่ต่อทอดผ่าน /services/ · เปลี่ยนปลายทาง → filter teamdee_retired_pages */
const TD_RETIRED = [
	'/pdpa/' => '/privacy-policy/',
	'/production-techniques/' => '/shirt-production-techniques-guide/', // บทความเดิมบน CMS หัวข้อเดียวกัน (/blog/…/ ของต้นแบบยังไม่ขึ้น WP)
	'/services/' => '/',
	'/serviecs/' => '/',
];
function td_retired_target(string $route): ?string {
	$map = (array) apply_filters('teamdee_retired_pages', TD_RETIRED);
	return isset($map[$route]) ? (string) $map[$route] : null;
}
/** ปลายทางมีจริงบน WordPress (หน้าแรก · หน้าจากต้นแบบ · หน้า/บทความใน CMS) · ไม่มี = ไม่ 301 (ไม่ส่งคนไป 404 ที่ browser จำไว้) */
function td_target_exists(string $to): bool {
	return $to === '/' || td_page($to) !== null || url_to_postid(home_url($to)) > 0;
}
add_action('template_redirect', function () {
	if (!in_array($_SERVER['REQUEST_METHOD'] ?? 'GET', ['GET', 'HEAD'], true)) return;
	$to = td_retired_target(td_request_route());
	if ($to === null || !td_target_exists($to)) return;
	$qs = isset($_SERVER['QUERY_STRING']) ? (string) $_SERVER['QUERY_STRING'] : '';
	wp_safe_redirect(home_url($to) . ($qs !== '' ? '?' . $qs : ''), 301, 'TEAMDEE retired page');
	exit;
}, 8);
