<?php
/* บทความและหน้าอื่นของ WordPress ที่ไม่ได้มาจากต้นแบบ
   แถบเมนูกับ footer ตัดจากหน้า /blog/ ของต้นแบบ (td_chrome) หน้าตาจึงเป็นชุดเดียวกัน
   หน้าตาบทความแบบละเอียดรอแผนไซต์ (พฤ. 22 ต.ค. 2026) */
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
<main id="main" class="wrap section">
	<?php if (have_posts()) : ?>
		<?php if (!is_singular()) : ?><h1 class="t-display text-[clamp(30px,4.4vw,52px)] mb-10"><?php echo esc_html(is_home() ? 'บทความ' : wp_strip_all_tags(get_the_archive_title())); ?></h1><?php endif; ?>
		<?php while (have_posts()) : the_post(); ?>
			<article <?php post_class(is_singular() ? 'max-w-[72ch]' : 'py-6 border-b border-line'); ?>>
				<?php if (is_singular()) : ?>
					<h1 class="t-display text-[clamp(30px,4.4vw,52px)]"><?php the_title(); ?></h1>
					<p class="t-xs mt-3"><?php echo esc_html(get_the_date()); ?></p>
					<div class="td-prose mt-8"><?php the_content(); ?></div>
				<?php else : ?>
					<h2 class="text-[22px]"><a class="underline decoration-orange decoration-2 underline-offset-4" href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<p class="t-xs mt-2"><?php echo esc_html(get_the_date()); ?></p>
				<?php endif; ?>
			</article>
		<?php endwhile; ?>
		<?php if (!is_singular()) the_posts_pagination(); ?>
	<?php else : ?>
		<h1 class="t-display text-[clamp(30px,4.4vw,52px)]">ไม่พบหน้าที่ต้องการ</h1>
		<p class="t-lead mt-4"><a class="underline decoration-orange decoration-2 underline-offset-4" href="<?php echo esc_url(home_url('/')); ?>">กลับหน้าแรก</a></p>
	<?php endif; ?>
</main>
<?php echo td_chrome('footer'); // phpcs:ignore ?>
<?php wp_footer(); ?>
</body>
</html>
