import './page.js'
import { initGuideMaterialLab } from './guide-material-lab.js'
import { initGuideProcessStudio } from './guide-process-studio.js'
import { initArticleReader } from './article-reader.js'
import { initGuideNavigation } from './guide-navigation.js'
import { initToc } from './about-toc.js'

initArticleReader()
initGuideNavigation()
/* สารบัญติดใต้หัวเว็บชุดเดียวกับหน้ารู้จักทีมดี/หน้าสินค้า (27 ต.ค.) */
initToc()
initGuideMaterialLab()
initGuideProcessStudio()
