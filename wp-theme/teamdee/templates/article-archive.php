<?php
/** Category and actual WordPress posts index. Uses the main query and real pagination. */
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
<main id="main" class="td-blog">
	<div class="td-blog__wrap">
		<nav class="td-blog__crumb" aria-label="เส้นทางหน้า"><a href="<?php echo esc_url(home_url('/')); ?>">หน้าแรก</a><span aria-hidden="true">/</span><a href="<?php echo esc_url(home_url('/blog/')); ?>">บทความและไอเดีย</a></nav>
	<header class="td-blog__intro"><div>
		<h1 class="td-blog__title"><?php echo esc_html(is_category() ? single_cat_title('', false) : 'บทความและไอเดียสั่งทำเสื้อทีม'); ?></h1>
		<?php if (is_category() && category_description()) : ?><div class="td-blog__lead"><?php echo wp_kses_post(category_description()); ?></div><?php else : ?><p class="td-blog__lead">เลือกผ้า เทคนิคผลิต และเตรียมข้อมูลก่อนสั่งทำ</p><?php endif; ?>
	</div><form class="td-blog__search" role="search" action="<?php echo esc_url(home_url('/')); ?>" method="get"><label for="wp-article-query">ค้นหาบทความ</label><input type="hidden" name="post_type" value="post"><div><input type="search" id="wp-article-query" name="s" value="<?php echo esc_attr(get_search_query(false)); ?>" placeholder="ผ้า ไซซ์ หรืองานพิมพ์"><button type="submit" aria-label="ค้นหาบทความ"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="m15 15 6 6"/></svg></button></div></form></header></div>
	<?php if (is_home() && !is_paged() && !is_search()) :
		$td_feature = get_page_by_path('what-is-dft-shirt-printing-durability-guide', OBJECT, 'post');
		$td_idea = get_page_by_path('sublimation-sportswear-designs', OBJECT, 'post');
		$td_idea_more = get_page_by_path('how-to-design-sportswear-color-guide', OBJECT, 'post');
		$td_feature = $td_feature && $td_feature->post_status === 'publish' && !post_password_required($td_feature) ? $td_feature : null;
		$td_idea = $td_idea && $td_idea->post_status === 'publish' && !post_password_required($td_idea) ? $td_idea : null;
		$td_idea_more = $td_idea_more && $td_idea_more->post_status === 'publish' && !post_password_required($td_idea_more) ? $td_idea_more : null;
		if ($td_feature && $td_idea) : ?>
	<div class="td-blog__paths td-blog__wrap">
		<section aria-labelledby="wp-feature-h"><div class="td-blog__section-head"><h2 id="wp-feature-h">เลือกให้เป็น</h2><p>เข้าใจวัสดุและวิธีผลิตก่อนตัดสินใจ</p></div>
			<a class="td-blog__feature" href="<?php echo esc_url(get_permalink($td_feature)); ?>"><?php echo get_the_post_thumbnail($td_feature, 'large', ['fetchpriority' => 'high', 'decoding' => 'async', 'alt' => '']); ?><div class="td-blog__feature-copy"><p class="td-blog__meta"><time datetime="<?php echo esc_attr(get_the_date('c', $td_feature)); ?>"><?php echo esc_html(get_the_date('', $td_feature)); ?></time></p><h3><?php echo esc_html(get_the_title($td_feature)); ?></h3><?php if (has_excerpt($td_feature)) : ?><p class="td-blog__excerpt"><?php echo esc_html(wp_strip_all_tags(get_the_excerpt($td_feature))); ?></p><?php endif; ?><span class="td-blog__read">อ่านเรื่องนี้</span></div></a>
		</section>
		<section class="td-blog__ideas" aria-labelledby="wp-ideas-h"><div class="td-blog__section-head"><h2 id="wp-ideas-h">เห็นไอเดีย</h2><p>ก่อนเริ่มออกแบบ</p></div>
			<a class="td-blog__idea" href="<?php echo esc_url(get_permalink($td_idea)); ?>"><?php echo get_the_post_thumbnail($td_idea, 'medium_large', ['decoding' => 'async', 'alt' => '']); ?><h3><?php echo esc_html(get_the_title($td_idea)); ?></h3></a>
			<?php if ($td_idea_more) : ?><a class="td-blog__idea-small" href="<?php echo esc_url(get_permalink($td_idea_more)); ?>"><?php echo get_the_post_thumbnail($td_idea_more, 'medium', ['loading' => 'lazy', 'decoding' => 'async', 'alt' => '']); ?><div><h3><?php echo esc_html(get_the_title($td_idea_more)); ?></h3></div></a><?php endif; ?>
		</section>
	</div>
	<?php endif; endif; ?>
	<section class="td-blog__wrap" aria-label="รายการบทความ">
		<div class="td-blog__section-head"><h2>บทความทั้งหมด<?php if (is_category()) : ?>ในหมวดนี้<?php endif; ?></h2></div>
		<?php if (have_posts()) : ?>
		<div class="td-blog__grid"><?php while (have_posts()) : the_post(); get_template_part('templates/article-card'); endwhile; ?></div>
		<div class="td-blog__pagination"><?php the_posts_pagination(['mid_size' => 1, 'prev_text' => 'หน้าก่อน', 'next_text' => 'หน้าถัดไป', 'screen_reader_text' => 'หน้าบทความ']); ?></div>
		<?php else : ?><div class="td-reader__empty"><h2>ยังไม่มีบทความในหมวดนี้</h2><p>เลือกอ่านเรื่องอื่นได้จากหน้าบทความทั้งหมด</p><a class="btn btn-line" href="<?php echo esc_url(home_url('/blog/')); ?>">ดูบทความทั้งหมด</a></div><?php endif; ?>
	</section>
</main>
<?php echo td_chrome('footer'); // phpcs:ignore ?>
<?php wp_footer(); ?>
</body>
</html>
