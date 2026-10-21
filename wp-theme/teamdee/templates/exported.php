<?php
/* หน้าที่มาจากต้นแบบ · body ทั้งก้อน (แถบเมนู เนื้อหา footer แถบติดต่อมือถือ) อยู่ใน build/pages/<slug>.body.html */
defined('ABSPATH') || exit;
$td = td_current();
?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo('charset'); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php wp_head(); ?>
</head>
<body <?php body_class('td-exported td-page-' . sanitize_html_class($td['slug'] ?? '')); ?>>
<?php wp_body_open(); ?>
<?php echo td_read_part($td['slug'] ?? 'home', 'body'); // phpcs:ignore -- HTML จาก build ของเราเอง ?>
<?php wp_footer(); ?>
</body>
</html>
