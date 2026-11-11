<?php
/** CMS reader: preserve WordPress content, URLs and plugin-provided SEO. */
defined('ABSPATH') || exit;
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<?php echo td_chrome('header'); // phpcs:ignore ?>
<main id="main" class="td-reader">
<?php while (have_posts()) : the_post();
$td_categories = get_the_category();
$td_protected = post_password_required();
$td_cover_id = get_post_thumbnail_id();
$td_raw_content = (string) get_post_field('post_content', get_the_ID());
$td_cover_url = $td_cover_id ? wp_get_attachment_url($td_cover_id) : false;
// Do not repeat a featured image already embedded in the untouched CMS body.
$td_cover_in_body = $td_cover_id && (preg_match('/\bwp-image-' . (int) $td_cover_id . '\b/', $td_raw_content) || ($td_cover_url && str_contains($td_raw_content, $td_cover_url)));
?>
	<article <?php post_class(); ?>>
		<header class="td-reader__header wrap">
			<nav class="td-reader__crumb" aria-label="เส้นทางหน้า"><a href="<?php echo esc_url(home_url('/')); ?>">หน้าแรก</a><span aria-hidden="true">/</span><a href="<?php echo esc_url(home_url('/blog/')); ?>">บทความและไอเดีย</a><?php if ($td_categories) : ?><span aria-hidden="true">/</span><a href="<?php echo esc_url(get_category_link($td_categories[0]->term_id)); ?>"><?php echo esc_html($td_categories[0]->name); ?></a><?php endif; ?></nav>
			<h1 class="td-reader__title"><?php the_title(); ?></h1>
			<p class="td-reader__meta"><span>เผยแพร่ <time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date()); ?></time></span><?php if (get_the_modified_time('U') > get_the_time('U') && get_the_modified_date('Y-m-d') !== get_the_date('Y-m-d')) : ?><span>อัปเดต <time datetime="<?php echo esc_attr(get_the_modified_date('c')); ?>"><?php echo esc_html(get_the_modified_date()); ?></time></span><?php endif; ?></p>
			<?php if (!$td_protected && has_excerpt()) : ?><p class="td-reader__lead"><?php echo esc_html(wp_strip_all_tags(get_the_excerpt())); ?></p><?php endif; ?>
			<?php if (!$td_protected && $td_cover_id && !$td_cover_in_body) : ?><figure class="td-reader__cover"><?php the_post_thumbnail('large', ['fetchpriority' => 'high', 'decoding' => 'async']); ?></figure><?php endif; ?>
		</header>
		<div class="td-reader__layout wrap">
			<aside class="td-reader__toc" hidden><details open><summary>ในบทความนี้</summary><nav aria-label="สารบัญบทความ" data-reader-toc><ol></ol></nav></details></aside>
			<div class="td-reader__body td-prose" data-reader-content><?php the_content(); ?><?php wp_link_pages(['before' => '<nav class="td-reader__pagination" aria-label="หน้าของบทความ">', 'after' => '</nav>']); ?></div>
		</div>
	</article>
	<?php
	$td_related = $td_categories ? new WP_Query([
		'post_type' => 'post', 'post_status' => 'publish', 'posts_per_page' => 3,
		'post__not_in' => [get_the_ID()], 'category__in' => wp_list_pluck($td_categories, 'term_id'),
		'ignore_sticky_posts' => true, 'no_found_rows' => true, 'has_password' => false,
	]) : null;
	if ($td_related && $td_related->have_posts()) : ?>
	<section class="td-reader__related td-blog wrap" aria-labelledby="related-h"><h2 id="related-h">อ่านต่อในเรื่องที่เกี่ยวข้อง</h2><div class="td-blog__grid">
	<?php while ($td_related->have_posts()) : $td_related->the_post(); get_template_part('templates/article-card'); endwhile; ?>
	</div></section>
	<?php endif; wp_reset_postdata(); ?>
<?php endwhile; ?>
	<section class="td-reader__end wrap" aria-labelledby="reader-end-h"><h2 id="reader-end-h">นำข้อมูลไปเริ่มงานเสื้อทีมของคุณ</h2><p>เลือกดูแบบเสื้อ หรือเล่าโจทย์ให้ทีมดีช่วยดูต่อ</p><div class="td-reader__end-actions"><a class="btn btn-orange" href="<?php echo esc_url(home_url('/contact-us/?from=blog')); ?>">ปรึกษาเรื่องสั่งทำเสื้อ</a><a class="btn btn-line" href="<?php echo esc_url(home_url('/designs/')); ?>">ดูแบบเสื้อ</a></div></section>
</main>
<?php echo td_chrome('footer'); // phpcs:ignore ?>
<?php wp_footer(); ?>
</body>
</html>
