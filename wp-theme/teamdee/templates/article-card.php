<?php
/** Real WordPress post card. Called inside the current query's loop. */
defined('ABSPATH') || exit;
$td_card_categories = get_the_category();
$td_card_heading = is_singular('post') ? 'h3' : 'h2';
?>
<article <?php post_class('td-blog__card'); ?>>
	<?php if (!post_password_required() && has_post_thumbnail()) : ?>
	<a href="<?php the_permalink(); ?>" tabindex="-1" aria-hidden="true"><?php the_post_thumbnail('medium_large', ['class' => 'td-blog__card-image', 'loading' => 'lazy', 'decoding' => 'async', 'alt' => '']); ?></a>
	<?php endif; ?>
	<<?php echo $td_card_heading; ?> class="td-blog__card-title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></<?php echo $td_card_heading; ?>>
	<?php if (!post_password_required() && has_excerpt()) : ?><p class="td-blog__excerpt"><?php echo esc_html(wp_strip_all_tags(get_the_excerpt())); ?></p><?php endif; ?>
	<p class="td-blog__meta"><?php if ($td_card_categories) : ?><span><?php echo esc_html($td_card_categories[0]->name); ?></span> <?php endif; ?><time datetime="<?php echo esc_attr(get_the_date('c')); ?>"><?php echo esc_html(get_the_date()); ?></time></p>
</article>
