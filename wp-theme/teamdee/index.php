<?php
/* หน้าชั่วคราว · ยืนยันว่า WordPress ในเครื่องโหลดธีม TEAMDEE ได้ */
?><!doctype html>
<html <?php language_attributes(); ?>>
<head><meta charset="<?php bloginfo('charset'); ?>"><meta name="viewport" content="width=device-width, initial-scale=1"><?php wp_head(); ?></head>
<body <?php body_class(); ?>>
<main style="font-family:system-ui;max-width:640px;margin:80px auto;padding:0 20px">
  <h1>ธีม TEAMDEE · โครงเปล่า</h1>
  <p>WordPress ในเครื่องใช้ธีมนี้อยู่ · หน้าจริงจะทำหลังได้แผนไซต์</p>
  <p>WordPress <?php echo esc_html(get_bloginfo('version')); ?> · PHP <?php echo esc_html(PHP_VERSION); ?></p>
</main>
<?php wp_footer(); ?>
</body>
</html>
