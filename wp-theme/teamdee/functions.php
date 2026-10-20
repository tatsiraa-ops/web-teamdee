<?php
/* ธีม TEAMDEE · โครงเปล่า ยังไม่มีหน้าจริง
   CSS/JS จะ build จากต้นแบบด้วย Vite แล้ว enqueue จากที่นี่ (ทำหลังได้แผนไซต์) */

add_action('after_setup_theme', function () {
	add_theme_support('title-tag');
	add_theme_support('post-thumbnails');
});
